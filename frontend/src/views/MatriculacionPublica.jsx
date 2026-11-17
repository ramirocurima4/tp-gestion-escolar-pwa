import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  BadgeInfo,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  User,
} from 'lucide-react'
import AmbientBackground from '../components/AmbientBackground'
import GlassCard from '../components/GlassCard'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'w-full rounded-2xl bg-indigo-950/60 border border-white/15 py-3.5 pl-10 pr-4 text-base text-white placeholder:text-indigo-300/45 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition'

/**
 * Vista pública: el alumno se matricula solo desde el enlace /unirse/:curso_id.
 */
export default function MatriculacionPublica() {
  const { curso_id: cursoId } = useParams()
  const { apiUrl } = useAuth()

  const [form, setForm] = useState({ dni: '', nombre: '', apellido: '', email: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const invalidCurso = !/^\d+$/.test(cursoId || '')

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Endpoint público (sin JWT) para autogestión de matrícula
      const response = await fetch(`${apiUrl}/alumnos/autogestion/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: form.dni.trim(),
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          curso_id: Number(cursoId),
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          throw new Error(
            data?.detail && response.status === 404 && data.detail !== 'Not Found'
              ? data.detail
              : 'La matriculación online todavía no está habilitada. Consultá con tu docente o preceptor.'
          )
        }
        const detail = data?.detail
        throw new Error(
          typeof detail === 'string' ? detail : 'No se pudo completar la matriculación. Revisá los datos.'
        )
      }
      setDone(true)
    } catch (err) {
      setError(
        err instanceof TypeError ? 'No hay conexión con el servidor. Intentá de nuevo.' : err.message
      )
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
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/15 border border-cyan-300/40 text-cyan-300 shadow-neon-cyan">
            <GraduationCap className="h-8 w-8" />
          </div>
          <span className="inline-flex rounded-full bg-pink-500/20 border border-pink-400/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-pink-300">
            Curso #{cursoId}
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Unite a tu curso</h1>
          <p className="mt-1 text-sm text-indigo-200/80">
            Completá tus datos para matricularte en AulaPulse
          </p>
        </div>

        <GlassCard className="p-6">
          {invalidCurso ? (
            <div className="flex items-start gap-2.5 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              El enlace de invitación no es válido. Pedile uno nuevo a tu docente.
            </div>
          ) : done ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-black">¡Listo, ya estás matriculado!</h2>
              <p className="text-sm text-indigo-200/80">
                Tus datos fueron enviados correctamente. Ya podés cerrar esta pantalla.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/15 border border-rose-400/40 px-3.5 py-3 text-xs font-medium text-rose-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <Field label="DNI" id="m-dni" icon={BadgeInfo}>
                <input
                  id="m-dni"
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6,12}"
                  title="Solo números, sin puntos"
                  autoComplete="off"
                  value={form.dni}
                  onChange={handleChange('dni')}
                  placeholder="45123456"
                  className={inputClass}
                />
              </Field>

              <Field label="Nombre" id="m-nombre" icon={User}>
                <input
                  id="m-nombre"
                  type="text"
                  required
                  autoComplete="given-name"
                  value={form.nombre}
                  onChange={handleChange('nombre')}
                  placeholder="Lucía"
                  className={inputClass}
                />
              </Field>

              <Field label="Apellido" id="m-apellido" icon={User}>
                <input
                  id="m-apellido"
                  type="text"
                  required
                  autoComplete="family-name"
                  value={form.apellido}
                  onChange={handleChange('apellido')}
                  placeholder="Martínez"
                  className={inputClass}
                />
              </Field>

              <Field label="Email" id="m-email" icon={Mail}>
                <input
                  id="m-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="alumno@correo.com"
                  className={inputClass}
                />
              </Field>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-base font-black text-indigo-950 shadow-neon-cyan border border-cyan-200/70 disabled:opacity-60 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Matricularme'
                )}
              </motion.button>
            </form>
          )}
        </GlassCard>

        <p className="text-center text-xs text-indigo-300/70">
          ¿Sos docente?{' '}
          <Link to="/login" className="font-bold text-cyan-300 underline underline-offset-4">
            Iniciá sesión
          </Link>
        </p>
      </motion.main>
    </div>
  )
}

function Field({ label, id, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-indigo-200">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300/75" />
        {children}
      </div>
    </div>
  )
}
