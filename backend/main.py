from datetime import date
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel as PydanticModel, Field

from models import (
    Usuario, Curso, Alumno, Asignatura,
    Asistencia, LibroTemas, ActividadEvaluacion,
    inicializar_bd
)
from auth import (
    hashear_password, verificar_password,
    crear_access_token, obtener_usuario_actual, requerir_roles
)
from reportes import generar_pdf_asistencia_curso, generar_pdf_libro_temas

app = FastAPI(
    title="API Gestión Escolar PWA - ISFD San Roque",
    description="Backend para Control de Asistencia, Alertas de Regularidad y Libro de Temas Digital.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INICIALIZACIÓN Y USUARIO ADMIN POR DEFECTO ---
@app.on_event("startup")
def startup():
    inicializar_bd()
    if not Usuario.select().where(Usuario.rol == "admin").exists():
        Usuario.create(
            dni="00000000",
            nombre="Administrador",
            apellido="Sistema",
            email="admin@escuela.edu.ar",
            password_hash=hashear_password("admin123"),
            rol="admin"
        )

# --- ESQUEMAS PYDANTIC ---
class UsuarioCreate(PydanticModel):
    dni: str
    nombre: str
    apellido: str
    email: str
    password: str
    rol: str  # 'admin', 'preceptor', 'docente', 'alumno'

class CursoCreate(PydanticModel):
    anio: int
    division: str
    turno: str
    ciclo_lectivo: Optional[int] = date.today().year

class AlumnoCreate(PydanticModel):
    dni: str
    nombre: str
    apellido: str
    curso_id: int
    usuario_id: Optional[int] = None

class AsignaturaCreate(PydanticModel):
    nombre: str
    curso_id: int
    docente_id: int

class AsistenciaItem(PydanticModel):
    alumno_id: int
    estado: str = Field(..., pattern="^[PAJT]$")
    observacion: Optional[str] = None

class AsistenciaMasivaCreate(PydanticModel):
    asignatura_id: int
    fecha: Optional[date] = None
    registros: List[AsistenciaItem]

class LibroTemasCreate(PydanticModel):
    asignatura_id: int
    fecha: Optional[date] = None
    unidad_didactica: str
    eje_tematico: str
    contenidos_dictados: str
    observaciones_pedagogicas: Optional[str] = None

class ActividadCreate(PydanticModel):
    libro_tema_id: int
    tipo: str
    descripcion: str
    fecha_entrega: date

# ==========================================
# 1. AUTENTICACIÓN Y USUARIOS
# ==========================================
@app.get("/", tags=["Sistema"])
def health_check():
    return {"status": "ok", "proyecto": "TP Final PP III - Gestión Escolar"}

@app.post("/auth/login", tags=["Autenticación"])
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    usuario = Usuario.get_or_none((Usuario.email == form_data.username) & (Usuario.activo == True))
    if not usuario or not verificar_password(form_data.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    token = crear_access_token({"sub": str(usuario.id), "rol": usuario.rol})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nombre": f"{usuario.nombre} {usuario.apellido}",
            "rol": usuario.rol
        }
    }

@app.post("/usuarios/", status_code=201, tags=["Usuarios"])
def crear_usuario(
    datos: UsuarioCreate,
    _: Usuario = Depends(requerir_roles(["admin"]))
):
    if datos.rol not in ("admin", "preceptor", "docente", "alumno"):
        raise HTTPException(status_code=400, detail="Rol inválido")
    if Usuario.select().where((Usuario.dni == datos.dni) | (Usuario.email == datos.email)).exists():
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese DNI o Email")

    nuevo = Usuario.create(
        dni=datos.dni,
        nombre=datos.nombre,
        apellido=datos.apellido,
        email=datos.email,
        password_hash=hashear_password(datos.password),
        rol=datos.rol
    )
    return {"id": nuevo.id, "mensaje": f"Usuario {nuevo.rol} creado correctamente"}

# ==========================================
# 2. ESTRUCTURA INSTITUCIONAL
# ==========================================
@app.post("/cursos/", status_code=201, tags=["Estructura Académica"])
def crear_curso(
    datos: CursoCreate,
    _: Usuario = Depends(requerir_roles(["admin", "preceptor"]))
):
    curso = Curso.create(**datos.model_dump())
    return {"id": curso.id, "mensaje": f"Curso {curso.anio}° {curso.division} creado"}

@app.get("/cursos/", tags=["Estructura Académica"])
def listar_cursos(_: Usuario = Depends(obtener_usuario_actual)):
    return list(Curso.select().dicts())

