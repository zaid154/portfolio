import { Component, useCallback, useEffect, useState } from 'react'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useCountUp } from '../lib/hooks'

/* Catches render errors so one bad component doesn't blank the whole site */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      // A `fallback` prop scopes the boundary: pass `null` around a code-split
      // section so a chunk that fails to download drops just that section
      // instead of replacing an already-painted page with the error screen.
      if ('fallback' in this.props) return this.props.fallback
      return (
        <div className="err-screen">
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please reload the page.</p>
          <button className="btn primary" onClick={() => window.location.reload()}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

/* Scroll-linked progress bar at the top of the page */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
  return <motion.div className="scroll-progress" style={{ scaleX, width: '100%' }} />
}

/* One-time intro preloader.

   It is a cover for the moment before content exists — never a delay in its own
   right. Two rules keep it honest:
     1. It leaves the instant the app is ready (`ready` = the site payload landed).
     2. A hard cap guarantees it can never add more than PRELOADER_CAP_MS to a
        load, however slow or dead the API is.
   It is skipped entirely for `prefers-reduced-motion: reduce` and for sessions
   that have already seen it. It is also pointer-transparent, so the page below
   is interactive from the first frame even while the overlay fades. */
const PRELOADER_CAP_MS = 450
const PRELOADER_FADE_S = 0.25

function shouldShowPreloader() {
  try {
    if (sessionStorage.getItem('pl_shown')) return false
  } catch {
    /* sessionStorage can throw in blocked/private contexts — treat as "not seen" */
  }
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  } catch {
    /* no matchMedia — fall through and show */
  }
  return true
}

export function Preloader({ mark = 'MZ', ready = false }) {
  const [show, setShow] = useState(shouldShowPreloader)

  const dismiss = useCallback(() => {
    setShow(false)
    try {
      sessionStorage.setItem('pl_shown', '1')
    } catch {
      /* ignore — the overlay still goes away, it just may show again next load */
    }
  }, [])

  // Hard cap. Mount-only, so a late `ready` can never extend it.
  useEffect(() => {
    if (!show) return undefined
    const t = setTimeout(dismiss, PRELOADER_CAP_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismiss])

  // Ready → leave on the very next frame, i.e. as soon as there is something
  // painted underneath to look at.
  useEffect(() => {
    if (!show || !ready) return undefined
    const raf = requestAnimationFrame(dismiss)
    return () => cancelAnimationFrame(raf)
  }, [show, ready, dismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="preloader"
          style={{ pointerEvents: 'none' }}
          exit={{ opacity: 0, transition: { duration: PRELOADER_FADE_S } }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mark gradient-text"
          >
            {mark}
          </motion.div>
          <div className="bar">
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: PRELOADER_CAP_MS / 1000 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Scroll-reveal wrapper */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }) {
  const MotionTag = motion[as] || motion.div
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </MotionTag>
  )
}

/* Staggered container + item helpers */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } },
}

export function StaggerGroup({ children, className }) {
  return (
    <motion.div className={className} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      {children}
    </motion.div>
  )
}
export function StaggerItem({ children, className, ...rest }) {
  return (
    <motion.div className={className} variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  )
}

/* Count-up number */
export function Counter({ to, suffix = '', label }) {
  const { ref, value } = useCountUp(to)
  return (
    <div className="stat-tile glass" ref={ref}>
      <div className="num">
        {value}
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
      <div className="lbl">{label}</div>
    </div>
  )
}

/* Back-to-top button */
export function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          className="back-top"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          whileHover={{ y: -3 }}
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

/* Brand icons (removed from lucide for trademark reasons) */
export function GithubIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.28 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}
export function LinkedinIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

/* Infinite marquee of tech words */
export function Marquee({ items }) {
  const loop = [...items, ...items]
  return (
    <div className="marquee">
      <div className="marquee-track">
        {loop.map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  )
}
