/**
 * Datos de respaldo (modo demo) cuando el backend aún no expone asignaturas.
 */
export const MOCK_ASIGNATURAS = [
  {
    id: 1,
    nombre: 'Cultura y Comunicación',
    cursoId: 101,
    cursoLabel: 'Tec. Soft. 2do Año',
    turno: 'Noche',
  },
  {
    id: 2,
    nombre: 'Práctica Profesionalizante II',
    cursoId: 102,
    cursoLabel: 'Tec. Soft. 3er Año',
    turno: 'Noche',
  },
]

export const MOCK_ALUMNOS = {
  1: [
    { id: 1, nombre: 'Lucía Martínez', asistenciaPct: 68, riesgoPedagogico: true, notaRiesgo: '3 inasistencias consecutivas', avatarGradient: 'from-pink-500 via-rose-500 to-amber-400' },
    { id: 2, nombre: 'Mateo Fernández', asistenciaPct: 92, riesgoPedagogico: false, notaRiesgo: 'Trayectoria regular al día', avatarGradient: 'from-cyan-400 via-sky-500 to-indigo-500' },
    { id: 3, nombre: 'Valentina Gómez', asistenciaPct: 71, riesgoPedagogico: true, notaRiesgo: 'Por debajo del 75% mínimo', avatarGradient: 'from-amber-400 via-pink-500 to-purple-600' },
    { id: 4, nombre: 'Santiago Rojas', asistenciaPct: 88, riesgoPedagogico: false, notaRiesgo: 'Asistencia estable', avatarGradient: 'from-emerald-400 via-cyan-400 to-blue-500' },
    { id: 5, nombre: 'Camila Pereyra', asistenciaPct: 95, riesgoPedagogico: false, notaRiesgo: 'Sin alertas activas', avatarGradient: 'from-fuchsia-500 via-pink-500 to-cyan-400' },
    { id: 6, nombre: 'Thiago Benítez', asistenciaPct: 73, riesgoPedagogico: true, notaRiesgo: 'Requiere seguimiento de TPs', avatarGradient: 'from-rose-500 via-pink-500 to-indigo-500' },
  ],
  2: [
    { id: 11, nombre: 'Julieta Acosta', asistenciaPct: 97, riesgoPedagogico: false, notaRiesgo: 'Sin alertas activas', avatarGradient: 'from-cyan-400 via-sky-500 to-indigo-500' },
    { id: 12, nombre: 'Franco Molina', asistenciaPct: 64, riesgoPedagogico: true, notaRiesgo: 'Por debajo del 75% mínimo', avatarGradient: 'from-rose-500 via-pink-500 to-amber-400' },
    { id: 13, nombre: 'Agustina Silva', asistenciaPct: 85, riesgoPedagogico: false, notaRiesgo: 'Asistencia estable', avatarGradient: 'from-emerald-400 via-cyan-400 to-blue-500' },
    { id: 14, nombre: 'Nicolás Ibarra', asistenciaPct: 90, riesgoPedagogico: false, notaRiesgo: 'Trayectoria regular al día', avatarGradient: 'from-fuchsia-500 via-pink-500 to-cyan-400' },
  ],
}

export function buildDefaultTps() {
  return [
    { id: 'tp-1', titulo: 'TP N°1 — Trabajo integrador', fecha: '2026-11-24', entregas: {} },
    { id: 'tp-2', titulo: 'TP N°2 — Informe grupal', fecha: '2026-12-05', entregas: {} },
  ]
}
