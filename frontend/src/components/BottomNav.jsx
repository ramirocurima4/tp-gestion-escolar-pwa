import { NavLink } from 'react-router-dom'
import { ClipboardList, Home, Star, UserCheck } from 'lucide-react'

const TABS = [
  { to: '/', label: 'Inicio', icon: Home, end: true, accent: 'text-cyan-300' },
  { to: '/asistencia', label: 'Asistencia', icon: UserCheck, accent: 'text-pink-300' },
  { to: '/tps', label: 'TPs', icon: ClipboardList, accent: 'text-amber-300' },
  { to: '/notas', label: 'Notas', icon: Star, accent: 'text-cyan-300' },
]

/**
 * Barra de navegación inferior fija (Inicio, Asistencia, TPs, Notas).
 */
export default function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 z-40 w-full border-t border-white/10 bg-indigo-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
        {TABS.map(({ to, label, icon: Icon, end, accent }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-bold transition active:scale-95 ${
                  isActive
                    ? `${accent} bg-white/10 border border-white/10`
                    : 'text-indigo-300/70 border border-transparent hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
