import { motion } from 'framer-motion'
import { ArrowRight, Download, MapPin, Briefcase, GraduationCap, CheckCircle2 } from 'lucide-react'
import { first } from '../../lib/site'
import Img from '../Img'
import { GithubIcon } from '../ui'
import { Heading } from './shared'

export default function Hero({ site }) {
  const hero = first(site, 'hero')
  const resume = first(site, 'resume').data

  return (
    <header className="hero" id="home">
      <div className="hero-content">
        <motion.div
          className="hero-status-pill"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="live-dot-container">
            <span className="dot-ping" />
            <span className="dot" />
          </span>
          <span className="status-text">{hero.data.badge || 'Available for Full-Time Roles'}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Heading>{hero.data.headline || 'Building Scalable MERN & Real-Time Web Applications'}</Heading>
        </motion.h1>

        <motion.p
          className="lead"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          {hero.data.description}
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <a href="#work" className="btn primary">
            {hero.data.primaryCta || 'View Work'} <ArrowRight size={16} />
          </a>
          {resume.url && (
            <a href={resume.url} target="_blank" rel="noreferrer" className="btn ghost">
              <Download size={16} /> {resume.label || 'Resume'}
            </a>
          )}
          {hero.data.secondaryCta && (
            <a href="#contact" className="btn ghost">
              {hero.data.secondaryCta}
            </a>
          )}
        </motion.div>
      </div>

      <motion.div
        className="hero-visual"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <div className="developer-profile-card">
          <div className="profile-card-top">
            {hero.data.image && (
              <div className="profile-photo-wrap">
                <Img
                  src={hero.data.image}
                  alt={hero.title}
                  width={400}
                  height={480}
                  priority
                  className="profile-photo"
                />
                <span className="profile-verified-badge" title="Verified Developer">
                  <CheckCircle2 size={16} />
                </span>
              </div>
            )}
            <div className="profile-header-meta">
              <h3 className="profile-name">Mohd Zaid</h3>
              <span className="profile-title">Full-Stack Software Engineer</span>
              <span className="profile-location">
                <MapPin size={13} /> New Delhi, India (UTC+5:30)
              </span>
            </div>
          </div>

          <div className="profile-card-divider" />

          <div className="profile-facts-list">
            <div className="profile-fact-row">
              <Briefcase size={15} className="fact-icon" />
              <div>
                <strong>Humanoid Maker</strong>
                <span>Full-Stack Intern (Completed · April–August 2026)</span>
              </div>
            </div>

            <div className="profile-fact-row">
              <GraduationCap size={15} className="fact-icon" />
              <div>
                <strong>BCA Graduate — 70.17%</strong>
                <span>Indira Gandhi National Open University (IGNOU)</span>
              </div>
            </div>

            <div className="profile-fact-row">
              <GithubIcon size={15} className="fact-icon" />
              <div>
                <strong>11+ Production Repositories</strong>
                <span>MERN, Redis Caching, WebRTC & Socket.io</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  )
}
