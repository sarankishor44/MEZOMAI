import axios from 'axios'

const getPhpBase = () => {
  return localStorage.getItem('aria_php_api_url') || import.meta.env.VITE_PHP_API || '/api'
}

const getPyBase = () => {
  return localStorage.getItem('aria_py_api_url') || import.meta.env.VITE_PYTHON_API || '/ai'
}

const getPyRestBase = () => {
  const base = getPyBase().replace(/\/$/, '')
  if (base === '/ai' || base.endsWith('/ai')) return base
  return `${base}/ai`
}

// ── PHP Laravel REST API ──────────────────────────────────────
export const phpApi = axios.create({
  get baseURL() { return getPhpBase() }
})

phpApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('aria_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

phpApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem('aria_token') || ''
      if (!token.startsWith('supabase:')) {
        localStorage.removeItem('aria_token')
        localStorage.removeItem('aria_user')
        // Only redirect if not already on login
        if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(err)
  }
)

// ── Python FastAPI ────────────────────────────────────────────
export const pyApi = axios.create({
  get baseURL() { return getPyRestBase() }
})

pyApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('aria_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── WebSocket helper ──────────────────────────────────────────
export const createWebSocket = (path) => {
  const token = localStorage.getItem('aria_token')
  const pyUrl = getPyBase()
  
  let wsUrl = ''
  if (pyUrl.startsWith('http')) {
    // Replace http with ws
    wsUrl = pyUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws' + path
  } else {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.host
    wsUrl = `${protocol}://${host}/ws${path}`
  }

  return new WebSocket(`${wsUrl}?token=${token}`)
}
