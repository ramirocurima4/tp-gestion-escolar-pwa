import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  LogOut,
  PlusCircle,
  RefreshCw,
  UserPlus,
  Users,
} from 'lucide-react'
import AmbientBackground from '../components/AmbientBackground'
import GlassCard from '../components/GlassCard'
import InviteLinkButton from '../components/InviteLinkButton'
import { useAsignatura } from '../context/AsignaturaContext'
import { useAuth } from '../context/AuthContext'

const TURNOS = ['Mañana', 'Tarde', 'Vespertino', 'Noche']
const CURRENT_YEAR = String(new Date().getFullYear())

export default function AdminPanel() {
  const { authFetch, usuario, logout } = useAuth()
  const { asignaturas, isDemo, reloadAsignaturas } = useAsignatura()

  const [docentes, setDocentes] = useState([])
  const [asignaturaForm, setAsignaturaForm] = useState({
    nombre: '',
    curso_id: '',
    docente_id: '',
  })
  const [savingAsignatura, setSavingAsignatura] = useState(false)

  // Docentes disponibles (si el backend aún no expone GET /usuarios/, se pide el ID manualmente)
  useEffect(() => {
    let ignore = false
    authFetch('/usuarios/')
      .then((data) => {
        if (!ignore && Array.isArray(data)) {
          setDocentes(data.filter((u) => u.rol === 'docente'))
        }
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [authFetch])

  const [cursos, setCursos] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [feedback, setFeedback] = useState(null)

  const [cursoForm, setCursoForm] = useState({
    anio: '4',
    division: 'A',
    turno: 'Mañana',
    ciclo_lectivo: CURRENT_YEAR,
  })
  const [savingCurso, setSavingCurso] = useState(false)

  const [alumnoForm, setAlumnoForm] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    curso_id: '',
  })
  const [savingAlumno, setSavingAlumno] = useState(false)

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [cursosData, alumnosData] = await Promise.all([
        authFetch('/cursos/'),
        authFetch('/alumnos/'),
      ])
      const cursosList = Array.isArray(cursosData) ? cursosData : []
      const alumnosList = Array.isArray(alumnosData) ? alumnosData : []
      setCursos(cursosList)
      setAlumnos(alumnosList)
      if (cursosList.length > 0) {
        setAlumnoForm((prev) =>
          prev.curso_id ? prev : { ...prev, curso_id: String(cursosList[0].id) }
        )
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'No se pudieron cargar los datos institucionales',
      })
    } finally {
      setLoadingData(false)
    }
  }, [authFetch])

  useEffect(() => {
    let ignore = false

    async function fetchInitialData() {
      try {
        const [cursosData, alumnosData] = await Promise.all([
          authFetch('/cursos/'),
          authFetch('/alumnos/'),
        ])
        if (ignore) return
        const cursosList = Array.isArray(cursosData) ? cursosData : []
        const alumnosList = Array.isArray(alumnosData) ? alumnosData : []
        setCursos(cursosList)
        setAlumnos(alumnosList)
        if (cursosList.length > 0) {
          setAlumnoForm((prev) =>
            prev.curso_id ? prev : { ...prev, curso_id: String(cursosList[0].id) }
          )
        }
      } catch (err) {
        if (!ignore) {
          setFeedback({
            type: 'error',
            text: err.message || 'No se pudieron cargar los datos institucionales',
          })
        }
      } finally {
        if (!ignore) {
          setLoadingData(false)
        }
      }
    }

    fetchInitialData()
    return () => {
      ignore = true
    }
  }, [authFetch])

  const handleCreateCurso = async (event) => {
    event.preventDefault()
    setFeedback(null)
    setSavingCurso(true)

    try {
      const res = await authFetch('/cursos/', {
        method: 'POST',
        body: JSON.stringify({
          anio: Number(cursoForm.anio),
          division: cursoForm.division.trim().toUpperCase(),
          turno: cursoForm.turno,
          ciclo_lectivo: Number(cursoForm.ciclo_lectivo) || new Date().getFullYear(),
        }),
      })
      setFeedback({
        type: 'success',
        text: res?.mensaje || 'Curso creado correctamente',
      })
      setCursoForm((prev) => ({ ...prev, division: '' }))
      reloadAsignaturas()
      await loadData()
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'No se pudo crear el curso',
      })
    } finally {
      setSavingCurso(false)
    }
  }

  const handleCreateAlumno = async (event) => {
    event.preventDefault()
    if (!alumnoForm.curso_id) {
      setFeedback({
        type: 'error',
        text: 'Primero creá o seleccioná un curso para matricular al alumno.',
      })
      return
    }

    setFeedback(null)
    setSavingAlumno(true)

    try {
      const res = await authFetch('/alumnos/', {
        method: 'POST',
        body: JSON.stringify({
          dni: alumnoForm.dni.trim(),
          nombre: alumnoForm.nombre.trim(),
          apellido: alumnoForm.apellido.trim(),
          curso_id: Number(alumnoForm.curso_id),
        }),
      })
      setFeedback({
        type: 'success',
        text: res?.mensaje || 'Alumno matriculado correctamente',
      })
      setAlumnoForm((prev) => ({
        ...prev,
        dni: '',
        nombre: '',
        apellido: '',
      }))
      reloadAsignaturas()
      await loadData()
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'No se pudo registrar el alumno',
      })
    } finally {
      setSavingAlumno(false)
    }
  }

  const handleCreateAsignatura = async (event) => {
    event.preventDefault()
    const cursoId = asignaturaForm.curso_id || (cursos[0] ? String(cursos[0].id) : '')
    if (!cursoId) {
      setFeedback({ type: 'error', text: 'Primero creá un curso para vincular la asignatura.' })
      return
    }

    setFeedback(null)
    setSavingAsignatura(true)
    try {
      const res = await authFetch('/asignaturas/', {
        method: 'POST',
        body: JSON.stringify({
          nombre: asignaturaForm.nombre.trim(),
          curso_id: Number(cursoId),
          docente_id: Number(asignaturaForm.docente_id),
        }),
      })
      setFeedback({ type: 'success', text: res?.mensaje || 'Asignatura creada correctamente' })
      setAsignaturaForm((prev) => ({ ...prev, nombre: '' }))
      reloadAsignaturas()
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo crear la asignatura' })
    } finally {
      setSavingAsignatura(false)
    }
  }

  const getCursoLabel = (cursoId) => {
    const found = cursos.find((c) => c.id === cursoId)
    return found ? `${found.anio}° ${found.division} · ${found.turno}` : `Curso #${cursoId}`
  }

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-indigo-950 text-white">
      <AmbientBackground />

      <main className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {/* Barra superior */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-2 text-xs font-bold text-indigo-100 hover:bg-white/15 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/35 px-3 py-1 text-xs font-bold text-cyan-300">
              <GraduationCap className="h-3.5 w-3.5" />
              Panel Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loadingData}
              title="Actualizar datos"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 border border-white/15 px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-white/15 disabled:opacity-50 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={logout}
              title="Cerrar sesión"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-500/20 border border-rose-400/35 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/30 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </div>
        </header>

        {/* Encabezado contextual */}
        <GlassCard variant="dark" className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
            Gestión Académica · {usuario?.rol || 'admin'}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
            Cursos y Matrícula de Alumnos
          </h1>
          <p className="mt-1 text-sm text-indigo-200/75">
            Administrá la estructura institucional conectada al backend FastAPI.
          </p>
        </GlassCard>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </motion.div>
        )}

        {/* Formularios en tarjetas oscuras con bordes sutiles */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Crear Curso */}
          <GlassCard variant="dark" className="p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-300">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">Nuevo Curso</h2>
                <p className="text-xs text-indigo-300/75">Año, división y turno</p>
              </div>
            </div>

            <form onSubmit={handleCreateCurso} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="curso-anio"
                    className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
                  >
                    Año
                  </label>
                  <input
                    id="curso-anio"
                    type="number"
                    min="1"
                    max="7"
                    required
                    value={cursoForm.anio}
                    onChange={(e) =>
                      setCursoForm((prev) => ({ ...prev, anio: e.target.value }))
                    }
                    className="w-full rounded-2xl bg-indigo-950/75 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="curso-division"
                    className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
                  >
                    División
                  </label>
                  <input
                    id="curso-division"
                    type="text"
                    required
                    maxLength={10}
                    value={cursoForm.division}
                    onChange={(e) =>
                      setCursoForm((prev) => ({ ...prev, division: e.target.value }))
                    }
                    placeholder="A"
                    className="w-full rounded-2xl bg-indigo-950/75 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-indigo-300/40 focus:border-cyan-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="curso-turno"
                    className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
                  >
                    Turno
                  </label>
                  <select
                    id="curso-turno"
                    value={cursoForm.turno}
                    onChange={(e) =>
                      setCursoForm((prev) => ({ ...prev, turno: e.target.value }))
                    }
                    className="w-full rounded-2xl bg-indigo-950/90 border border-white/10 px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
                  >
                    {TURNOS.map((turno) => (
                      <option key={turno} value={turno} className="bg-indigo-950">
                        {turno}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="curso-ciclo"
                    className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
                  >
                    Ciclo
                  </label>
                  <input
                    id="curso-ciclo"
                    type="number"
                    required
                    value={cursoForm.ciclo_lectivo}
                    onChange={(e) =>
                      setCursoForm((prev) => ({
                        ...prev,
                        ciclo_lectivo: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl bg-indigo-950/75 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={savingCurso}
                whileTap={{ scale: 0.97 }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 py-3 text-sm font-black text-indigo-950 shadow-neon-cyan disabled:opacity-60 transition"
              >
                {savingCurso ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                {savingCurso ? 'Guardando...' : 'Crear Curso'}
              </motion.button>
            </form>
          </GlassCard>

          {/* Registrar Alumno */}
          <GlassCard variant="dark" className="p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500/15 border border-pink-400/30 text-pink-300">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">Registrar Alumno</h2>
                <p className="text-xs text-indigo-300/75">Matricular en curso activo</p>
              </div>
            </div>

            <form onSubmit={handleCreateAlumno} className="space-y-3.5">
              <div className="space-y-1">
                <label
                  htmlFor="alumno-dni"
                  className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
                >
                  DNI
                </label>
                <input
                  id="alumno-dni"
                  type="text"
                  required
                  inputMode="numeric"
                  value={alumnoForm.dni}
                  onChange={(e) =>
                    setAlumnoForm((prev) => ({ ...prev, dni: e.target.value }))
                  }
                  placeholder="45987654"
                  className="w-full rounded-2xl bg-indigo-950/75 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-indigo-300/40 focus:border-cyan-400 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="alumno-nombre"
                    className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
                  >
                    Nombre
                  </label>
                  <input
                    id="alumno-nombre"
                    type="text"
                    required
                    value={alumnoForm.nombre}
                    onChange={(e) =>
                      setAlumnoForm((prev) => ({ ...prev, nombre: e.target.value }))
                    }
                    placeholder="Lucía"
                    className="w-full rounded-2xl bg-indigo-950/75 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-indigo-300/40 focus:border-cyan-400 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="alumno-apellido"
                    className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
                  >
                    Apellido
                  </label>
                  <input
                    id="alumno-apellido"
                    type="text"
                    required
                    value={alumnoForm.apellido}
                    onChange={(e) =>
                      setAlumnoForm((prev) => ({ ...prev, apellido: e.target.value }))
                    }
                    placeholder="Martínez"
                    className="w-full rounded-2xl bg-indigo-950/75 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-indigo-300/40 focus:border-cyan-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="alumno-curso"
                  className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
                >
                  Curso Asignado
                </label>
                <select
                  id="alumno-curso"
                  required
                  value={alumnoForm.curso_id}
                  onChange={(e) =>
                    setAlumnoForm((prev) => ({ ...prev, curso_id: e.target.value }))
                  }
                  className="w-full rounded-2xl bg-indigo-950/90 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
                >
                  {cursos.length === 0 ? (
                    <option value="">Sin cursos disponibles</option>
                  ) : (
                    cursos.map((curso) => (
                      <option key={curso.id} value={curso.id} className="bg-indigo-950">
                        {curso.anio}° {curso.division} — {curso.turno} ({curso.ciclo_lectivo})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <motion.button
                type="submit"
                disabled={savingAlumno || cursos.length === 0}
                whileTap={{ scale: 0.97 }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-500/25 border border-pink-400/50 py-3 text-sm font-black text-pink-100 shadow-neon-pink disabled:opacity-50 transition"
              >
                {savingAlumno ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {savingAlumno ? 'Matriculando...' : 'Registrar Alumno'}
              </motion.button>
            </form>
          </GlassCard>
        </div>

        {/* Nueva Asignatura */}
        <GlassCard variant="dark" className="p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/15 border border-amber-300/30 text-amber-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Nueva Asignatura</h2>
              <p className="text-xs text-indigo-300/75">Materia, curso y docente asignado</p>
            </div>
          </div>

          <form onSubmit={handleCreateAsignatura} className="space-y-3.5">
            <div className="space-y-1">
              <label
                htmlFor="asig-nombre"
                className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
              >
                Nombre de la Materia
              </label>
              <input
                id="asig-nombre"
                type="text"
                required
                value={asignaturaForm.nombre}
                onChange={(e) =>
                  setAsignaturaForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Cultura y Comunicación"
                className="w-full rounded-2xl bg-indigo-950/75 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-indigo-300/40 focus:border-cyan-400 focus:outline-none transition"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="asig-curso"
                  className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
                >
                  Carrera / Curso
                </label>
                <select
                  id="asig-curso"
                  required
                  value={asignaturaForm.curso_id || (cursos[0] ? String(cursos[0].id) : '')}
                  onChange={(e) =>
                    setAsignaturaForm((prev) => ({ ...prev, curso_id: e.target.value }))
                  }
                  className="w-full rounded-2xl bg-indigo-950/90 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
                >
                  {cursos.length === 0 ? (
                    <option value="">Sin cursos disponibles</option>
                  ) : (
                    cursos.map((curso) => (
                      <option key={curso.id} value={curso.id} className="bg-indigo-950">
                        {curso.anio}° {curso.division} — {curso.turno}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="asig-docente"
                  className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200"
                >
                  Docente Asignado
                </label>
                {docentes.length > 0 ? (
                  <select
                    id="asig-docente"
                    required
                    value={asignaturaForm.docente_id}
                    onChange={(e) =>
                      setAsignaturaForm((prev) => ({ ...prev, docente_id: e.target.value }))
                    }
                    className="w-full rounded-2xl bg-indigo-950/90 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
                  >
                    <option value="" className="bg-indigo-950">
                      Seleccioná un docente
                    </option>
                    {docentes.map((doc) => (
                      <option key={doc.id} value={doc.id} className="bg-indigo-950">
                        {doc.apellido}, {doc.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="asig-docente"
                    type="number"
                    min="1"
                    required
                    value={asignaturaForm.docente_id}
                    onChange={(e) =>
                      setAsignaturaForm((prev) => ({ ...prev, docente_id: e.target.value }))
                    }
                    placeholder="ID del docente"
                    className="w-full rounded-2xl bg-indigo-950/75 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-indigo-300/40 focus:border-cyan-400 focus:outline-none transition"
                  />
                )}
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={savingAsignatura || cursos.length === 0}
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400/25 border border-amber-300/50 py-3 text-sm font-black text-amber-100 shadow-neon-amber disabled:opacity-50 transition"
            >
              {savingAsignatura ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              {savingAsignatura ? 'Guardando...' : 'Crear Asignatura'}
            </motion.button>
          </form>

          {!isDemo && asignaturas.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
              {asignaturas.map((asig) => (
                <li
                  key={asig.id}
                  className="flex items-center justify-between rounded-2xl bg-indigo-950/70 border border-white/10 px-3.5 py-2.5 text-xs"
                >
                  <span className="font-bold text-white">{asig.nombre}</span>
                  <span className="text-indigo-300/80">{asig.cursoLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Listados de cursos y alumnos */}
        <div className="grid gap-5 md:grid-cols-2">
          <GlassCard variant="dark" className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-200">
                Cursos Activos
              </h3>
              <span className="rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                {cursos.length}
              </span>
            </div>

            {cursos.length === 0 ? (
              <p className="text-xs text-indigo-300/70">
                Todavía no hay cursos cargados en el sistema.
              </p>
            ) : (
              <ul className="space-y-2">
                {cursos.map((curso) => (
                  <li
                    key={curso.id}
                    className="flex items-center justify-between rounded-2xl bg-indigo-950/70 border border-white/10 px-3.5 py-2.5 text-xs"
                  >
                    <span className="font-bold text-white">
                      {curso.anio}° &quot;{curso.division}&quot;
                    </span>
                    <span className="text-indigo-300/80">
                      {curso.turno} · {curso.ciclo_lectivo}
                    </span>
                    <InviteLinkButton cursoId={curso.id} compact />
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard variant="dark" className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wider text-indigo-200">
                <Users className="h-4 w-4 text-cyan-300" />
                Alumnos Matriculados
              </h3>
              <span className="rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-xs font-bold text-pink-300">
                {alumnos.length}
              </span>
            </div>

            {alumnos.length === 0 ? (
              <p className="text-xs text-indigo-300/70">
                No hay alumnos registrados todavía.
              </p>
            ) : (
              <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {alumnos.map((al) => (
                  <li
                    key={al.id}
                    className="flex items-center justify-between rounded-2xl bg-indigo-950/70 border border-white/10 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {al.apellido}, {al.nombre}
                      </p>
                      <p className="text-[11px] text-indigo-300/70">DNI {al.dni}</p>
                    </div>
                    <span className="rounded-xl bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                      {getCursoLabel(al.curso)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </main>
    </div>
  )
}
