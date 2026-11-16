"""
Modelos de Base de Datos Relacional con Peewee ORM y SQLite.

Decisiones de Arquitectura para Defensa Técnica:
1. Ultraliviano (Cero SQLAlchemy/Pandas): Peewee provee un ORM expresivo y minimalista,
   ideal para una PWA escolar ágil con bajo consumo de memoria.
2. Integridad Referencial Estricta: SQLite desactiva las claves foráneas por defecto en
   cada conexión. Se fuerza `foreign_keys = 1` a nivel de PRAGMA.
3. Concurrencia Mobile-First: Se activa `journal_mode = wal` (Write-Ahead Logging) para
   permitir lecturas concurrentes mientras el docente registra asistencias rápidamente.
4. Tercera Forma Normal (3FN): No se almacena el porcentaje de asistencia como columna
   física en `Alumno` para evitar anomalías de actualización. Se calcula en tiempo real
   a partir de los registros atómicos en `Asistencia`.
"""

from datetime import date, datetime
from pathlib import Path
from typing import Dict, Any

from peewee import (
    SqliteDatabase,
    Model,
    AutoField,
    CharField,
    BooleanField,
    DateField,
    DateTimeField,
    ForeignKeyField,
    TextField,
    Check,
)

# Ruta absoluta hacia el archivo SQLite dentro del directorio backend/
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "gestion_escolar.db"

# Configuración de SQLite con PRAGMAs para integridad referencial y rendimiento
db = SqliteDatabase(
    str(DB_PATH),
    pragmas={
        "foreign_keys": 1,          # Obligatorio en SQLite para cumplir ON DELETE/UPDATE CASCADE
        "journal_mode": "wal",      # Mejor concurrencia para escrituras táctiles rápidas
        "cache_size": -1024 * 32,   # ~32MB de caché en memoria para consultas instantáneas
        "synchronous": "normal",    # Balance óptimo entre seguridad en disco y velocidad
    },
)

# Estados válidos de asistencia y peso en el cómputo de presentismo
ESTADOS_ASISTENCIA = ("PRESENTE", "AUSENTE", "TARDE", "JUSTIFICADO")
UMBRAL_REGULARIDAD_DEFAULT = 75.0  # Debajo de 75% de asistencia el alumno entra en alerta roja


class BaseModel(Model):
    """Modelo base que vincula todas las entidades a la misma instancia de SQLite."""

    class Meta:
        database = db


class Alumno(BaseModel):
    """
    Entidad que representa a un estudiante del curso.
    Normalizada en 3FN: solo contiene atributos propios del alumno.
    """

    id = AutoField(primary_key=True)
    legajo = CharField(max_length=20, unique=True, index=True)
    nombre = CharField(max_length=80, null=False)
    apellido = CharField(max_length=80, null=False)
    email = CharField(max_length=120, null=True)
    activo = BooleanField(default=True)
    creado_en = DateTimeField(default=datetime.now)

    class Meta:
        table_name = "alumnos"
        order_by = ("apellido", "nombre")

    def calcular_metricas_asistencia(
        self, umbral_regularidad: float = UMBRAL_REGULARIDAD_DEFAULT
    ) -> Dict[str, Any]:
        """
        Calcula en tiempo real las métricas de presentismo del alumno.
        Regla de negocio:
        - PRESENTE y JUSTIFICADO suman 1.0 asistencia.
        - TARDE computa como media falta (suma 0.5 de asistencia).
        - AUSENTE suma 0.0.
        """
        registros = list(self.asistencias)
        total_clases = len(registros)

        if total_clases == 0:
            return {
                "total_clases": 0,
                "presentes": 0,
                "ausentes": 0,
                "tardes": 0,
                "justificados": 0,
                "porcentaje_asistencia": 100.0,
                "alerta_libre": False,
            }

        presentes = sum(1 for r in registros if r.estado == "PRESENTE")
        ausentes = sum(1 for r in registros if r.estado == "AUSENTE")
        tardes = sum(1 for r in registros if r.estado == "TARDE")
        justificados = sum(1 for r in registros if r.estado == "JUSTIFICADO")

        # Cómputo ponderado: media asistencia por llegada tarde
        asistencias_efectivas = presentes + justificados + (tardes * 0.5)
        porcentaje = round((asistencias_efectivas / total_clases) * 100, 2)

        return {
            "total_clases": total_clases,
            "presentes": presentes,
            "ausentes": ausentes,
            "tardes": tardes,
            "justificados": justificados,
            "porcentaje_asistencia": porcentaje,
            "alerta_libre": porcentaje < umbral_regularidad,
        }


class Asistencia(BaseModel):
    """
    Registro diario de asistencia vinculado a un Alumno.
    Garantiza integridad de dominio (CHECK) y unicidad por fecha (UNIQUE compuesto).
    """

    id = AutoField(primary_key=True)
    alumno = ForeignKeyField(
        Alumno,
        backref="asistencias",
        on_delete="CASCADE",
        on_update="CASCADE",
         null=False,
    )
    fecha = DateField(default=date.today, index=True, null=False)
    estado = CharField(
        max_length=15,
        default="PRESENTE",
        constraints=[
            Check("estado IN ('PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO')")
        ],
    )
    observacion = TextField(null=True)
    actualizado_en = DateTimeField(default=datetime.now)

    class Meta:
        table_name = "asistencias"
        # Índice único compuesto: impide duplicar la asistencia del mismo alumno en la misma fecha
        indexes = (
            (("alumno", "fecha"), True),
        )


def inicializar_bd() -> None:
    """
    Conecta a la base de datos SQLite y crea las tablas de forma segura (`safe=True`)
    si aún no existen.
    """
    with db:
        db.create_tables([Alumno, Asistencia], safe=True)
