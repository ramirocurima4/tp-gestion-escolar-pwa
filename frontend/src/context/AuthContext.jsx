import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const API_URL = (
  import.meta.env.VITE_API_URL || 'https://tp-gestion-escolar-pwa.onrender.com'
).replace(/\/+$/, '')
const TOKEN_KEY = 'aulapulse_token'
const USER_KEY = 'aulapulse_user'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [usuario, setUsuario] = useState(readStoredUser)

  const persistSession = useCallback((accessToken, userData) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(accessToken)
    setUsuario(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUsuario(null)
  }, [])

  const authFetch = useCallback(
    async (endpoint, options = {}) => {
      const headers = new Headers(options.headers || {})

      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      const isFormLike =
        options.body instanceof FormData || options.body instanceof URLSearchParams
      if (options.body && !isFormLike && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })

      let data = null
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null)
      }

      if (!response.ok) {
        if (response.status === 401 && endpoint !== '/auth/login' && token) {
          logout()
        }
        const message =
          (data && (data.detail || data.mensaje || data.message)) ||
          `Error ${response.status} al comunicarse con el servidor`
        const error = new Error(
          typeof message === 'string' ? message : JSON.stringify(message)
        )
        error.status = response.status
        throw error
      }

      return data
    },
    [token, logout]
  )

  const login = useCallback(
    async (email, password) => {
      const body = new URLSearchParams({
        username: email.trim(),
        password,
      })

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.detail || 'Email o contraseña incorrectos')
      }

      persistSession(data.access_token, data.usuario)
      return data
    },
    [persistSession]
  )

  const register = useCallback(
    async (userData) => {
      return authFetch('/usuarios/', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
    },
    [authFetch]
  )

  const value = useMemo(
    () => ({
      apiUrl: API_URL,
      token,
      usuario,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      authFetch,
    }),
    [token, usuario, login, register, logout, authFetch]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider')
  }
  return context
}
