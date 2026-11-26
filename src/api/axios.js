import axios from 'axios'

export const TOKEN_KEY = 'contractor:token'

// All requests go to /api (Vite forwards them to the Express server on port 5000)
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

// Send the JWT with every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
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
