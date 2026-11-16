"""
Punto de entrada principal del Backend (FastAPI).

Arquitectura pensada para PWA Docente Mobile-First:
- Inicialización automática del esquema SQLite mediante `lifespan`.
- Gestión limpia de conexiones Peewee por ciclo de petición HTTP.
- Endpoints optimizados para interacción táctil en el aula (ej. registro idempotente
  de asistencia que devuelve en tiempo real el porcentaje actualizado y la alerta de libre).
"""

from contextlib import asynccontextmanager
from datetime import date, datetime
from typing import List, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from peewee import IntegrityError
from pydantic import BaseModel, Field

from models import (
    Alumno,
    Asistencia,
    UMBRAL_REGULARIDAD_DEFAULT,
    db,
    inicializar_bd,
)


# =====================================================================
# Ciclo de Vida de la Aplicación y Conexión a Base de Datos
# =====================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa las tablas en SQLite al arrancar el servidor."""
    inicializar_bd()
    yield
    if not db.is_closed():
        db.close()


def obtener_bd():
    """
    Dependencia por request para garantizar que la conexión de Peewee
    esté abierta durante la petición y se cierre al finalizar.
    """
    if db.is_closed():
        db.connect()
    try:
        yield
    finally:
        if not db.is_closed():
            db.close()


