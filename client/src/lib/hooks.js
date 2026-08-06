import { useEffect, useRef, useState } from 'react'
import { api } from './api'

// ─── Instant paint, then revalidate ──────────────────────────────────────────
// The API runs on a free Render instance that sleeps after ~15 minutes idle, so
// the first request after a quiet period can take 30-60s. Blocking the whole page
// on that is what caused the "blank screen after deploy" problem. Content is now
// read from three sources, fastest first — each one only fills in for the ones
// that haven't answered yet:
//
//   1. localStorage — a returning visitor's last successful payload, read
//      SYNCHRONOUSLY during the first render, so the full site paints on the
//      first commit with zero network wait.
//   2. /site-snapshot.json — a build-time dump of /public/site (see
//      scripts/snapshot.mjs) served straight off the Vercel CDN. index.html
//      starts fetching it in <head>, before the JS bundle is even parsed, and
//      parks the promise on window.__SITE_SNAPSHOT__ for us to consume.
//   3. The live API — always authoritative. It overwrites whatever is on screen
//      when it lands and re-seeds the localStorage cache.
//
// The database is still the SINGLE source of truth: 1 and 2 are just older copies
// of it, and there is no hardcoded fallback content — an empty DB shows empty
// sections exactly as before.
const SITE_CACHE_KEY = 'portfolio_site_cache'
// Bump this whenever the shape of `site` changes — old envelopes are then ignored
// rather than rendered by components that no longer understand them.
const SITE_CACHE_VERSION = 1
// localStorage quotas sit around 5MB and throw when exceeded. Anything this big
// isn't worth caching, so skip the write instead of risking a QuotaExceededError.
const SITE_CACHE_MAX_CHARS = 1500000
const SNAPSHOT_URL = '/site-snapshot.json'

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

// Every localStorage touch is wrapped: Safari private mode throws on read AND
// write, and a half-written or stale-schema envelope must never break the render.
function readSiteCache() {
  try {
    const raw = window.localStorage.getItem(SITE_CACHE_KEY)
    if (!raw) return null
    const envelope = JSON.parse(raw)
    if (!isPlainObject(envelope) || envelope.v !== SITE_CACHE_VERSION) return null
    return isPlainObject(envelope.site) ? envelope.site : null
  } catch {
    // Unavailable, unparseable, or written by an older schema — ignore it.
    return null
  }
}

function writeSiteCache(site) {
  try {
    const json = JSON.stringify({ v: SITE_CACHE_VERSION, savedAt: Date.now(), site })
    if (json.length > SITE_CACHE_MAX_CHARS) {
      // Too big to store — drop any previous copy so we don't serve a stale one forever.
      window.localStorage.removeItem(SITE_CACHE_KEY)
      return
    }
    window.localStorage.setItem(SITE_CACHE_KEY, json)
  } catch {
    // Quota exceeded or storage blocked. The cache is an optimisation, never a requirement.
  }
}

// Reuse the request index.html already started; only fetch here if it's missing
// (dev without the inline script, or a browser that choked on it).
function readSnapshot() {
  try {
    const pending = window.__SITE_SNAPSHOT__
    const request =
      pending && typeof pending.then === 'function'
        ? pending
        : fetch(SNAPSHOT_URL).then((res) => (res.ok ? res.json() : null))
    return Promise.resolve(request)
      .then((body) => (isPlainObject(body) && isPlainObject(body.site) ? body.site : null))
      .catch(() => null)
  } catch {
    // No snapshot deployed (the SPA rewrite hands back index.html, which fails
    // to parse as JSON) — that's expected, not an error.
    return Promise.resolve(null)
  }
}

// Returns { site, loading, source, stale }. `site` and `loading` keep their exact
// old meaning for existing callers, except that `loading` is now true ONLY while
// there is genuinely nothing to show — cached or snapshot content renders immediately.
export function useSite() {
  const [state, setState] = useState(() => {
    const cached = readSiteCache()
    return cached
      ? { site: cached, loading: false, source: 'cache', pending: true }
      : { site: {}, loading: true, source: null, pending: true }
  })

  useEffect(() => {
    let alive = true
    // Once the live payload lands it wins permanently — a snapshot that resolves
    // late must never clobber fresher content.
    let hasLive = false

    readSnapshot().then((snapshotSite) => {
      if (!alive || hasLive || !snapshotSite) return
      // Only fills the gap: a localStorage hit is newer than a build-time snapshot.
      setState((prev) =>
        prev.source ? prev : { site: snapshotSite, loading: false, source: 'snapshot', pending: prev.pending }
      )
    })

    api
      .get('/public/site')
      .then(({ data }) => {
        if (!alive) return
        hasLive = true
        const site = isPlainObject(data?.site) ? data.site : {}
        setState({ site, loading: false, source: 'live', pending: false })
        writeSiteCache(site)
      })
      .catch(() => {
        if (!alive) return
        // An unreachable API must not blank out a page that's already rendering
        // cached or snapshot content — only clear the spinner if we have nothing.
        // Either way the request has settled, so `pending` goes false: an API that
        // never answers must not leave the "syncing" hint on screen forever.
        setState((prev) =>
          prev.loading
            ? { site: {}, loading: false, source: null, pending: false }
            : { ...prev, pending: false }
        )
      })

    return () => {
      alive = false
    }
  }, [])

  return {
    site: state.site,
    loading: state.loading,
    source: state.source, // 'cache' | 'snapshot' | 'live' | null
    stale: state.source !== 'live', // true while showing anything the API hasn't confirmed
    // Drives the "syncing" hint. Unlike `stale` it clears when the request
    // SETTLES, success or failure — a dead API leaves no permanent banner.
    syncing: state.pending,
  }
}

// Persisted dark/light theme, defaults to dark for the premium look.
export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('portfolio_theme') || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.body.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('portfolio_theme', theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return { theme, toggle }
}

// Track which section is in view for active nav highlighting.
export function useScrollSpy(ids, offset = 120) {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    function onScroll() {
      const pos = window.scrollY + offset
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= pos) current = id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ids, offset])

  return active
}

// Count from 0 to target once the element scrolls into view.
export function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const end = Number(target) || 0
          const start = performance.now()
          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setValue(Math.round(end * eased))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [target, duration])

  return { ref, value }
}
