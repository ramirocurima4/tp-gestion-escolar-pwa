import AmbientBackground from './AmbientBackground'
import SubjectSelector from './SubjectSelector'

/**
 * Contenedor mobile-first de las vistas internas, con cabecera y selector de asignatura.
 */
export default function PageShell({ kicker, title, icon: Icon, maxWidth = 'max-w-md', children }) {
  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-indigo-950 text-white">
      <AmbientBackground />
      <main className={`relative mx-auto w-full ${maxWidth} space-y-5 px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))]`}>
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500/15 border border-pink-400/35 text-pink-300">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
                {kicker}
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
            </div>
          </div>
          <SubjectSelector />
        </header>
        {children}
      </main>
    </div>
  )
}