@app.post("/alumnos/", status_code=201, tags=["Estructura Académica"])
def crear_alumno(
    datos: AlumnoCreate,
    _: Usuario = Depends(requerir_roles(["admin", "preceptor"]))
):
    if Alumno.select().where(Alumno.dni == datos.dni).exists():
        raise HTTPException(status_code=400, detail="Ya existe un alumno con ese DNI")
    if not Curso.get_or_none(Curso.id == datos.curso_id):
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    alumno = Alumno.create(**datos.model_dump())
    return {"id": alumno.id, "mensaje": "Alumno matriculado correctamente"}

@app.get("/alumnos/", tags=["Estructura Académica"])
def listar_alumnos(
    curso_id: Optional[int] = None,
    _: Usuario = Depends(obtener_usuario_actual)
):
    query = Alumno.select().where(Alumno.activo == True)
    if curso_id:
        query = query.where(Alumno.curso == curso_id)
    return list(query.dicts())

@app.post("/asignaturas/", status_code=201, tags=["Estructura Académica"])
def crear_asignatura(
    datos: AsignaturaCreate,
    _: Usuario = Depends(requerir_roles(["admin", "preceptor"]))
):
    docente = Usuario.get_or_none((Usuario.id == datos.docente_id) & (Usuario.rol == "docente"))
    if not docente:
        raise HTTPException(status_code=400, detail="El ID indicado no corresponde a un docente activo")
    if not Curso.get_or_none(Curso.id == datos.curso_id):
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    materia = Asignatura.create(**datos.model_dump())
    return {"id": materia.id, "mensaje": f"Asignatura '{materia.nombre}' asignada"}

# ==========================================
# 3. MÓDULO 1: ASISTENCIAS Y ALERTAS
# ==========================================
@app.post("/asistencias/lote/", status_code=201, tags=["Módulo 1: Asistencias"])
def registrar_asistencia_curso(
    datos: AsistenciaMasivaCreate,
    _: Usuario = Depends(requerir_roles(["admin", "preceptor", "docente"]))
):
    asignatura = Asignatura.get_or_none(Asignatura.id == datos.asignatura_id)
    if not asignatura:
        raise HTTPException(status_code=404, detail="Asignatura no encontrada")

    fecha_registro = datos.fecha or date.today()
    creados = 0

    for item in datos.registros:
        alumno = Alumno.get_or_none(Alumno.id == item.alumno_id)
        if not alumno:
            continue
        registro, creado = Asistencia.get_or_create(
            alumno=alumno,
            asignatura=asignatura,
            fecha=fecha_registro,
            defaults={"estado": item.estado, "observacion": item.observacion}
        )
        if not creado:
            registro.estado = item.estado
            registro.observacion = item.observacion
            registro.save()
        creados += 1

    return {"mensaje": f"Se procesaron {creados} registros de asistencia para {fecha_registro}"}

@app.get("/asistencias/alertas/{curso_id}", tags=["Módulo 1: Asistencias"])
def obtener_alertas_ausentismo(
    curso_id: int,
    limite_regularidad: float = 75.0,
    _: Usuario = Depends(requerir_roles(["admin", "preceptor", "docente"]))
):
    alumnos = Alumno.select().where((Alumno.curso == curso_id) & (Alumno.activo == True))
    reporte = []

    for al in alumnos:
        registros = list(
            Asistencia.select()
            .where(Asistencia.alumno == al)
            .order_by(Asistencia.fecha.asc())
        )
        total_clases = len(registros)
        if total_clases == 0:
            continue

        puntos_asistencia = sum(
            1.0 if r.estado in ("P", "J") else (0.5 if r.estado == "T" else 0.0)
            for r in registros
        )
        porcentaje = round((puntos_asistencia / total_clases) * 100, 2)

        faltas_consecutivas = 0
        for r in reversed(registros):
            if r.estado == "A":
                faltas_consecutivas += 1
            else:
                break

        en_riesgo_regularidad = porcentaje < limite_regularidad
        alerta_consecutivas = faltas_consecutivas >= 3

        if en_riesgo_regularidad or alerta_consecutivas:
            reporte.append({
                "alumno_id": al.id,
                "alumno": f"{al.apellido}, {al.nombre}",
                "dni": al.dni,
                "total_clases": total_clases,
                "porcentaje_asistencia": porcentaje,
                "faltas_consecutivas": faltas_consecutivas,
                "alerta_regularidad": en_riesgo_regularidad,
                "alerta_consecutivas": alerta_consecutivas
            })

    return {"curso_id": curso_id, "limite_aplicado": limite_regularidad, "alertas": reporte}

