import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, LogOut, Settings, Sparkles } from 'lucide-react'
import AmbientBackground from '../components/AmbientBackground'
import AsistenciaModal from '../components/AsistenciaModal'
import GlassCard from '../components/GlassCard'
import InviteLinkButton from '../components/InviteLinkButton'
import SubjectSelector from '../components/SubjectSelector'
import { useAsignatura } from '../context/AsignaturaContext'
import { useAuth } from '../context/AuthContext'
import { buildDefaultTps } from '../data/mockData'
import { readAsignaturaStore } from '../hooks/useAsignaturaStore'

const ESTADO_API = { PRESENTE: 'P', TARDE: 'T', AUSENTE: 'A' }

/**
 * @param {boolean} autoOpenAttendance abre la toma de asistencia al montar (ruta /asistencia)
 */
export default function Dashboard({ autoOpenAttendance = false }) {
  const { authFetch, usuario, logout } = useAuth()
  const { activa, alumnos, loadingAlumnos, isDemo } = useAsignatura()
  const navigate = useNavigate()

  const [modalMode, setModalMode] = useState(autoOpenAttendance ? 'all' : null)
  const [lastSession, setLastSession] = useState(null)
  const [syncMsg, setSyncMsg] = useState(null)
  const [alertasByCurso, setAlertasByCurso] = useState({})

  const cursoId = activa?.cursoId

  // Alertas de riesgo reales del backend para el curso de la asignatura activa
  useEffect(() => {
    if (isDemo || !cursoId) return
    let ignore = false

    authFetch(`/asistencias/alertas/${cursoId}`)
      .then((data) => {
        if (ignore) return
        const map = new Map((data?.alertas || []).map((item) => [item.alumno_id, item]))
        setAlertasByCurso((prev) => ({ ...prev, [cursoId]: map }))
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [isDemo, cursoId, authFetch])

  const tps = useMemo(
    () => (activa ? readAsignaturaStore('tps', activa.id, buildDefaultTps) : []),
    [activa]
  )

  const alertas = alertasByCurso[cursoId]

  const students = useMemo(
    () =>
      alumnos.map((al) => {
        const tpPendientes = tps.filter((tp) => !tp.entregas?.[al.id]).length
        if (isDemo) return { ...al, tpPendientes }

        const info = alertas?.get(al.id)
        if (!info) return { ...al, tpPendientes }

        let notaRiesgo = 'Por debajo del 75% mínimo'
        if (info.alerta_consecutivas) {
          notaRiesgo = `${info.faltas_consecutivas} inasistencias consecutivas`
        }
        return {
          ...al,
          tpPendientes,
          asistenciaPct: Math.round(info.porcentaje_asistencia),
          riesgoPedagogico: true,
          notaRiesgo,
        }
      }),
    [alumnos, tps, isDemo, alertas]
  )

  const atRiskStudents = students.filter((s) => s.riesgoPedagogico)
  const tpsPendientesTotal = students.reduce((acc, s) => acc + s.tpPendientes, 0)
  const modalStudents = modalMode === 'risk' ? atRiskStudents : students
  const courseLabel = activa?.cursoLabel || 'Sin curso'

  const closeModal = () => {
    setModalMode(null)
    if (autoOpenAttendance) navigate('/', { replace: true })
  }

  const handleFinishAttendance = async (records) => {
    const counts = records.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      },
      { PRESENTE: 0, TARDE: 0, AUSENTE: 0 }
    )
    setLastSession({
      ...counts,
      timestamp: new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    })
    setSyncMsg(null)
    closeModal()

    if (!isDemo && activa) {
      try {
        await authFetch('/asistencias/lote/', {
          method: 'POST',
          body: JSON.stringify({
            asignatura_id: activa.id,
            registros: records.map((r) => ({
              alumno_id: r.student.id,
              estado: ESTADO_API[r.status],
            })),
          }),
        })
        setSyncMsg({ ok: true, text: 'Asistencia sincronizada con el servidor.' })
      } catch (err) {
        setSyncMsg({ ok: false, text: err.message || 'No se pudo sincronizar la asistencia.' })
      }
    }
  }

  const displayName = usuario?.nombre || 'Docente'

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-indigo-950 text-white">
      <AmbientBackground />

      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <div className="space-y-5">
          {/* Cabecera con selector de asignatura */}
          <header className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-1.5 text-xs font-bold text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                AulaPulse
              </span>

              <div className="flex items-center gap-2">
                <Link
                  to="/instalacion"
                  title="Instalar app o descargar APK"
                  aria-label="Instalar app o descargar APK"
                  className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/15 p-2 text-cyan-300 hover:bg-white/15 hover:text-cyan-200 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/20 border border-pink-400/30 px-3 py-1.5 text-xs font-bold text-pink-200 hover:bg-pink-500/30 transition"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Admin
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title="Cerrar sesión"
                  className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/15 p-2 text-indigo-200 hover:bg-white/15 hover:text-white transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <SubjectSelector />
          </header>

          {/* Saludo al profesor */}
          <motion.section
            key={`saludo-${activa?.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  Panel {usuario?.rol || 'Docente'}
                </p>
                {isDemo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-200">
                    <Sparkles className="h-3 w-3 text-cyan-300" />
                    Vista Demo
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
                ¡Hola, {displayName}!
              </h1>
              <p className="mt-1.5 text-sm text-indigo-200/85">
                {!activa
                  ? 'Todavía no tenés asignaturas asignadas.'
                  : loadingAlumnos && students.length === 0
                    ? `Cargando estudiantes de ${activa.nombre}...`
                    : `Tenés ${students.length} estudiantes activos en ${activa.nombre} (${courseLabel}). Listo para pasar lista.`}
              </p>
            </GlassCard>
          </motion.section>

          {/* Tarjetas rápidas glassmorphism */}
          <motion.section
            key={`stats-${activa?.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14 }}
            className="grid grid-cols-2 gap-3"
          >
            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-indigo-200">Última Toma</p>
              {lastSession ? (
                <p className="mt-1 text-lg font-black text-cyan-300">
                  {lastSession.PRESENTE}P · {lastSession.TARDE}T · {lastSession.AUSENTE}A
                </p>
              ) : (
                <p className="mt-1 text-lg font-black text-pink-300">Pendiente hoy</p>
              )}
              <p className="mt-1 text-[11px] text-indigo-300/80">
                {lastSession ? `Guardada ${lastSession.timestamp}` : 'Tocá el botón cian'}
              </p>
            </GlassCard>

            <Link to="/tps" className="block">
              <GlassCard className="h-full p-4 transition active:scale-[0.98]">
                <p className="text-xs font-semibold text-indigo-200">Estado TPs</p>
                <p className="mt-1 text-lg font-black text-amber-300">
                  {tpsPendientesTotal} pendientes
                </p>
                <p className="mt-1 text-[11px] text-indigo-300/80">
                  {tps.length} TPs activos
                </p>
              </GlassCard>
            </Link>
          </motion.section>

          {syncMsg && (
            <p
              className={`rounded-2xl border px-3.5 py-2.5 text-xs font-semibold ${
                syncMsg.ok
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
              }`}
            >
              {syncMsg.text}
            </p>
          )}
        </div>

        {/* Botón gigante cian + accesos neón inferiores */}
        <div className="mt-8 space-y-3">
          <InviteLinkButton cursoId={activa?.cursoId} />

          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setModalMode('all')}
            disabled={students.length === 0}
            className="w-full rounded-3xl bg-cyan-400 px-6 py-5 text-lg font-black tracking-tight text-indigo-950 shadow-neon-cyan border border-cyan-200/70 disabled:opacity-50 transition"
          >
            Iniciar Asistencia Rápida →
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setModalMode('risk')}
              disabled={atRiskStudents.length === 0}
              className="rounded-2xl bg-pink-500/20 border border-pink-400/50 py-3 text-xs font-extrabold text-pink-200 shadow-neon-pink disabled:opacity-45"
            >
              Solo en Riesgo ({atRiskStudents.length})
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setLastSession(null)}
              disabled={!lastSession}
              className="rounded-2xl bg-amber-400/20 border border-amber-300/50 py-3 text-xs font-extrabold text-amber-200 shadow-neon-amber disabled:opacity-45"
            >
              {lastSession ? 'Reiniciar Registro' : 'Sin Registro Hoy'}
            </motion.button>
          </div>
        </div>
      </main>

      {/* Modal de Asistencia Fullscreen tipo Tinder */}
      <AnimatePresence>
        {modalMode && modalStudents.length > 0 && (
          <AsistenciaModal
            key={`${activa?.id}-${modalMode}`}
            students={modalStudents}
            courseLabel={courseLabel}
            onClose={closeModal}
            onFinish={handleFinishAttendance}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
