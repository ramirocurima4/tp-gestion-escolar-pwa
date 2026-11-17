import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from './AuthContext'
import { MOCK_ALUMNOS, MOCK_ASIGNATURAS } from '../data/mockData'

const ACTIVE_KEY = 'aulapulse_asignatura_activa'
const GRADIENTS = [
  'from-cyan-400 via-sky-500 to-indigo-500',
  'from-pink-500 via-rose-500 to-amber-400',
  'from-emerald-400 via-cyan-400 to-blue-500',
  'from-amber-400 via-pink-500 to-purple-600',
  'from-fuchsia-500 via-pink-500 to-cyan-400',
]

const AsignaturaContext = createContext(null)

/**
 * Mantiene la asignatura activa (compartida por todas las vistas) y los alumnos reales de su curso.
 * Si el backend no tiene asignaturas ni cursos cargados, usa datos demo.
 */
export function AsignaturaProvider({ children }) {
  const { authFetch, usuario } = useAuth()

  const [asignaturas, setAsignaturas] = useState(MOCK_ASIGNATURAS)
  const [isDemo, setIsDemo] = useState(true)
  const [activaId, setActivaIdState] = useState(() => {
    const stored = Number(localStorage.getItem(ACTIVE_KEY))
    return Number.isFinite(stored) && stored > 0 ? stored : null
  })
  const [realAlumnos, setRealAlumnos] = useState({})
  const [loadingAlumnos, setLoadingAlumnos] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  const activa = useMemo(
    () => asignaturas.find((a) => a.id === activaId) ?? asignaturas[0] ?? null,
    [asignaturas, activaId]
  )

  const setActivaId = useCallback((id) => {
    localStorage.setItem(ACTIVE_KEY, String(id))
    setActivaIdState(id)
  }, [])

  const reloadAsignaturas = useCallback(() => setReloadTick((t) => t + 1), [])

  // Carga de asignaturas (o cursos si aún no hay asignaturas) desde FastAPI
  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const [lista, cursos] = await Promise.all([
          authFetch('/asignaturas/').catch(() => []),
          authFetch('/cursos/').catch(() => []),
        ])
        if (ignore) return

        const cursosList = Array.isArray(cursos) ? cursos : []
        const cursosMap = new Map(cursosList.map((c) => [c.id, c]))

        if (Array.isArray(lista) && lista.length > 0) {
          const propias =
            usuario?.rol === 'docente'
              ? lista.filter((a) => a.docente === usuario.id || a.docente_id === usuario.id)
              : lista

          const fuente = propias.length > 0 ? propias : lista
          const mapped = fuente.map((a) => {
            const cursoId = a.curso_id ?? a.curso
            const curso = cursosMap.get(cursoId)
            return {
              id: a.id,
              nombre: a.nombre,
              cursoId,
              cursoLabel: curso ? `${curso.anio}° ${curso.division}` : `Curso #${cursoId}`,
              turno: curso?.turno || '',
            }
          })
          setAsignaturas(mapped)
          setIsDemo(false)
          return
        }

        // Si existen cursos reales aunque no haya asignaturas creadas, usarlos para listar alumnos reales
        if (cursosList.length > 0) {
          const mappedCourses = cursosList.map((c) => ({
            id: c.id,
            nombre: `${c.anio}° ${c.division} — ${c.turno}`,
            cursoId: c.id,
            cursoLabel: `${c.anio}° ${c.division}`,
            turno: c.turno || '',
            isCourseOnly: true,
          }))
          setAsignaturas(mappedCourses)
          setIsDemo(false)
        }
      } catch {
        // Se mantiene el modo demo si el backend no responde
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [authFetch, usuario, reloadTick])

  // Carga de alumnos reales del curso asociado a la asignatura seleccionada: /alumnos/?curso_id={id}
  const cursoActivoId = activa?.cursoId
  const cursoActivoLabel = activa?.cursoLabel
  useEffect(() => {
    if (isDemo || !cursoActivoId) return
    let ignore = false
    setLoadingAlumnos(true)

    authFetch(`/alumnos/?curso_id=${cursoActivoId}`)
      .then((data) => {
        if (ignore || !Array.isArray(data)) return
        const mapped = data.map((al, index) => ({
          id: al.id,
          dni: al.dni,
          email: al.email,
          nombre: `${al.nombre} ${al.apellido}`,
          curso: cursoActivoLabel,
          asistenciaPct: 100,
          riesgoPedagogico: false,
          notaRiesgo: 'Trayectoria regular al día',
          avatarGradient: GRADIENTS[index % GRADIENTS.length],
        }))
        setRealAlumnos((prev) => ({ ...prev, [cursoActivoId]: mapped }))
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoadingAlumnos(false)
      })

    return () => {
      ignore = true
    }
  }, [isDemo, cursoActivoId, cursoActivoLabel, authFetch, reloadTick])

  const alumnos = useMemo(() => {
    if (!activa) return []
    if (isDemo) {
      return (MOCK_ALUMNOS[activa.id] || []).map((al) => ({
        ...al,
        curso: activa.cursoLabel,
      }))
    }
    return realAlumnos[activa.cursoId] || []
  }, [activa, isDemo, realAlumnos])

  const value = useMemo(
    () => ({
      asignaturas,
      activa,
      setActivaId,
      alumnos,
      loadingAlumnos,
      isDemo,
      reloadAsignaturas,
    }),
    [asignaturas, activa, setActivaId, alumnos, loadingAlumnos, isDemo, reloadAsignaturas]
  )

  return <AsignaturaContext.Provider value={value}>{children}</AsignaturaContext.Provider>
}

export function useAsignatura() {
  const context = useContext(AsignaturaContext)
  if (!context) {
    throw new Error('useAsignatura debe utilizarse dentro de un AsignaturaProvider')
  }
  return context
}
