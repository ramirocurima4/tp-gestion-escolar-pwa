# Reglas de Arquitectura y Diseño
- **Mobile-First Estricto:** La interfaz será usada por profesores caminando por el aula. Botones grandes, tap-friendly, navegación inferior simple y tarjetas vistosas.
- **Micro-Interacciones:** Usar Framer Motion para que las tarjetas reaccionen al toque y las listas aparezcan en cascada.
- **Cero dependencias pesadas:** Prohibido usar Pandas, Openpyxl o SQLAlchemy. Mantener el backend ultraliviano con Peewee y exportaciones nativas en PDF.
- **PWA Ready:** El frontend debe compilar con un manifest válido y un Service Worker funcional para permitir la instalación offline.
- **Código Limpio y Explicable:** El código generado no debe contener "cajas negras". Todo debe estar modularizado y comentado estratégicamente para poder defender la arquitectura en una exposición técnica.

---

# Estado del Proyecto e Historial de Arquitectura

## Estructura de Directorios Activa (Unificada en Raíz)
- `.git/`: Repositorio Git principal en la raíz del proyecto.
- `pront.md` y `memory.md`: Especificación funcional y memoria de arquitectura en la raíz.
- `backend/`: API REST con FastAPI y persistencia relacional en SQLite mediante Peewee ORM.
  - `models.py`: Configuración de `SqliteDatabase` (`gestion_escolar.db`) y modelos relacionales iniciales (`Alumno`, `Asistencia`).
  - `main.py`: Inicialización de FastAPI (`lifespan`), middleware CORS para red local/PWA y endpoints iniciales de Alumnos y Asistencias.
  - `requirements.txt`: Dependencias ultralivianas (`fastapi`, `uvicorn`, `peewee`, `pydantic`, `fpdf2`).
- `frontend/`: Directorio preparado para inicializar la PWA con React, Vite, Tailwind CSS, shadcn/ui, Framer Motion y `vite-plugin-pwa`.

## Decisiones Técnicas Clave (para Defensa Técnica)
1. **PRAGMAs de SQLite (`models.py`):**
   - `foreign_keys = 1`: Fuerza integridad referencial real a nivel motor (`ON DELETE/UPDATE CASCADE`).
   - `journal_mode = 'wal'`: Habilita Write-Ahead Logging para lecturas y escrituras táctiles rápidas sin bloqueos.
2. **Normalización en 3FN (`Alumno` y `Asistencia`):**
   - El porcentaje de asistencia y la condición de riesgo (`alerta_libre` < 75%) **no** se guardan como columnas físicas en `alumnos`, evitando anomalías de actualización. Se calculan en tiempo real mediante `Alumno.calcular_metricas_asistencia()`.
3. **Integridad de Dominio y Unicidad:**
   - Restricción `CHECK` en `Asistencia.estado` (`PRESENTE`, `AUSENTE`, `TARDE`, `JUSTIFICADO`).
   - Índice único compuesto `UNIQUE(alumno, fecha)` en `Asistencia` para impedir doble carga en el mismo día, acompañado de lógica *Upsert* en `POST /api/asistencias` para facilitar la corrección táctil desde el celular.

## Próximos Pasos Pendientes
- Modelar las entidades del Módulo 2 en `backend/models.py`: **Gestión de Evaluaciones, Trabajos Prácticos y Equipos** (sorteo de orden de exposición, asignación de temas y alertas de bajo rendimiento).
- Implementar el generador nativo de reportes en PDF con `FPDF2`.
- Inicializar el proyecto `frontend/` con Vite + React + Tailwind + Framer Motion + `vite-plugin-pwa`.
