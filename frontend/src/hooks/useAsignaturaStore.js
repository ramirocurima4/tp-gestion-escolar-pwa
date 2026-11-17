import { useCallback, useState } from 'react'

const keyFor = (key, asignaturaId) => `aulapulse:${key}:${asignaturaId}`

/**
 * Lee un valor persistido por asignatura (o devuelve el fallback).
 */
export function readAsignaturaStore(key, asignaturaId, fallback) {
  try {
    const raw = localStorage.getItem(keyFor(key, asignaturaId))
    if (raw) return JSON.parse(raw)
  } catch {
    // almacenamiento no disponible
  }
  return typeof fallback === 'function' ? fallback() : fallback
}

/**
 * Estado persistido en localStorage por asignatura.
 * Usar con `key={asignaturaId}` en el componente para reiniciar al cambiar de materia.
 */
export function useAsignaturaStore(key, asignaturaId, initialValue) {
  const storageKey = keyFor(key, asignaturaId)
  const [value, setValue] = useState(() =>
    readAsignaturaStore(key, asignaturaId, initialValue)
  )

  const update = useCallback(
    (updater) => {
      setValue((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        try {
          localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {
          // ignorar errores de cuota
        }
        return next
      })
    },
    [storageKey]
  )

  return [value, update]
}
