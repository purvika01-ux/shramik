import axios from 'axios'

export const TOKEN_KEY = 'contractor:token'

// "Remember me" on  -> token kept in localStorage (stays logged in after closing the browser)
// "Remember me" off -> token kept in sessionStorage (logged out when the browser is closed)
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
export function saveToken(token, remember = true) {
  clearToken()
  try {
    ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  } catch {
    /* storage blocked – stays logged in only until refresh */
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

// All requests go to /api (Vite forwards them to the Express server on port 5000)
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

// Send the JWT with every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Readable error text from a failed request */
export function errorMessage(err) {
  if (err.response?.data?.message) return err.response.data.message
  // No response at all, or (in development) the Vite proxy's bare error when the backend is down
  const proxyFailed = [500, 502, 503, 504].includes(err.response?.status) && !err.response?.data
  if ((err.request && !err.response) || proxyFailed) return 'Cannot reach the server. Is the backend running?'
  return 'Something went wrong'
}

export default api
