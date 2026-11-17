import { useState } from 'react'
import { Check, ChevronDown, BookOpen } from 'lucide-react'
import { useAsignatura } from '../context/AsignaturaContext'

/**
 * Dropdown estilizado para elegir la asignatura activa del docente.
 */
export default function SubjectSelector() {
  const { asignaturas, activa, setActivaId } = useAsignatura()
  const [open, setOpen] = useState(false)

  if (!activa) {
    return (
      <div className="rounded-2xl bg-indigo-900/50 border border-white/15 px-4 py-3 text-xs text-indigo-300/80">
        Sin asignaturas asignadas
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 rounded-2xl bg-indigo-900/50 backdrop-blur-xl border border-cyan-400/35 px-3.5 py-2.5 text-left shadow-[0_0_18px_rgba(34,211,238,0.15)] transition active:scale-[0.99]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-300">
          <BookOpen className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-cyan-300">
            Asignatura activa
          </span>
          <span className="block truncate text-sm font-extrabold text-white">
            {activa.nombre}
          </span>
          <span className="block truncate text-[11px] text-indigo-300/80">
            {activa.cursoLabel}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-cyan-300 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar selector"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute left-0 right-0 z-40 mt-2 max-h-72 space-y-1 overflow-y-auto rounded-2xl bg-indigo-950/95 backdrop-blur-xl border border-white/15 p-2 shadow-2xl"
          >
            {asignaturas.map((asig) => {
              const selected = asig.id === activa.id
              return (
                <li key={asig.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => {
                      setActivaId(asig.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                      selected
                        ? 'bg-cyan-400/15 border border-cyan-400/35'
                        : 'border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">
                        {asig.nombre}
                      </span>
                      <span className="block truncate text-[11px] text-indigo-300/80">
                        {asig.cursoLabel}
                        {asig.turno ? ` · ${asig.turno}` : ''}
                      </span>
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-cyan-300" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
