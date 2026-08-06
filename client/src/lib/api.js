import axios from 'axios'

// In dev, VITE_API_URL is unset → the relative '/api' hits the Vite proxy (same origin,
// no CORS). In production it's set at build time to the deployed backend, e.g.
// https://<your-render-service>.onrender.com/api (Vercel), or '/api' for a same-origin deploy.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // The API sleeps on Render's free plan; a cold start legitimately takes 30-60s,
  // so this is a "something is actually broken" ceiling, not a latency budget.
  // Nothing waits on it visually — useSite() paints cached/snapshot content first.
  timeout: 45000,
})

// Record the API origin so index.html can preconnect to it on the NEXT visit,
// before the bundle loads. The origin can't be known from static HTML, and this
// is the cheapest way to hand it over. Purely an optimisation — wrapped because
// localStorage throws in Safari private mode.
try {
  const base = import.meta.env.VITE_API_URL
  if (base && /^https?:\/\//i.test(base)) {
    localStorage.setItem('portfolio_api_origin', new URL(base).origin)
  }
} catch {
  // Storage blocked or an unparseable base URL — skip the hint.
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('portfolio_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the session expires (401) on an authenticated call, drop the token and
// bounce back to the login page so the user isn't stuck on a broken dashboard.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && localStorage.getItem('portfolio_admin_token')) {
      localStorage.removeItem('portfolio_admin_token')
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        window.location.assign('/admin')
      }
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(error) {
  if (error?.response?.data?.message) return error.response.data.message
  // No response = the API server is unreachable (usually it isn't running).
  if (error?.code === 'ERR_NETWORK' || (error?.request && !error?.response)) {
    return 'Cannot reach the server. Start the backend with "npm run dev".'
  }
  return error?.message || 'Something went wrong'
}
