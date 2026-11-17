import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { AsignaturaProvider } from '../context/AsignaturaContext'

/**
 * Layout de rutas privadas: provee la asignatura activa y la barra inferior.
 */
export default function AppLayout() {
  return (
    <AsignaturaProvider>
      <Outlet />
      <BottomNav />
    </AsignaturaProvider>
  )
}
