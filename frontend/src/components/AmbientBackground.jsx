/**
 * Fondo ambiental oscuro bg-indigo-950 con resplandores neón sutiles.
 */
export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-28 -left-24 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
    </div>
  )
}
