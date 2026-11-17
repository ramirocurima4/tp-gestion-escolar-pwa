from datetime import date
from peewee import (
    Model, CharField, IntegerField, DateField,
    TextField, ForeignKeyField, BooleanField
)
from database import db

class BaseModel(Model):
    class Meta:
        database = db

# 1. Seguridad y Roles (Admin/Directivo, Preceptor, Docente, Alumno)
class Usuario(BaseModel):
    dni = CharField(unique=True, max_length=15)
    nombre = CharField(max_length=100)
    apellido = CharField(max_length=100)
    email = CharField(unique=True, max_length=120)
    password_hash = CharField(max_length=255)
    rol = CharField(max_length=20)
    activo = BooleanField(default=True)

# 2. Normalización de Cursos y Divisiones
class Curso(BaseModel):
    anio = IntegerField()
    division = CharField(max_length=10)
    turno = CharField(max_length=20)
    ciclo_lectivo = IntegerField(default=date.today().year)

# 3. Alumnos (Vinculados a un Curso normalizado)
class Alumno(BaseModel):
    dni = CharField(unique=True, max_length=15)
    nombre = CharField(max_length=100)
    apellido = CharField(max_length=100)
    curso = ForeignKeyField(Curso, backref='alumnos', on_delete='RESTRICT')
    usuario = ForeignKeyField(Usuario, backref='perfil_alumno', null=True, on_delete='SET NULL')
    activo = BooleanField(default=True)

# 4. Asignaturas (Vinculan Curso + Docente)
class Asignatura(BaseModel):
    nombre = CharField(max_length=100)
    curso = ForeignKeyField(Curso, backref='asignaturas', on_delete='CASCADE')
    docente = ForeignKeyField(Usuario, backref='asignaturas_dictadas', on_delete='RESTRICT')

# 5. Módulo 1: Control de Asistencia (Estados: P, A, J, T)
class Asistencia(BaseModel):
    alumno = ForeignKeyField(Alumno, backref='asistencias', on_delete='CASCADE')
    asignatura = ForeignKeyField(Asignatura, backref='asistencias', on_delete='CASCADE')
    fecha = DateField(default=date.today)
    estado = CharField(max_length=1)
    observacion = CharField(null=True, max_length=255)

# 6. Módulo 2: Libro de Temas Digital
class LibroTemas(BaseModel):
    asignatura = ForeignKeyField(Asignatura, backref='registros_temas', on_delete='CASCADE')
    fecha = DateField(default=date.today)
    unidad_didactica = CharField(max_length=150)
    eje_tematico = CharField(max_length=200)
    contenidos_dictados = TextField()
    observaciones_pedagogicas = TextField(null=True)

# 7. Módulo 2 (Complemento): Gestión de Tareas y Evaluaciones
class ActividadEvaluacion(BaseModel):
    libro_tema = ForeignKeyField(LibroTemas, backref='actividades', on_delete='CASCADE')
    tipo = CharField(max_length=30)
    descripcion = TextField()
    fecha_entrega = DateField()

def inicializar_bd():
    db.connect(reuse_if_open=True)
    db.create_tables([
        Usuario,
        Curso,
        Alumno,
        Asignatura,
        Asistencia,
        LibroTemas,
        ActividadEvaluacion
    ], safe=True)