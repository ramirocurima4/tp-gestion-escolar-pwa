import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  BadgeInfo,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react'
import AmbientBackground from '../components/AmbientBackground'
import GlassCard from '../components/GlassCard'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { value: 'docente', label: 'Docente' },
  { value: 'preceptor', label: 'Preceptor' },
  { value: 'admin', label: 'Administrador' },
]

export default function Registro() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    password: '',
    rol: 'docente',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await register({
        ...form,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        email: form.email.trim(),
      })
      setSuccess(response?.mensaje || 'Cuenta creada correctamente. Ya podés iniciar sesión.')
      setTimeout(() => {
        navigate('/login')
      }, 1400)
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta')
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
        className="relative w-full max-w-md space-y-5"
      >
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-2 text-xs font-bold text-indigo-100 hover:bg-white/15 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Login
          </Link>

          <span className="rounded-full bg-pink-500/20 border border-pink-400/30 px-3 py-1 text-xs font-bold text-pink-300">
            Alta de Usuario
          </span>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 border border-cyan-300/40 text-cyan-300 shadow-neon-cyan">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Crear Cuenta
          </h1>
          <p className="mt-1 text-sm text-indigo-200/80">
            Completá tus datos para acceder a AulaPulse
          </p>
        </div>

        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/15 border border-rose-400/40 px-3.5 py-3 text-xs font-medium text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 px-3.5 py-3 text-xs font-medium text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-nombre"
                  className="block text-xs font-bold uppercase tracking-wider text-indigo-200"
                >
                  Nombre
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300/75" />
                  <input
                    id="reg-nombre"
                    type="text"
                    required
                    value={form.nombre}
                    onChange={handleChange('nombre')}
                    placeholder="Sebastián"
                    className="w-full rounded-2xl bg-indigo-950/60 border border-white/15 py-3 pl-9 pr-3 text-sm text-white placeholder:text-indigo-300/45 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reg-apellido"
                  className="block text-xs font-bold uppercase tracking-wider text-indigo-200"
                >
                  Apellido
                </label>
                <input
                  id="reg-apellido"
                  type="text"
                  required
                  value={form.apellido}
                  onChange={handleChange('apellido')}
                  placeholder="Gómez"
                  className="w-full rounded-2xl bg-indigo-950/60 border border-white/15 px-3.5 py-3 text-sm text-white placeholder:text-indigo-300/45 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-dni"
                className="block text-xs font-bold uppercase tracking-wider text-indigo-200"
              >
                DNI
              </label>
              <div className="relative">
                <BadgeInfo className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300/75" />
                <input
                  id="reg-dni"
                  type="text"
                  required
                  inputMode="numeric"
                  value={form.dni}
                  onChange={handleChange('dni')}
                  placeholder="35123456"
                  className="w-full rounded-2xl bg-indigo-950/60 border border-white/15 py-3 pl-10 pr-4 text-sm text-white placeholder:text-indigo-300/45 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-email"
                className="block text-xs font-bold uppercase tracking-wider text-indigo-200"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300/75" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="docente@escuela.edu.ar"
                  className="w-full rounded-2xl bg-indigo-950/60 border border-white/15 py-3 pl-10 pr-4 text-sm text-white placeholder:text-indigo-300/45 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-password"
                className="block text-xs font-bold uppercase tracking-wider text-indigo-200"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300/75" />
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-2xl bg-indigo-950/60 border border-white/15 py-3 pl-10 pr-4 text-sm text-white placeholder:text-indigo-300/45 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-rol"
                className="block text-xs font-bold uppercase tracking-wider text-indigo-200"
              >
                Rol Institucional
              </label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                <select
                  id="reg-rol"
                  value={form.rol}
                  onChange={handleChange('rol')}
                  className="w-full appearance-none rounded-2xl bg-indigo-950/80 border border-white/15 py-3 pl-10 pr-4 text-sm font-semibold text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition"
                >
                  {ROLES.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                      className="bg-indigo-950 text-white"
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
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
                  Registrando...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Crear Cuenta
                </>
              )}
            </motion.button>
          </form>
        </GlassCard>

        <p className="text-center text-sm text-indigo-200/80">
          ¿Ya tenés una cuenta?{' '}
          <Link
            to="/login"
            className="font-bold text-cyan-300 underline decoration-cyan-400/40 underline-offset-4 hover:text-cyan-200 transition"
          >
            Iniciá sesión
          </Link>
        </p>
      </motion.main>
    </div>
  )
}
