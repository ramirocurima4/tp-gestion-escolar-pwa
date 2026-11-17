/**
 * Tarjeta reutilizable con estilo glassmorphism oscuro y bordes sutiles.
 */
export default function GlassCard({ children, className = '', variant = 'glass' }) {
  const variantClasses =
    variant === 'dark'
      ? 'bg-slate-950/45 backdrop-blur-xl border border-white/10 shadow-2xl'
      : 'bg-indigo-900/50 backdrop-blur-xl border border-white/15 shadow-xl'

  return (
    <div className={`rounded-3xl ${variantClasses} ${className}`}>
      {children}
    </div>
  )
}
