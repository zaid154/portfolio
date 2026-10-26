import { Code2, Zap, Radio, GraduationCap, Sparkles, CheckCircle2 } from 'lucide-react'
import { first, asArray, text } from '../../lib/site'
import { Reveal } from '../ui'
import { Heading } from './shared'

export default function About({ site }) {
  const about = first(site, 'about').data
  const highlights = asArray(about.highlights)

  if (!about.summary) return null

  return (
    <section className="section" id="about">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{text(site, 'aboutEyebrow', 'Background')}</span>
          <h2><Heading>{text(site, 'aboutTitle', 'Engineer *Profile & Background*')}</Heading></h2>
        </Reveal>

        <div className="about-bento-grid">
          {/* Main Story & Narrative */}
          <Reveal className="about-narrative-card glass" delay={0.05}>
            <div className="narrative-badge">
              <GraduationCap size={16} /> Software Engineer
            </div>
            <p className="narrative-lead">
              {about.summary}
            </p>
            {highlights.length > 0 && (
              <div className="about-highlights-wrapper">
                <span className="highlights-caption">Core Competencies:</span>
                <div className="about-highlights-pills">
                  {highlights.map((h) => (
                    <span key={h} className="about-pill">
                      <CheckCircle2 size={14} className="pill-check" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Reveal>

          {/* Value Pillars / Engineering Highlights */}
          <div className="about-pillars-stack">
            <Reveal className="about-pillar-card glass" delay={0.1}>
              <div className="pillar-icon zap"><Zap size={20} /></div>
              <div className="pillar-body">
                <h4>Performance & Scaling</h4>
                <p>Reduced database load by 60% and API latency by 45% using Redis caching and optimized queries.</p>
              </div>
            </Reveal>

            <Reveal className="about-pillar-card glass" delay={0.15}>
              <div className="pillar-icon radio"><Radio size={20} /></div>
              <div className="pillar-body">
                <h4>Real-Time & Streaming</h4>
                <p>Architected WebRTC peer calling, Socket.IO live events, and adaptive HLS video streaming pipelines.</p>
              </div>
            </Reveal>

            <Reveal className="about-pillar-card glass" delay={0.2}>
              <div className="pillar-icon code"><Code2 size={20} /></div>
              <div className="pillar-body">
                <h4>Clean MERN Architecture</h4>
                <p>Modular backend services, robust JWT authentication, RBAC authorization, and reactive modern UIs.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
