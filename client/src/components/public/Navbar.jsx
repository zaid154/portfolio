import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, LogIn, Menu, Moon, Sun, X } from 'lucide-react'
import { text } from '../../lib/site'
import { useScrollSpy } from '../../lib/hooks'
import Img from '../Img'
import { NAV, NAV_IDS } from './shared'

export default function Navbar({ site, settings, theme, toggleTheme }) {
  const [open, setOpen] = useState(false)
  const active = useScrollSpy(NAV_IDS)
  const cta = settings.ctaText

  return (
    <>
      <motion.nav
        className="nav"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <a href="#home" className="brand"><span className="logo">{settings.logoImage ? <Img src={settings.logoImage} alt={settings.siteName} width={40} height={40} /> : settings.logoText}</span>{settings.siteName}</a>
        <div className="nav-links">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={active === n.id ? 'active' : ''}>{text(site, n.key)}</a>
          ))}
        </div>
        <div className="nav-actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/admin" className="icon-btn admin-link" aria-label="Admin login" title="Admin login"><LogIn size={18} /></Link>
          <a href="#contact" className="btn primary compact nav-cta">{cta} <ArrowRight size={16} /></a>
          <button className="icon-btn burger" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={20} /></button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div className="mobile-sheet" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <button className="icon-btn" style={{ position: 'absolute', top: 20, right: 20 }} onClick={() => setOpen(false)}><X size={20} /></button>
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className={active === n.id ? 'active' : ''} onClick={() => setOpen(false)}>{text(site, n.key)}</a>
            ))}
            <a href="#contact" onClick={() => setOpen(false)}>{cta}</a>
            <Link to="/admin" onClick={() => setOpen(false)}>{text(site, 'navAdmin')}</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
