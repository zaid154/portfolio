import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react'
import { asArray, text } from '../../lib/site'
import { Reveal, GithubIcon } from '../ui'
import Img from '../Img'
import { Heading } from './shared'

const INITIAL_LIMIT = 4

function ProjectMedia({ project }) {
  return (
    <div className="project-card-media">
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
          <div className="project-shot placeholder">
            <div className="placeholder-content">
              <span className="placeholder-title">{project.title}</span>
              <span className="placeholder-sub">Full Stack Project</span>
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
  const codeLabel = text(site, 'codeLabel', 'Code')
  const detailsLabel = text(site, 'detailsLabel', 'Details')
  const featuredLabel = text(site, 'featuredLabel', 'Featured')

  return (
    <section className="section" id="work">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{text(site, 'workEyebrow')}</span>
          <h2><Heading>{text(site, 'workTitle')}</Heading></h2>
          <p>{text(site, 'workSubtitle')}</p>
        </Reveal>

        <Reveal className="filter-bar" delay={0.1}>
          {allTags.slice(0, 12).map((tag) => (
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
                transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                className={i % 2 ? 'showcase-row reverse' : 'showcase-row'}
              >
                <div className="showcase-media" onClick={() => onOpen(p)}>
                  <ProjectMedia project={p} />
                </div>
                <div className="showcase-info">
                  <span className="snum">{String(p.order != null ? p.order : i + 1).padStart(2, '0')}{p.featured ? ` — ${featuredLabel}` : ''}</span>
                  <h3>{p.title}</h3>
                  <p>{p.data.description}</p>
                  <div className="project-tags">
                    {asArray(p.data.stack).map((t) => <span key={t}>{t}</span>)}
                  </div>
                  <div className="fp-actions">
                    {p.data.liveUrl && p.data.liveUrl !== '#' && <a href={p.data.liveUrl} target="_blank" rel="noreferrer" className="btn primary compact">{liveLabel} <ArrowUpRight size={16} /></a>}
                    {p.data.githubUrl && p.data.githubUrl !== '#' && <a href={p.data.githubUrl} target="_blank" rel="noreferrer" className="btn ghost compact"><GithubIcon size={15} /> {codeLabel}</a>}
                    <button className="btn ghost compact" onClick={() => onOpen(p)}>{detailsLabel}</button>
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
                <>View More Projects (+{remainingCount}) <ChevronDown size={18} /></>
              )}
            </button>
          </Reveal>
        )}
      </div>
    </section>
  )
}

