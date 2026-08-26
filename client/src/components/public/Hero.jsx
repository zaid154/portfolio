import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Download, Code2, Zap } from 'lucide-react'
import { first, asArray } from '../../lib/site'
import Img from '../Img'
import { Heading } from './shared'

function useTypewriter(words, speed = 90, pause = 1500) {
  const [str, setStr] = useState('')
  const [i, setI] = useState(0)
  const [del, setDel] = useState(false)

  useEffect(() => {
    if (!words.length) return undefined
    const current = words[i % words.length]
    let timer
    if (!del && str === current) {
      timer = setTimeout(() => setDel(true), pause)
    } else if (del && str === '') {
      setDel(false)
      setI((v) => v + 1)
    } else {
      timer = setTimeout(() => {
        setStr(del ? current.slice(0, str.length - 1) : current.slice(0, str.length + 1))
      }, del ? speed / 2 : speed)
    }
    return () => clearTimeout(timer)
  }, [str, del, i, words, speed, pause])

  return str
}

export default function Hero({ site }) {
  const hero = first(site, 'hero')
  const resume = first(site, 'resume').data
  const roles = asArray(hero.data.roles)
  const role = useTypewriter(roles)
  const quickStats = (site.stat || []).slice(0, 4)

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
          <span className="role">{role}<span className="caret">|</span></span>
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

        {/* Quick Stats Grid */}
        <motion.div className="hero-quickstats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
          {quickStats.map((s) => (
            <div className="qs glass" key={s._id}>
              <strong>{s.data.value || s.title}</strong>
              <span>{s.data.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div className="hero-visual" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.7 }}>
        <span className="hero-orb a" />
        <span className="hero-orb b" />
        <div className="hero-photo-ring">
          <div className="hero-photo">
            {hero.data.image && (
              <Img
                src={hero.data.image}
                alt={hero.title}
                width={560}
                height={700}
                priority
                sizes="(max-width: 900px) 280px, 360px"
              />
            )}
          </div>
        </div>
        {hero.data.floatOne && (
          <motion.div className="hero-float top glass" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
            <Code2 size={16} /> {hero.data.floatOne}
          </motion.div>
        )}
        {hero.data.floatTwo && (
          <motion.div className="hero-float bottom glass" animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }}>
            <Zap size={16} /> {hero.data.floatTwo}
          </motion.div>
        )}
      </motion.div>
    </header>
  )
}
