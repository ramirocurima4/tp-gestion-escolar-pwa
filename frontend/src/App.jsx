import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import AdminPanel from './views/AdminPanel'
import Asistencia from './views/Asistencia'
import Calificaciones from './views/Calificaciones'
import Dashboard from './views/Dashboard'
import Instalacion from './views/Instalacion'
import Login from './views/Login'
import MatriculacionPublica from './views/MatriculacionPublica'
import Registro from './views/Registro'
import TrabajosPracticos from './views/TrabajosPracticos'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/unirse/:curso_id" element={<MatriculacionPublica />} />

          {/* Rutas protegidas (JWT) con asignatura activa y barra inferior */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard key="inicio" />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/asistencia" element={<Asistencia />} />
              <Route path="/tps" element={<TrabajosPracticos />} />
              <Route path="/notas" element={<Calificaciones />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/instalacion" element={<Instalacion />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
