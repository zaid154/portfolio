import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ChevronDown, ChevronUp, Terminal, Layers, Database, Cpu, ExternalLink } from 'lucide-react'
import { asArray, text } from '../../lib/site'
import { Reveal, GithubIcon } from '../ui'
import Img from '../Img'
import { Heading } from './shared'

const INITIAL_LIMIT = 4

function ProjectMedia({ project }) {
  const stack = asArray(project.data.stack)
  const slug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div className="project-card-media">
      {/* Browser / System Frame Header */}
      <div className="media-window-bar">
        <div className="window-dots">
          <span className="dot dot-r" />
          <span className="dot dot-y" />
          <span className="dot dot-g" />
        </div>
        <div className="window-url font-mono">
          {project.data.liveUrl ? (
            <span>https://{project.title.toLowerCase().replace(/\s+/g, '')}.app</span>
          ) : (
            <span>sys://architecture/{slug}</span>
          )}
        </div>
        <span className="window-tag">{project.featured ? 'FLAGSHIP' : 'MERN'}</span>
      </div>

      <div className="shot-scroll">
        {project.data.image ? (
          <Img
            className="project-shot"
            src={project.data.image}
            alt={project.title}
            width={1280}
            height={800}
            sizes="(max-width: 900px) 92vw, 620px"
          />
        ) : (
          <div className="project-blueprint">
            <div className="blueprint-grid-bg" />
            <div className="blueprint-header">
              <span className="bp-badge"><Cpu size={14} /> System Architecture</span>
              <span className="bp-status">● Production Design</span>
            </div>

            <div className="blueprint-pipeline">
              <div className="bp-node">
                <span className="bp-node-type">FRONTEND</span>
                <strong>{stack[0] || 'React 19'}</strong>
                <span className="bp-meta">Reactive UI</span>
              </div>
              <div className="bp-arrow">➔</div>
              <div className="bp-node highlight">
                <span className="bp-node-type">BACKEND API</span>
                <strong>{stack[1] || 'Node / Express'}</strong>
                <span className="bp-meta">REST & Auth</span>
              </div>
              <div className="bp-arrow">➔</div>
              <div className="bp-node">
                <span className="bp-node-type">STORAGE & CACHE</span>
                <strong>{stack[2] || 'MongoDB / Redis'}</strong>
                <span className="bp-meta">Distributed DB</span>
              </div>
            </div>

            <div className="blueprint-footer">
              <span className="bp-tech-lead">Active Stack:</span>
              <div className="bp-tech-tags">
                {stack.slice(0, 5).map((s) => (
                  <span key={s} className="bp-chip">{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Projects({ site, onOpen }) {
  const projects = useMemo(() => site.project || [], [site.project])
  const allTags = useMemo(() => {
    const set = new Set()
    projects.forEach((p) => asArray(p.data.stack).forEach((t) => set.add(t)))
    return ['All', ...Array.from(set)]
  }, [projects])
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(false)

  const filtered = filter === 'All' ? projects : projects.filter((p) => asArray(p.data.stack).includes(filter))
  const displayed = expanded ? filtered : filtered.slice(0, INITIAL_LIMIT)
  const remainingCount = filtered.length - INITIAL_LIMIT

  const liveLabel = text(site, 'liveLabel', 'Live Demo')
  const codeLabel = text(site, 'codeLabel', 'Source Code')
  const detailsLabel = text(site, 'detailsLabel', 'Architecture Details')
  const featuredLabel = text(site, 'featuredLabel', 'Featured Case Study')

  return (
    <section className="section" id="work">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{text(site, 'workEyebrow', 'Engineering Showcase')}</span>
          <h2><Heading>{text(site, 'workTitle', 'Featured *Systems & Projects*')}</Heading></h2>
          <p>{text(site, 'workSubtitle', 'Production-ready full-stack architectures, real-time communication systems, and high-performance web applications.')}</p>
        </Reveal>

        <Reveal className="filter-bar" delay={0.1}>
          {allTags.slice(0, 10).map((tag) => (
            <button key={tag} className={filter === tag ? 'active' : ''} onClick={() => setFilter(tag)}>{tag}</button>
          ))}
        </Reveal>

        <div className="showcase-list">
          <AnimatePresence mode="popLayout">
            {displayed.map((p, i) => (
              <motion.article
                key={p._id || p.title}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                className={i % 2 ? 'showcase-row reverse' : 'showcase-row'}
              >
                <div className="showcase-media" onClick={() => onOpen(p)}>
                  <ProjectMedia project={p} />
                </div>
                <div className="showcase-info">
                  <div className="showcase-badge-row">
                    <span className="snum font-mono">CASE #{String(p.order != null ? p.order : i + 1).padStart(2, '0')}</span>
                    {p.featured && <span className="featured-chip">{featuredLabel}</span>}
                  </div>
                  <h3>{p.title}</h3>
                  <p className="project-desc">{p.data.description}</p>
                  
                  <div className="project-tags">
                    {asArray(p.data.stack).map((t) => <span key={t} className="project-tag-pill">{t}</span>)}
                  </div>
                  
                  <div className="fp-actions">
                    {p.data.liveUrl && p.data.liveUrl !== '#' && (
                      <a href={p.data.liveUrl} target="_blank" rel="noreferrer" className="btn primary compact">
                        {liveLabel} <ArrowUpRight size={15} />
                      </a>
                    )}
                    {p.data.githubUrl && p.data.githubUrl !== '#' && (
                      <a href={p.data.githubUrl} target="_blank" rel="noreferrer" className="btn ghost compact">
                        <GithubIcon size={14} /> {codeLabel}
                      </a>
                    )}
                    <button className="btn ghost compact details-btn" onClick={() => onOpen(p)}>
                      {detailsLabel}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length > INITIAL_LIMIT && (
          <Reveal className="projects-toggle-wrap" delay={0.1}>
            <button
              className="view-more-btn"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? (
                <>Show Less <ChevronUp size={18} /></>
              ) : (
                <>View More Production Projects (+{remainingCount}) <ChevronDown size={18} /></>
              )}
            </button>
          </Reveal>
        )}
      </div>
    </section>
  )
}
