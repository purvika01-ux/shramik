import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { clearToken, getToken, saveToken } from '../api/axios'

const AuthContext = createContext(null)

/**
 * Keeps track of who is logged in.
 * The JWT is saved in localStorage so the user stays logged in after a refresh.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(() => !!getToken())

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const saveLogin = (res, remember = true) => {
    saveToken(res.data.token, remember)
    setUser(res.data.user)
    return res.data.user
  }

  const login = useCallback(async (email, password, remember = true) => saveLogin(await api.post('/auth/login', { email, password }), remember), [])
  const register = useCallback(
    async (name, email, mobile, password) => saveLogin(await api.post('/auth/register', { name, email, mobile, password })),
    [],
  )

  // On page load: if a token is saved, ask the server who it belongs to
  useEffect(() => {
    if (!getToken()) return
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => clearToken())
      .finally(() => setChecking(false))
  }, [])

  // If the server says 401 (token expired or account deactivated), log out
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const isLoginRequest = err.config?.url?.startsWith('/auth/')
        if (err.response?.status === 401 && !isLoginRequest) logout()
        return Promise.reject(err)
      },
    )
    return () => api.interceptors.response.eject(id)
  }, [logout])

  const value = useMemo(() => ({ user, checking, login, register, logout }), [user, checking, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
