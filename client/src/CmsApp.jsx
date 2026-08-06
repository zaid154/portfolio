import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSite, useTheme } from './lib/hooks'
import { ScrollProgress, Preloader, BackToTop, ErrorBoundary } from './components/ui'
import PublicSite from './components/PublicSite'

// Admin code is only loaded when someone actually visits /admin (keeps the public bundle small).
const Login = lazy(() => import('./components/Admin').then((m) => ({ default: m.Login })))
const Dashboard = lazy(() => import('./components/Admin').then((m) => ({ default: m.Dashboard })))

// The toast host renders nothing until a toast fires, so it has no business being
// in the critical bundle. Safe to defer: `toast()` dispatches into react-hot-toast's
// module-level `memoryState`, and `useStore` seeds its state from that map when the
// Toaster finally mounts — so anything fired before mount is still shown.
const Toaster = lazy(() => import('react-hot-toast').then((m) => ({ default: m.Toaster })))

function RequireAuth({ children }) {
  return localStorage.getItem('portfolio_admin_token') ? children : <Navigate to="/admin" />
}

const AdminFallback = () => <div className="admin-loading">Loading dashboard…</div>

// Pure chrome (scroll progress bar, back-to-top) is invisible at scroll 0 on every
// route, so it is mounted one frame after the first paint. Nothing is lost and the
// framer-motion spring/scroll wiring stays off the critical render path.
function useAfterFirstPaint() {
  const [painted, setPainted] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setPainted(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  return painted
}

export default function CmsApp() {
  const { theme, toggle } = useTheme()
  const { site, loading, syncing } = useSite()
  const painted = useAfterFirstPaint()

  return (
    <BrowserRouter>
      <Preloader mark={site?.siteSetting?.[0]?.data?.logoText || 'MZ'} ready={!loading} />
      {painted && <ScrollProgress />}
      {/* Scoped boundary, not the app-level one: this chunk is fetched at runtime,
          so a flaky network or a mid-session deploy can make it reject. Unguarded
          that would tear down the whole root — the toast host is the least
          important thing on the page and must never be able to do that. */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--surface-solid)',
                color: 'var(--text)',
                border: '1px solid var(--line-strong)',
                borderRadius: '14px',
              },
            }}
          />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<AdminFallback />}>
          <Routes>
            <Route path="/" element={<PublicSite site={site} loading={loading} syncing={syncing} theme={theme} toggleTheme={toggle} />} />
            <Route path="/admin" element={<Login theme={theme} toggleTheme={toggle} />} />
            <Route path="/admin/dashboard" element={<RequireAuth><Dashboard theme={theme} toggleTheme={toggle} /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {painted && <BackToTop />}
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div className="notfound">
      <span className="nf-code gradient-text">404</span>
      <h1>Page not found</h1>
      <p>The page you’re looking for doesn’t exist or has moved.</p>
      <a className="btn primary" href="/">Back home</a>
    </div>
  )
}
