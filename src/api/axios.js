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
  if (err.request && !err.response) return 'Cannot reach the server. Is the backend running?'
  return 'Something went wrong'
}

export default api
