import { motion } from 'framer-motion'
import { ArrowRight, Download, Terminal, CheckCircle2 } from 'lucide-react'
import { first } from '../../lib/site'
import Img from '../Img'
import { Heading } from './shared'

export default function Hero({ site }) {
  const hero = first(site, 'hero')
  const resume = first(site, 'resume').data

  return (
    <header className="hero" id="home">
      <div className="hero-content">
        {hero.data.badge && (
          <motion.div className="hero-badge-wrap" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <span className="hero-badge">
              <span className="live-dot-container">
                <span className="dot-ping" />
                <span className="dot" />
              </span>
              {hero.data.badge}
            </span>
          </motion.div>
        )}
        {hero.data.eyebrow && (
          <motion.span className="eyebrow hero-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
            {hero.data.eyebrow}
          </motion.span>
        )}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Heading>{hero.data.headline}</Heading>
        </motion.h1>
        <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          {hero.data.description}
        </motion.p>

        {/* Action Buttons */}
        <motion.div className="hero-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <a href="#work" className="btn primary hero-primary-btn">{hero.data.primaryCta} <ArrowRight size={18} /></a>
          {hero.data.secondaryCta && <a href="#contact" className="btn ghost">{hero.data.secondaryCta}</a>}
          {resume.url && <a href={resume.url} target="_blank" rel="noreferrer" className="btn ghost"><Download size={17} /> {resume.label}</a>}
        </motion.div>
      </div>

      <motion.div className="hero-visual" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.6 }}>
        <div className="hero-terminal-card glass">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="term-dot dot-red" />
              <span className="term-dot dot-yellow" />
              <span className="term-dot dot-green" />
            </div>
            <span className="terminal-title">zaid@production: ~ (zsh)</span>
            <span className="terminal-badge">LIVE</span>
          </div>
          <div className="terminal-body font-mono">
            <div className="term-line">
              <span className="term-prompt">$</span> <span className="term-cmd">sysinfo --engineer zaid</span>
            </div>
            <div className="term-result">
              <div className="term-kv"><span className="term-key">STATUS</span> <span className="term-val green">● Available for Full-Time Roles</span></div>
              <div className="term-kv"><span className="term-key">ROLE</span> <span className="term-val">Full-Stack Software Engineer</span></div>
              <div className="term-kv"><span className="term-key">CORE</span> <span className="term-val cyan">React 19 • Node.js • Redis • MongoDB</span></div>
              <div className="term-kv"><span className="term-key">METRICS</span> <span className="term-val yellow">-45% API Latency • -60% DB Load</span></div>
              <div className="term-kv"><span className="term-key">PREV</span> <span className="term-val">Humanoid Maker (Internship Completed)</span></div>
            </div>
            <div className="term-line term-line-next">
              <span className="term-prompt">$</span> <span className="term-cmd-typing">cat engineering-principles.md<span className="term-cursor">_</span></span>
            </div>
          </div>

          {hero.data.image && (
            <div className="terminal-profile-footer">
              <div className="term-avatar-wrap">
                <Img src={hero.data.image} alt={hero.title} width={46} height={46} className="terminal-avatar" />
                <span className="term-online-badge" />
              </div>
              <div className="terminal-profile-info">
                <strong>Mohd Zaid</strong>
                <span>BCA Graduate (IGNOU 70.17%) · Delhi, IN</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </header>
  )
}