app = FastAPI(
    title="API Gestión Escolar PWA",
    description=(
        "Backend ultraliviano con FastAPI + Peewee (SQLite) para control de "
        "asistencia en tiempo real y gestión áulica mobile-first."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Habilitar CORS para permitir peticiones desde el frontend React + Vite (PWA)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En desarrollo permite acceso desde celulares en la red local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================================
# Esquemas Pydantic (Validación de Entrada y Serialización de Salida)
# =====================================================================

EstadoAsistenciaLiteral = Literal["PRESENTE", "AUSENTE", "TARDE", "JUSTIFICADO"]


class MetricasAsistenciaSchema(BaseModel):
    total_clases: int
    presentes: int
    ausentes: int
    tardes: int
    justificados: int
    porcentaje_asistencia: float
    alerta_libre: bool = Field(
        description="True cuando el porcentaje cae por debajo del umbral de regularidad (alerta roja UI)."
    )


class AlumnoCreateSchema(BaseModel):
    legajo: str = Field(..., min_length=1, max_length=20, examples=["LEG-2026-001"])
    nombre: str = Field(..., min_length=1, max_length=80, examples=["Martín"])
    apellido: str = Field(..., min_length=1, max_length=80, examples=["Gómez"])
    email: Optional[str] = Field(None, max_length=120, examples=["martin.gomez@escuela.edu.ar"])


class AlumnoResponseSchema(BaseModel):
    id: int
    legajo: str
    nombre: str
    apellido: str
    email: Optional[str]
    activo: bool
    estado_hoy: Optional[EstadoAsistenciaLiteral] = Field(
        None,
        description="Estado de asistencia en la fecha consultada (útil para tarjetas táctiles).",
    )
    metricas: MetricasAsistenciaSchema


class AsistenciaUpsertSchema(BaseModel):
    alumno_id: int = Field(..., description="ID del alumno a calificar presentismo.")
    fecha: date = Field(default_factory=date.today, description="Fecha de la clase (por defecto hoy).")
    estado: EstadoAsistenciaLiteral = Field(default="PRESENTE")
    observacion: Optional[str] = Field(None, max_length=250)


class AsistenciaResponseSchema(BaseModel):
    id: int
    alumno_id: int
    fecha: date
    estado: EstadoAsistenciaLiteral
    observacion: Optional[str]
    metricas_actualizadas: MetricasAsistenciaSchema


# =====================================================================
# Endpoints de Diagnóstico
# =====================================================================

@app.get("/", tags=["Sistema"])
def read_root():
    """Endpoint raíz de prueba para verificar que la API está en línea."""
    return {"status": "API Escolar online"}


@app.get("/api/health", tags=["Sistema"])
def health_check():
    """Verifica que el backend y el motor SQLite estén operativos."""
    return {
        "status": "ok",
        "motor_bd": "SQLite3 (Peewee ORM)",
        "umbral_regularidad": UMBRAL_REGULARIDAD_DEFAULT,
    }


# =====================================================================
# Endpoints de Alumnos
# =====================================================================

@app.get(
    "/api/alumnos",
    response_model=List[AlumnoResponseSchema],
    dependencies=[Depends(obtener_bd)],
    tags=["Alumnos"],
)
def listar_alumnos(
    fecha_consulta: date = Query(
        default_factory=date.today,
        description="Fecha para conocer el estado de asistencia marcado en el día.",
    ),
    solo_activos: bool = Query(default=True),
):
    """
    Devuelve el padrón de alumnos ordenado alfabéticamente junto con su porcentaje
    de asistencia calculado en tiempo real y el indicador de alerta roja (`alerta_libre`).
    """
    query = Alumno.select()
    if solo_activos:
        query = query.where(Alumno.activo == True)  # noqa: E712

    query = query.order_by(Alumno.apellido.asc(), Alumno.nombre.asc())

    resultado: List[AlumnoResponseSchema] = []
    for alumno in query:
        metricas = alumno.calcular_metricas_asistencia()
        asistencia_dia = (
            Asistencia.select()
            .where((Asistencia.alumno == alumno) & (Asistencia.fecha == fecha_consulta))
            .first()
        )
        resultado.append(
            AlumnoResponseSchema(
                id=alumno.id,
                legajo=alumno.legajo,
                nombre=alumno.nombre,
                apellido=alumno.apellido,
                email=alumno.email,
                activo=alumno.activo,
                estado_hoy=asistencia_dia.estado if asistencia_dia else None,
                metricas=MetricasAsistenciaSchema(**metricas),
            )
        )
    return resultado


@app.post(
    "/api/alumnos",
    response_model=AlumnoResponseSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(obtener_bd)],
    tags=["Alumnos"],
)
def crear_alumno(datos: AlumnoCreateSchema):
    """Da de alta un nuevo alumno validando unicidad de legajo."""
    try:
        alumno = Alumno.create(
            legajo=datos.legajo.strip(),
            nombre=datos.nombre.strip(),
            apellido=datos.apellido.strip(),
            email=datos.email.strip() if datos.email else None,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un alumno registrado con el legajo '{datos.legajo}'.",
        )

    metricas = alumno.calcular_metricas_asistencia()
    return AlumnoResponseSchema(
        id=alumno.id,
        legajo=alumno.legajo,
        nombre=alumno.nombre,
        apellido=alumno.apellido,
        email=alumno.email,
        activo=alumno.activo,
        estado_hoy=None,
        metricas=MetricasAsistenciaSchema(**metricas),
    )


# =====================================================================
# Endpoints de Control de Asistencia (Mobile-First Tap-Friendly)
# =====================================================================

@app.post(
    "/api/asistencias",
    response_model=AsistenciaResponseSchema,
    dependencies=[Depends(obtener_bd)],
    tags=["Asistencias"],
)
def registrar_asistencia(datos: AsistenciaUpsertSchema):
    """
    Registra o actualiza (Upsert) la asistencia de un alumno en una fecha.
    Pensado para uso táctil rápido: si el docente toca nuevamente la tarjeta del alumno
    en el mismo día para corregir de AUSENTE a TARDE o PRESENTE, se actualiza el registro
    existente manteniendo la restricción UNIQUE(alumno_id, fecha) y devolviendo el nuevo
    porcentaje instantáneamente.
    """
    alumno = Alumno.get_or_none(Alumno.id == datos.alumno_id)
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el alumno con ID {datos.alumno_id}.",
        )

    registro = (
        Asistencia.select()
        .where((Asistencia.alumno == alumno) & (Asistencia.fecha == datos.fecha))
        .first()
    )

    if registro:
        registro.estado = datos.estado
        registro.observacion = datos.observacion
        registro.actualizado_en = datetime.now()
        registro.save()
    else:
        registro = Asistencia.create(
            alumno=alumno,
            fecha=datos.fecha,
            estado=datos.estado,
            observacion=datos.observacion,
        )

    metricas_actualizadas = alumno.calcular_metricas_asistencia()

    return AsistenciaResponseSchema(
        id=registro.id,
        alumno_id=alumno.id,
        fecha=registro.fecha,
        estado=registro.estado,
        observacion=registro.observacion,
        metricas_actualizadas=MetricasAsistenciaSchema(**metricas_actualizadas),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

