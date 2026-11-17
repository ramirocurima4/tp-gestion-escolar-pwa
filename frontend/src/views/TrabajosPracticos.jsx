import { useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCheck, ClipboardList, Plus, Trash2 } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import PageShell from '../components/PageShell'
import ToggleSwitch from '../components/ToggleSwitch'
import { useAsignatura } from '../context/AsignaturaContext'
import { buildDefaultTps } from '../data/mockData'
import { useAsignaturaStore } from '../hooks/useAsignaturaStore'

function formatDate(iso) {
  if (!iso) return 'Sin fecha'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function TpsContent({ asignatura, alumnos }) {
  const [tps, setTps] = useAsignaturaStore('tps', asignatura.id, buildDefaultTps)
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState('')

  const selected = tps.find((tp) => tp.id === selectedId) || null
  const total = alumnos.length

  const countDelivered = (tp) => alumnos.filter((al) => tp.entregas?.[al.id]).length

  const setEntrega = (tpId, alumnoId, value) => {
    setTps((prev) =>
      prev.map((tp) =>
        tp.id === tpId ? { ...tp, entregas: { ...tp.entregas, [alumnoId]: value } } : tp
      )
    )
  }

  const setAll = (tpId, value) => {
    setTps((prev) =>
      prev.map((tp) =>
        tp.id === tpId
          ? { ...tp, entregas: Object.fromEntries(alumnos.map((al) => [al.id, value])) }
          : tp
      )
    )
  }

  const handleAdd = (event) => {
    event.preventDefault()
    if (!titulo.trim()) return
    setTps((prev) => [
      ...prev,
      { id: `tp-${Date.now()}`, titulo: titulo.trim(), fecha, entregas: {} },
    ])
    setTitulo('')
    setFecha('')
    setShowForm(false)
  }

  const handleDelete = (tpId) => {
    setTps((prev) => prev.filter((tp) => tp.id !== tpId))
    setSelectedId(null)
  }

  // Detalle de un TP: lista de alumnos con switches gigantes
  if (selected) {
    const delivered = countDelivered(selected)
    return (
      <>
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 border border-white/15 px-3.5 py-2 text-xs font-bold text-indigo-100 active:scale-95 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a los TPs
        </button>

        <GlassCard className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
            Entrega · {formatDate(selected.fecha)}
          </p>
          <h2 className="mt-1 text-xl font-black text-white">{selected.titulo}</h2>
          <div className="mt-3 flex items-center justify-between text-xs font-bold">
            <span className="text-emerald-300">{delivered} entregaron</span>
            <span className="text-rose-300">{total - delivered} faltan</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
              style={{ width: `${total ? (delivered / total) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAll(selected.id, true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 py-2.5 text-xs font-extrabold text-emerald-200 active:scale-95 transition"
            >
              <CheckCheck className="h-4 w-4" />
              Todos entregaron
            </button>
            <button
              type="button"
              onClick={() => handleDelete(selected.id)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-rose-500/15 border border-rose-400/40 py-2.5 text-xs font-extrabold text-rose-200 active:scale-95 transition"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar TP
            </button>
          </div>
        </GlassCard>

        {alumnos.length === 0 ? (
          <GlassCard className="p-5 text-sm text-indigo-200/80">
            No hay alumnos matriculados en este curso.
          </GlassCard>
        ) : (
          <ul className="space-y-3">
            {alumnos.map((al) => {
              const entregado = Boolean(selected.entregas?.[al.id])
              return (
                <li
                  key={al.id}
                  className={`flex items-center justify-between gap-3 rounded-3xl border p-4 backdrop-blur-xl transition ${
                    entregado
                      ? 'bg-indigo-900/50 border-emerald-400/30'
                      : 'bg-indigo-900/50 border-rose-400/30'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-white">
                    {al.nombre}
                  </span>
                  <ToggleSwitch
                    checked={entregado}
                    onChange={(value) => setEntrega(selected.id, al.id, value)}
                    ariaLabel={`Entrega de ${al.nombre}`}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </>
    )
  }

  // Lista de TPs activos
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-indigo-200">
          TPs activos ({tps.length})
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-cyan-400 px-3.5 py-2 text-xs font-black text-indigo-950 shadow-neon-cyan active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          Nuevo TP
        </button>
      </div>

      {showForm && (
        <GlassCard className="p-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del trabajo práctico"
              className="w-full rounded-2xl bg-indigo-950/70 border border-white/15 px-3.5 py-3 text-sm text-white placeholder:text-indigo-300/45 focus:border-cyan-400 focus:outline-none"
            />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-2xl bg-indigo-950/70 border border-white/15 px-3.5 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none [color-scheme:dark]"
            />
            <button
              type="submit"
              className="w-full rounded-2xl bg-pink-500/25 border border-pink-400/50 py-3 text-sm font-black text-pink-100 shadow-neon-pink active:scale-95 transition"
            >
              Agregar TP
            </button>
          </form>
        </GlassCard>
      )}

      {tps.length === 0 ? (
        <GlassCard className="p-5 text-sm text-indigo-200/80">
          No hay TPs activos. Creá el primero con el botón cian.
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {tps.map((tp) => {
            const delivered = countDelivered(tp)
            const pct = total ? Math.round((delivered / total) * 100) : 0
            return (
              <li key={tp.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(tp.id)}
                  className="w-full rounded-3xl bg-indigo-900/50 backdrop-blur-xl border border-white/15 p-4 text-left shadow-xl transition active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-extrabold text-white">{tp.titulo}</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-amber-300">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Entrega {formatDate(tp.fecha)}
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-400/15 border border-cyan-400/35 px-2.5 py-0.5 text-xs font-black text-cyan-300">
                      {delivered}/{total}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export default function TrabajosPracticos() {
  const { activa, alumnos } = useAsignatura()

  return (
    <PageShell kicker="Módulo de evaluación" title="Trabajos Prácticos" icon={ClipboardList}>
      {activa ? (
        <TpsContent key={activa.id} asignatura={activa} alumnos={alumnos} />
      ) : (
        <GlassCard className="p-5 text-sm text-indigo-200/80">
          No tenés asignaturas asignadas todavía.
        </GlassCard>
      )}
    </PageShell>
  )
}
