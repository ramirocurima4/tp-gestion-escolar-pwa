import { useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import { Check, Clock, RotateCcw, X } from 'lucide-react'

const STATUS_META = {
  AUSENTE: {
    label: 'Ausente',
    exitX: -360,
    exitY: 20,
    rotate: -18,
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
  },
  TARDE: {
    label: 'Tarde',
    exitX: 0,
    exitY: -300,
    rotate: 0,
    badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
  },
  PRESENTE: {
    label: 'Presente',
    exitX: 360,
    exitY: 20,
    rotate: 18,
    badgeClass: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
  },
}

/**
 * Extrae hasta 2 iniciales a partir del nombre completo del estudiante.
 */
function getInitials(fullName) {
  const parts = (fullName || 'AL').trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/**
 * Tarjeta deslizable tipo "Tinder" para un único alumno a la vez.
 */
function StudentSwipeCard({ student, onDecision, exitDirection }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14])
  const presentOpacity = useTransform(x, [35, 130], [0, 1])
  const absentOpacity = useTransform(x, [-130, -35], [1, 0])

  const handleDragEnd = (_event, info) => {
    if (info.offset.x > 110 || info.velocity.x > 500) {
      onDecision('PRESENTE')
    } else if (info.offset.x < -110 || info.velocity.x < -500) {
      onDecision('AUSENTE')
    }
  }

  const exitConfig = STATUS_META[exitDirection] ?? STATUS_META.PRESENTE

  return (
    <motion.div
      key={student.id}
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.92, opacity: 0, y: 24 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{
        x: exitConfig.exitX,
        y: exitConfig.exitY,
        rotate: exitConfig.rotate,
        opacity: 0,
        transition: { duration: 0.25, ease: 'easeIn' },
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      whileDrag={{ scale: 1.02 }}
      className="relative w-full cursor-grab active:cursor-grabbing select-none rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-2xl"
    >
      {/* Sellos dinámicos al deslizar */}
      <motion.div
        style={{ opacity: presentOpacity }}
        className="pointer-events-none absolute top-5 right-5 rounded-xl border-2 border-cyan-300 bg-cyan-400/20 px-3 py-1 text-xs font-black tracking-widest text-cyan-200 rotate-12"
      >
        PRESENTE
      </motion.div>
      <motion.div
        style={{ opacity: absentOpacity }}
        className="pointer-events-none absolute top-5 left-5 rounded-xl border-2 border-rose-400 bg-rose-500/20 px-3 py-1 text-xs font-black tracking-widest text-rose-200 -rotate-12"
      >
        AUSENTE
      </motion.div>

      <div className="flex flex-col items-center text-center pt-2">
        {/* Avatar circular generado con las iniciales del alumno */}
        <div
          className={`relative mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br ${
            student.avatarGradient || 'from-cyan-400 via-sky-500 to-indigo-500'
          } p-[3px] shadow-[0_0_30px_rgba(34,211,238,0.28)]`}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-indigo-950/90 backdrop-blur-md">
            <span className="text-3xl font-black tracking-wider text-white">
              {getInitials(student.nombre)}
            </span>
          </div>
          {student.riesgoPedagogico && (
            <span
              title="Riesgo pedagógico"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-xs font-black text-white ring-4 ring-indigo-950 shadow-neon-red"
            >
              !
            </span>
          )}
        </div>

        <span className="mb-2 inline-flex items-center rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium text-indigo-200">
          {student.curso}
        </span>

        <h3 className="text-2xl font-extrabold tracking-tight text-white">
          {student.nombre}
        </h3>

        <p className="mt-1 text-sm text-indigo-200/80">
          {student.notaRiesgo || 'Seguimiento regular'}
        </p>

        {/* Indicadores rápidos del estudiante */}
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl bg-indigo-950/50 border border-white/10 p-3">
            <p className="text-[11px] uppercase tracking-wider text-indigo-300/80">
              Asistencia
            </p>
            <p
              className={`mt-1 text-xl font-extrabold ${
                student.asistenciaPct < 75 ? 'text-rose-400' : 'text-cyan-300'
              }`}
            >
              {student.asistenciaPct}%
            </p>
          </div>
          <div className="rounded-2xl bg-indigo-950/50 border border-white/10 p-3">
            <p className="text-[11px] uppercase tracking-wider text-indigo-300/80">
              TPs Pendientes
            </p>
            <p
              className={`mt-1 text-xl font-extrabold ${
                (student.tpPendientes ?? 0) > 0 ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {student.tpPendientes ?? 0}
            </p>
          </div>
        </div>

        <p className="mt-5 text-xs text-indigo-300/70">
          Deslizá ← Ausente · Deslizá → Presente · O usá los botones
        </p>
      </div>
    </motion.div>
  )
}

/**
 * Modal de Asistencia a pantalla completa estilo "Tinder".
 */
export default function AsistenciaModal({
  students,
  courseLabel = '4° A',
  fecha,
  onClose,
  onFinish,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [records, setRecords] = useState([])
  const [exitDirection, setExitDirection] = useState('PRESENTE')

  const total = students.length
  const isFinished = currentIndex >= total
  const currentStudent = students[currentIndex]
  const progress = total > 0 ? Math.min(Math.round((currentIndex / total) * 100), 100) : 100

  const handleMark = (status) => {
    if (!currentStudent) return
    setExitDirection(status)
    setRecords((prev) => [...prev, { student: currentStudent, status }])
    setCurrentIndex((prev) => prev + 1)
  }

  const handleUndo = () => {
    if (currentIndex === 0) return
    setRecords((prev) => prev.slice(0, -1))
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleRestart = () => {
    setRecords([])
    setCurrentIndex(0)
  }

  const summary = records.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    },
    { PRESENTE: 0, TARDE: 0, AUSENTE: 0 }
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col bg-indigo-950 text-white"
    >
      {/* Luces ambientales de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-md flex-col justify-between px-4 pt-5 pb-6">
        {/* Cabecera del modal */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-indigo-100 active:scale-95 transition"
            >
              <X className="h-4 w-4" />
              Salir
            </button>

            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
                Asistencia Rápida{fecha ? ` · ${fecha.split('-').reverse().slice(0, 2).join('/')}` : ''}
              </p>
              <p className="text-sm font-bold text-white">
                {isFinished ? 'Resumen Final' : `${currentIndex + 1} de ${total}`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleUndo}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-amber-300 disabled:opacity-35 active:scale-95 transition"
            >
              <RotateCcw className="h-4 w-4" />
              Deshacer
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
          </div>
        </div>

        {/* Zona central: una sola tarjeta de estudiante a la vez o resumen */}
        <div className="my-auto flex w-full items-center justify-center py-4">
          <AnimatePresence mode="wait" custom={exitDirection}>
            {!isFinished && currentStudent ? (
              <StudentSwipeCard
                key={currentStudent.id}
                student={currentStudent}
                onDecision={handleMark}
                exitDirection={exitDirection}
              />
            ) : (
              <motion.div
                key="summary"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 text-center shadow-2xl"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/20 border border-cyan-400/40 text-cyan-300">
                  <Check className="h-8 w-8 stroke-[2.5]" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">
                  ¡Asistencia completada!
                </h3>
                <p className="mt-1 text-sm text-indigo-200/80">
                  Se registraron los {total} estudiantes de {courseLabel}.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-cyan-400/15 border border-cyan-400/30 p-3">
                    <p className="text-xs font-semibold text-cyan-200">Presentes</p>
                    <p className="mt-1 text-2xl font-black text-cyan-300">
                      {summary.PRESENTE}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-400/15 border border-amber-400/30 p-3">
                    <p className="text-xs font-semibold text-amber-200">Tardes</p>
                    <p className="mt-1 text-2xl font-black text-amber-300">
                      {summary.TARDE}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-rose-500/15 border border-rose-400/30 p-3">
                    <p className="text-xs font-semibold text-rose-200">Ausentes</p>
                    <p className="mt-1 text-2xl font-black text-rose-400">
                      {summary.AUSENTE}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onFinish(records)}
                    className="w-full rounded-2xl bg-cyan-400 py-4 text-base font-extrabold text-indigo-950 shadow-neon-cyan"
                  >
                    Guardar y volver al Dashboard
                  </motion.button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full rounded-2xl bg-white/10 border border-white/15 py-3.5 text-sm font-bold text-pink-300"
                  >
                    Repetir pasada
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botonera inferior tap-friendly gigante: Ausente (rojo), Tarde (ámbar), Presente (cian) */}
        {!isFinished ? (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => handleMark('AUSENTE')}
              className="flex min-h-[76px] flex-col items-center justify-center rounded-2xl bg-rose-500 text-white font-extrabold shadow-neon-red border border-rose-300/40"
            >
              <X className="h-6 w-6 stroke-[2.5]" />
              <span className="mt-1 text-sm tracking-wide">Ausente</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => handleMark('TARDE')}
              className="flex min-h-[76px] flex-col items-center justify-center rounded-2xl bg-amber-400 text-indigo-950 font-extrabold shadow-neon-amber border border-amber-200/60"
            >
              <Clock className="h-6 w-6 stroke-[2.5]" />
              <span className="mt-1 text-sm tracking-wide">Tarde</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => handleMark('PRESENTE')}
              className="flex min-h-[76px] flex-col items-center justify-center rounded-2xl bg-cyan-400 text-indigo-950 font-extrabold shadow-neon-cyan border border-cyan-200/60"
            >
              <Check className="h-6 w-6 stroke-[2.5]" />
              <span className="mt-1 text-sm tracking-wide">Presente</span>
            </motion.button>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </motion.div>
  )
}