# ==========================================
# 4. MÓDULO 2: LIBRO DE TEMAS DIGITAL
# ==========================================
@app.post("/libro-temas/", status_code=201, tags=["Módulo 2: Libro de Temas"])
def registrar_tema_diario(
    datos: LibroTemasCreate,
    usuario: Usuario = Depends(requerir_roles(["admin", "docente", "preceptor"]))
):
    asignatura = Asignatura.get_or_none(Asignatura.id == datos.asignatura_id)
    if not asignatura:
        raise HTTPException(status_code=404, detail="Asignatura no encontrada")

    if usuario.rol == "docente" and asignatura.docente.id != usuario.id:
        raise HTTPException(status_code=403, detail="Solo podés cargar temas en tus propias asignaturas")

    entrada = LibroTemas.create(
        asignatura=asignatura,
        fecha=datos.fecha or date.today(),
        unidad_didactica=datos.unidad_didactica,
        eje_tematico=datos.eje_tematico,
        contenidos_dictados=datos.contenidos_dictados,
        observaciones_pedagogicas=datos.observaciones_pedagogicas
    )
    return {"id": entrada.id, "mensaje": "Clase registrada en el Libro de Temas"}

@app.get("/libro-temas/{asignatura_id}", tags=["Módulo 2: Libro de Temas"])
def listar_temas_asignatura(
    asignatura_id: int,
    _: Usuario = Depends(obtener_usuario_actual)
):
    temas = (
        LibroTemas.select()
        .where(LibroTemas.asignatura == asignatura_id)
        .order_by(LibroTemas.fecha.desc())
    )
    resultado = []
    for t in temas:
        actividades = list(t.actividades.dicts())
        item = t.__data__.copy()
        item["actividades"] = actividades
        resultado.append(item)
    return resultado

@app.post("/libro-temas/actividades/", status_code=201, tags=["Módulo 2: Libro de Temas"])
def agregar_actividad_o_evaluacion(
    datos: ActividadCreate,
    _: Usuario = Depends(requerir_roles(["admin", "docente"]))
):
    if not LibroTemas.get_or_none(LibroTemas.id == datos.libro_tema_id):
        raise HTTPException(status_code=404, detail="Registro de Libro de Temas no encontrado")

    act = ActividadEvaluacion.create(**datos.model_dump())
    return {"id": act.id, "mensaje": f"{act.tipo} agendada para el {act.fecha_entrega}"}

# ==========================================
# 5. REPORTABILIDAD (EXPORTACIÓN A PDF)
# ==========================================
@app.get("/reportes/asistencia/{curso_id}/pdf", tags=["Reportes PDF"])
def descargar_pdf_asistencia(
    curso_id: int,
    limite_regularidad: float = 75.0,
    _: Usuario = Depends(requerir_roles(["admin", "preceptor", "docente"]))
):
    curso = Curso.get_or_none(Curso.id == curso_id)
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    alumnos = Alumno.select().where((Alumno.curso == curso_id) & (Alumno.activo == True)).order_by(Alumno.apellido.asc())
    filas = []

    for al in alumnos:
        registros = list(Asistencia.select().where(Asistencia.alumno == al))
        total = len(registros)
        if total == 0:
            porcentaje = 100.0
        else:
            puntos = sum(1.0 if r.estado in ("P", "J") else (0.5 if r.estado == "T" else 0.0) for r in registros)
            porcentaje = round((puntos / total) * 100, 2)

        condicion = "Regular" if porcentaje >= limite_regularidad else "En Riesgo"
        filas.append({
            "dni": al.dni,
            "alumno": f"{al.apellido}, {al.nombre}",
            "total_clases": total,
            "porcentaje": porcentaje,
            "condicion": condicion
        })

    curso_str = f"{curso.anio}° '{curso.division}' - Turno {curso.turno}"
    pdf_bytes = generar_pdf_asistencia_curso(curso_str, filas)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=asistencia_curso_{curso_id}.pdf"}
    )

@app.get("/reportes/libro-temas/{asignatura_id}/pdf", tags=["Reportes PDF"])
def descargar_pdf_libro_temas(
    asignatura_id: int,
    _: Usuario = Depends(requerir_roles(["admin", "preceptor", "docente"]))
):
    asignatura = Asignatura.get_or_none(Asignatura.id == asignatura_id)
    if not asignatura:
        raise HTTPException(status_code=404, detail="Asignatura no encontrada")

    temas = list(
        LibroTemas.select()
        .where(LibroTemas.asignatura == asignatura_id)
        .order_by(LibroTemas.fecha.asc())
        .dicts()
    )

    curso_str = f"{asignatura.curso.anio}° '{asignatura.curso.division}' ({asignatura.curso.turno})"
    docente_str = f"{asignatura.docente.apellido}, {asignatura.docente.nombre}"
    pdf_bytes = generar_pdf_libro_temas(asignatura.nombre, curso_str, docente_str, temas)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=libro_temas_{asignatura_id}.pdf"}
    )