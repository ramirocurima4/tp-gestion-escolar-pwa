import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react'
import AmbientBackground from '../components/AmbientBackground'
import GlassCard from '../components/GlassCard'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/'

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-indigo-950 px-4 py-8 text-white">
      <AmbientBackground />

      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-md space-y-6"
      >
        {/* Logo y título minimalista */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/15 border border-cyan-300/40 text-cyan-300 shadow-neon-cyan">
            <GraduationCap className="h-8 w-8" />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-300">
            AulaPulse PWA
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            Iniciar Sesión
          </h1>
          <p className="mt-1 text-sm text-indigo-200/80">
            Gestión escolar ágil y seguimiento en tiempo real
          </p>
        </div>

        {/* Tarjeta glassmorphism del formulario */}
        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/15 border border-rose-400/40 px-3.5 py-3 text-xs font-medium text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-indigo-200"
              >
                Email institucional
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300/75" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="docente@escuela.edu.ar"
                  className="w-full rounded-2xl bg-indigo-950/60 border border-white/15 py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-indigo-300/45 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-indigo-200"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300/75" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl bg-indigo-950/60 border border-white/15 py-3.5 pl-10 pr-11 text-sm text-white placeholder:text-indigo-300/45 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-indigo-300/75 hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-base font-black text-indigo-950 shadow-neon-cyan border border-cyan-200/70 disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar al Panel
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>
        </GlassCard>

        <p className="text-center text-sm text-indigo-200/80">
          ¿Todavía no tenés usuario?{' '}
          <Link
            to="/registro"
            className="font-bold text-cyan-300 underline decoration-cyan-400/40 underline-offset-4 hover:text-cyan-200 transition"
          >
            Crear cuenta
          </Link>
        </p>
      </motion.main>
    </div>
  )
}
