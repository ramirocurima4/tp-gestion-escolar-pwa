import { useState } from 'react'
import { Plus, Star, X } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import PageShell from '../components/PageShell'
import { useAsignatura } from '../context/AsignaturaContext'
import { useAsignaturaStore } from '../hooks/useAsignaturaStore'

/** Nota mínima de aprobación */
const NOTA_APROBACION = 6
const NUM_REGEX = /^(10([.,]0?)?|[0-9]([.,]\d?)?)$/
const INITIAL_STATE = { columnas: [], notas: {}, promedios: {} }

function initials(name) {
  const parts = name.trim().split(/\s+/)
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function NotasContent({ asignatura, alumnos }) {
  const [data, setData] = useAsignaturaStore('calificaciones', asignatura.id, INITIAL_STATE)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')

  const { columnas, notas, promedios } = data

  const addColumna = (event) => {
    event.preventDefault()
    const clean = nombre.trim()
    if (!clean) return
    setData((prev) => ({
      ...prev,
      columnas: [...prev.columnas, { id: `ev-${Date.now()}`, nombre: clean }],
      promedios: {}, // los promedios previos quedan desactualizados
    }))
    setNombre('')
    setShowForm(false)
  }

  const removeColumna = (colId) => {
    setData((prev) => ({
      ...prev,
      columnas: prev.columnas.filter((c) => c.id !== colId),
      promedios: {},
    }))
  }

  const setNota = (alumnoId, colId, value) => {
    setData((prev) => {
      const { [alumnoId]: _old, ...restPromedios } = prev.promedios
      return {
        ...prev,
        notas: {
          ...prev.notas,
          [alumnoId]: { ...(prev.notas[alumnoId] || {}), [colId]: value },
        },
        promedios: restPromedios,
      }
    })
  }

  const sacarPromedio = (alumnoId) => {
    const values = columnas
      .map((c) => parseFloat(notas[alumnoId]?.[c.id]))
      .filter((n) => !Number.isNaN(n))
    const result = values.length
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
      : null
    setData((prev) => ({ ...prev, promedios: { ...prev.promedios, [alumnoId]: result } }))
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-indigo-200">
          {columnas.length} evaluaciones · aprueba con {NOTA_APROBACION}+
        </p>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-cyan-400 px-3.5 py-2 text-xs font-black text-indigo-950 shadow-neon-cyan active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          Añadir Evaluación
        </button>
      </div>

      {showForm && (
        <GlassCard className="p-4">
          <form onSubmit={addColumna} className="flex gap-2">
            <input
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder='Ej: "TP 1", "Examen Sorpresa"'
              className="min-w-0 flex-1 rounded-2xl bg-indigo-950/70 border border-white/15 px-3.5 py-3 text-sm text-white placeholder:text-indigo-300/45 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-2xl bg-pink-500/25 border border-pink-400/50 px-4 text-sm font-black text-pink-100 shadow-neon-pink active:scale-95 transition"
            >
              Agregar
            </button>
          </form>
        </GlassCard>
      )}

      {alumnos.length === 0 ? (
        <GlassCard className="p-5 text-sm text-indigo-200/80">
          No hay alumnos matriculados en este curso.
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[8.5rem] bg-indigo-950 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                    Alumno
                  </th>
                  {columnas.map((col) => (
                    <th key={col.id} className="min-w-[5.5rem] px-2 py-3 text-center">
                      <div className="inline-flex items-center gap-1 rounded-xl bg-amber-400/15 border border-amber-300/30 px-2 py-1 text-[11px] font-extrabold text-amber-200">
                        <span className="max-w-[5rem] truncate">{col.nombre}</span>
                        <button
                          type="button"
                          onClick={() => removeColumna(col.id)}
                          aria-label={`Quitar ${col.nombre}`}
                          className="text-amber-300/70 hover:text-rose-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="min-w-[9.5rem] px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                    Promedio
                  </th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map((al) => {
                  const prom = promedios[al.id]
                  const calculado = al.id in promedios
                  const aprueba = prom !== null && prom !== undefined && prom >= NOTA_APROBACION
                  return (
                    <tr key={al.id}>
                      <td className="sticky left-0 z-10 border-t border-white/10 bg-indigo-950 px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-900/70 border border-white/15 text-[10px] font-black text-cyan-300">
                            {initials(al.nombre)}
                          </span>
                          <span className="text-xs font-extrabold leading-tight text-white">
                            {al.nombre}
                          </span>
                        </div>
                      </td>
                      {columnas.map((col) => (
                        <td key={col.id} className="border-t border-white/10 px-2 py-3 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={notas[al.id]?.[col.id] ?? ''}
                            onChange={(e) => {
                              const v = e.target.value
                              if (v === '' || NUM_REGEX.test(v)) {
                                setNota(al.id, col.id, v.replace(',', '.'))
                              }
                            }}
                            placeholder="–"
                            aria-label={`${col.nombre} de ${al.nombre}`}
                            className="w-16 rounded-xl bg-indigo-950/70 border border-white/15 py-2.5 text-center text-base font-black text-white placeholder:text-indigo-300/40 focus:border-cyan-400 focus:outline-none"
                          />
                        </td>
                      ))}
                      <td className="border-t border-white/10 px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => sacarPromedio(al.id)}
                            className="rounded-xl bg-pink-500/25 border border-pink-400/60 px-3 py-2 text-[11px] font-black text-pink-100 shadow-neon-pink active:scale-95 transition"
                          >
                            Sacar Promedio
                          </button>
                          {calculado && (
                            <span
                              className={`flex h-10 min-w-10 items-center justify-center rounded-full border-2 px-2 text-sm font-black ${
                                prom === null
                                  ? 'bg-white/10 border-white/20 text-indigo-300'
                                  : aprueba
                                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.45)]'
                                    : 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-neon-red'
                              }`}
                              title={prom === null ? 'Sin notas cargadas' : aprueba ? 'Aprobado' : 'Desaprobado'}
                            >
                              {prom === null ? '—' : prom}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {columnas.length === 0 && (
        <p className="text-center text-xs text-indigo-300/70">
          Tocá “Añadir Evaluación” para crear la primera columna (TP, parcial, etc.).
        </p>
      )}
      <p className="text-center text-[11px] text-indigo-300/70">
        Deslizá la tabla hacia los costados para ver todas las evaluaciones. Se guarda automáticamente en este dispositivo.
      </p>
    </>
  )
}

export default function Calificaciones() {
  const { activa, alumnos } = useAsignatura()

  return (
    <PageShell kicker="Evaluación" title="Calificaciones" icon={Star} maxWidth="max-w-3xl">
      {activa ? (
        <NotasContent key={activa.id} asignatura={activa} alumnos={alumnos} />
      ) : (
        <GlassCard className="p-5 text-sm text-indigo-200/80">
          No tenés asignaturas asignadas todavía.
        </GlassCard>
      )}
    </PageShell>
  )
}
