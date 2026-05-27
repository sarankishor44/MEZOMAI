import axios from 'axios'

const trimTrailingSlash = (value) => (value || '').trim().replace(/\/$/, '')

const stripPythonRoutePrefix = (value) => {
  const base = trimTrailingSlash(value)
  return base.endsWith('/ai') ? base.slice(0, -3) : base
}

export const getPhpBase = () => {
  return trimTrailingSlash(localStorage.getItem('aria_php_api_url') || import.meta.env.VITE_PHP_API || 'https://mezomaiadmin.vercel.app')
}

export const getPyBase = () => {
  return trimTrailingSlash(localStorage.getItem('aria_py_api_url') || import.meta.env.VITE_PYTHON_API || 'https://mezomaipy.vercel.app')
}

export const getPyRootBase = () => {
  return stripPythonRoutePrefix(getPyBase())
}

export const getPyRestBase = () => {
  const base = getPyBase()
  if (base === '/ai' || base.endsWith('/ai')) return base
  return `${base}/ai`
}

export const setBackendUrls = ({ phpUrl, pythonUrl }) => {
  if (phpUrl) localStorage.setItem('aria_php_api_url', trimTrailingSlash(phpUrl))
  else localStorage.removeItem('aria_php_api_url')

  if (pythonUrl) localStorage.setItem('aria_py_api_url', stripPythonRoutePrefix(pythonUrl))
  else localStorage.removeItem('aria_py_api_url')
}

export const getBackendUrls = () => ({
  phpUrl: getPhpBase(),
  pythonUrl: getPyRootBase(),
  pythonRestUrl: getPyRestBase(),
})

export const phpApi = axios.create({
  baseURL: getPhpBase(),
})

phpApi.interceptors.request.use((config) => {
  config.baseURL = getPhpBase()
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
        if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(err)
  }
)

export const pyApi = axios.create({
  baseURL: getPyRestBase(),
})

pyApi.interceptors.request.use((config) => {
  config.baseURL = getPyRestBase()
  const token = localStorage.getItem('aria_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const createWebSocket = (path) => {
  const token = localStorage.getItem('aria_token')
  const pyUrl = getPyRootBase()

  let wsUrl = ''
  if (pyUrl.startsWith('http')) {
    wsUrl = pyUrl.replace(/^http/, 'ws') + '/ws' + path
  } else {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.host
    wsUrl = `${protocol}://${host}/ws${path}`
  }

  return new WebSocket(`${wsUrl}?token=${token || ''}`)
}
