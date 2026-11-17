import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileDown,
  Loader2,
  Play,
  UserCheck,
} from 'lucide-react'
import AsistenciaModal from '../components/AsistenciaModal'
import GlassCard from '../components/GlassCard'
import PageShell from '../components/PageShell'
import { useAsignatura } from '../context/AsignaturaContext'
import { useAuth } from '../context/AuthContext'
import { buildDefaultTps } from '../data/mockData'
import { readAsignaturaStore } from '../hooks/useAsignaturaStore'

const ESTADO_API = { PRESENTE: 'P', TARDE: 'T', AUSENTE: 'A' }
const ESTADO_BADGE = {
  PRESENTE: { label: 'P', cls: 'bg-cyan-400/20 border-cyan-400/40 text-cyan-200' },
  TARDE: { label: 'T', cls: 'bg-amber-400/20 border-amber-400/40 text-amber-200' },
  AUSENTE: { label: 'A', cls: 'bg-rose-500/20 border-rose-400/40 text-rose-200' },
}

function getTodayIso() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getInitials(fullName) {
  const parts = (fullName || 'AL').trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export default function Asistencia() {
  const { apiUrl, authFetch, token } = useAuth()
  const { activa, alumnos, loadingAlumnos, isDemo } = useAsignatura()

  const [fechaSeleccionada, setFechaSeleccionada] = useState(getTodayIso)
  const [fechaActivaModal, setFechaActivaModal] = useState(null)
  const [alertasMap, setAlertasMap] = useState({})
  const [ultimaMarca, setUltimaMarca] = useState({})
  const [syncMsg, setSyncMsg] = useState(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const cursoId = activa?.cursoId
  const courseLabel = activa?.cursoLabel || 'Sin curso'

  // Carga de alertas / porcentajes reales de asistencia del curso activo
  useEffect(() => {
    if (isDemo || !cursoId) return
    let ignore = false

    authFetch(`/asistencias/alertas/${cursoId}`)
      .then((data) => {
        if (ignore) return
        const map = {}
        for (const item of data?.alertas || []) {
          map[item.alumno_id] = item
        }
        setAlertasMap((prev) => ({ ...prev, [cursoId]: map }))
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [isDemo, cursoId, authFetch, refreshTick])

  const tps = useMemo(
    () => (activa ? readAsignaturaStore('tps', activa.id, buildDefaultTps) : []),
    [activa]
  )

  const students = useMemo(() => {
    const cursoAlertas = alertasMap[cursoId] || {}
    return alumnos.map((al) => {
      const tpPendientes = tps.filter((tp) => !tp.entregas?.[al.id]).length
      const alertInfo = cursoAlertas[al.id]
      const pct = alertInfo
        ? Math.round(alertInfo.porcentaje_asistencia)
        : Math.round(al.asistenciaPct ?? 100)

      let notaRiesgo = al.notaRiesgo || 'Trayectoria regular al día'
      if (alertInfo?.alerta_consecutivas) {
        notaRiesgo = `${alertInfo.faltas_consecutivas} inasistencias consecutivas`
      } else if (alertInfo?.alerta_regularidad) {
        notaRiesgo = 'Por debajo del 75% mínimo'
      }

      return {
        ...al,
        tpPendientes,
        asistenciaPct: pct,
        riesgoPedagogico: Boolean(alertInfo) || pct < 75,
        notaRiesgo,
      }
    })
  }, [alumnos, tps, alertasMap, cursoId])

  const handleStartAttendance = () => {
    if (!fechaSeleccionada || students.length === 0) return
    setSyncMsg(null)
    setFechaActivaModal(fechaSeleccionada)
  }

  const handleFinishAttendance = async (records) => {
    const fechaRegistro = fechaActivaModal || fechaSeleccionada
    setFechaActivaModal(null)

    const marcas = {}
    for (const r of records) {
      marcas[r.student.id] = r.status
    }
    setUltimaMarca(marcas)

    if (isDemo || !activa || activa.isCourseOnly) {
      setSyncMsg({
        ok: true,
        text: `Pase de lista registrado localmente para el ${fechaRegistro.split('-').reverse().join('/')}.`,
      })
      return
    }

    try {
      const res = await authFetch('/asistencias/lote/', {
        method: 'POST',
        body: JSON.stringify({
          asignatura_id: activa.id,
          fecha: fechaRegistro,
          registros: records.map((r) => ({
            alumno_id: r.student.id,
            estado: ESTADO_API[r.status],
          })),
        }),
      })
      setSyncMsg({
        ok: true,
        text: res?.mensaje || `Asistencia guardada para el ${fechaRegistro}.`,
      })
      setRefreshTick((t) => t + 1)
    } catch (err) {
      setSyncMsg({
        ok: false,
        text: err.message || 'No se pudo sincronizar la asistencia con el servidor.',
      })
    }
  }

  const handleDownloadPdf = async () => {
    if (!cursoId) return
    setDownloadingPdf(true)
    setSyncMsg(null)

    const endpoint = `${apiUrl}/reportes/asistencia/${cursoId}/pdf`
    try {
      const response = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        throw new Error('No se pudo generar el PDF de asistencia.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `asistencia_curso_${cursoId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setSyncMsg({
        ok: false,
        text: err.message || 'Error al descargar la planilla PDF.',
      })
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <PageShell kicker="Control Diario" title="Asistencia" icon={UserCheck}>
      {/* Paso previo: Selector de fecha + botón para iniciar pase de lista */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
              Paso 1 · Fecha de clase
            </p>
            <h2 className="mt-0.5 text-base font-extrabold text-white">
              Seleccioná el día de cursado
            </h2>
          </div>
          <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold text-indigo-200">
            {courseLabel}
          </span>
        </div>

        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            type="date"
            aria-label="Fecha de asistencia"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="w-full rounded-2xl bg-indigo-900 border border-white/15 py-3.5 pl-10 pr-4 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 [color-scheme:dark] transition"
          />
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleStartAttendance}
          disabled={!fechaSeleccionada || students.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-base font-black text-indigo-950 shadow-neon-cyan border border-cyan-200/70 disabled:opacity-50 transition"
        >
          <Play className="h-5 w-5 fill-current" />
          Comenzar Pase de Lista
        </motion.button>
      </GlassCard>

      {syncMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            syncMsg.ok
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
              : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
          }`}
        >
          {syncMsg.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{syncMsg.text}</span>
        </motion.div>
      )}

      {/* Planilla de porcentajes en vivo */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-white">Planilla de Alumnos</h2>
            <p className="text-xs text-indigo-300/80">
              Porcentaje de asistencia en tiempo real
            </p>
          </div>
          <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-black text-cyan-300">
            {students.length} alumnos
          </span>
        </div>

        {loadingAlumnos && students.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs font-semibold text-indigo-200">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
            Cargando planilla...
          </div>
        ) : students.length === 0 ? (
          <p className="rounded-2xl bg-indigo-950/60 border border-white/10 p-4 text-xs text-indigo-300/80">
            No hay alumnos matriculados en este curso todavía.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {students.map((al) => {
              const regular = al.asistenciaPct >= 75
              const marca = ultimaMarca[al.id] ? ESTADO_BADGE[ultimaMarca[al.id]] : null

              return (
                <li
                  key={al.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-indigo-950/60 border border-white/10 px-3.5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-900/80 border border-white/15 text-xs font-black text-cyan-300">
                      {getInitials(al.nombre)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-white">
                        {al.nombre}
                      </p>
                      <p className="truncate text-[11px] text-indigo-300/75">
                        {al.notaRiesgo}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {marca && (
                      <span
                        className={`rounded-lg border px-2 py-0.5 text-[11px] font-black ${marca.cls}`}
                      >
                        {marca.label}
                      </span>
                    )}
                    <span
                      className={`rounded-xl border px-2.5 py-1 text-xs font-black ${
                        regular
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                          : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                      }`}
                    >
                      {al.asistenciaPct}%
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Botón de descarga PDF */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleDownloadPdf}
          disabled={downloadingPdf || !cursoId}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400/10 border border-cyan-400/50 py-3.5 text-sm font-extrabold text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-50 transition"
        >
          {downloadingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {downloadingPdf ? 'Generando PDF...' : 'Descargar Planilla (PDF)'}
        </motion.button>
      </GlassCard>

      {/* Modal tipo Tinder */}
      <AnimatePresence>
        {fechaActivaModal && (
          <AsistenciaModal
            key={`${activa?.id}-${fechaActivaModal}`}
            students={students}
            courseLabel={courseLabel}
            fecha={fechaActivaModal}
            onClose={() => setFechaActivaModal(null)}
            onFinish={handleFinishAttendance}
          />
        )}
      </AnimatePresence>
    </PageShell>
  )
}
