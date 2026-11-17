import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // se intenta el método alternativo
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

/**
 * Copia al portapapeles el enlace público de matriculación del curso (/unirse/:curso_id).
 */
export default function InviteLinkButton({ cursoId, compact = false }) {
  const [state, setState] = useState('idle') // idle | copied | failed
  const url = `${window.location.origin}/unirse/${cursoId}`

  const handleClick = async () => {
    const ok = await copyText(url)
    setState(ok ? 'copied' : 'failed')
    setTimeout(() => setState('idle'), 3500)
  }

  const copied = state === 'copied'

  return (
    <div className={compact ? '' : 'space-y-1.5'}>
      <button
        type="button"
        onClick={handleClick}
        disabled={!cursoId}
        className={
          compact
            ? 'inline-flex items-center gap-1 rounded-xl bg-pink-500/20 border border-pink-400/40 px-2.5 py-1 text-[11px] font-bold text-pink-200 active:scale-95 transition disabled:opacity-45'
            : 'flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-500/20 border border-pink-400/50 py-3 text-sm font-extrabold text-pink-100 shadow-neon-pink active:scale-95 transition disabled:opacity-45'
        }
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied ? '¡Enlace copiado!' : compact ? 'Invitación' : 'Generar Enlace de Invitación'}
      </button>
      {state === 'failed' && (
        <p className="break-all rounded-xl bg-indigo-900/50 border border-white/15 px-3 py-2 text-[11px] text-indigo-200">
          No se pudo copiar automáticamente. Copiá este enlace: {url}
        </p>
      )}
    </div>
  )
}
