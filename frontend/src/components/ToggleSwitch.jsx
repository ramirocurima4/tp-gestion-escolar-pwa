import { Check, X } from 'lucide-react'

/**
 * Switch gigante tap-friendly: verde esmeralda (Entregó) / rojo rosa (Falta).
 */
export default function ToggleSwitch({
  checked,
  onChange,
  onLabel = 'Entregó',
  offLabel = 'Falta',
  ariaLabel,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative h-14 w-32 shrink-0 rounded-full border-2 transition-colors duration-200 active:scale-95 ${
        checked
          ? 'bg-emerald-500/25 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.45)]'
          : 'bg-rose-500/25 border-rose-400 shadow-neon-red'
      }`}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-wide transition-all ${
          checked ? 'left-4 text-emerald-200' : 'right-4 text-rose-200'
        }`}
      >
        {checked ? onLabel : offLabel}
      </span>
      <span
        className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 ${
          checked ? 'left-[calc(100%-2.75rem)] bg-emerald-500' : 'left-1.5 bg-rose-500'
        }`}
      >
        {checked ? <Check className="h-5 w-5 stroke-[3]" /> : <X className="h-5 w-5 stroke-[3]" />}
      </span>
    </button>
  )
}
