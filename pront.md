# Rol
Sos un Senior Full-Stack Developer y Tech Lead. Vamos a construir una PWA (Progressive Web App) mobile-first orientada a docentes para gestionar el aula directamente desde sus celulares.

# Stack Tecnológico Obligatorio
- **Frontend:** React, Vite, Tailwind CSS, shadcn/ui, Framer Motion (para animaciones fluidas en tarjetas). Plugin `vite-plugin-pwa`.
- **Backend:** FastAPI (Python).
- **Base de Datos:** SQLite gestionado mediante el ORM Peewee (estricta normalización e integridad referencial).
- **Reportes:** FPDF2 para exportación directa a PDF desde el backend.

# Módulos Funcionales (MVP)
1. **Control de Asistencia:** Interfaz táctil rápida para marcar presentismo. Cálculo en tiempo real de porcentajes. Alertas visuales (color rojo) para alumnos al borde de quedar libres.
2. **Gestión de Evaluaciones y Tareas:** Agrupador dinámico para armar equipos, sortear orden de exposición y asignar temas. Vinculación de notas a trabajos prácticos pendientes con alertas visuales de bajo rendimiento.

# Instrucción inicial
Configurá la estructura de carpetas `frontend/` y `backend/`. Generá los archivos de inicialización de FastAPI (`main.py`) y el modelo de base de datos relacional inicial en SQLite con Peewee para Alumnos y Asistencias.