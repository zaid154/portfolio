import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Search, X, Sparkles, Radio, ChevronDown, ChevronUp } from 'lucide-react'
import { asArray, text } from '../../lib/site'
import { Reveal, GithubIcon } from '../ui'
import Img from '../Img'
import { Heading } from './shared'

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

const CATEGORIES = [
  { label: 'All', value: 'All' },
  { label: '⭐ Featured', value: 'Featured' },
  { label: '🚀 MERN Full-Stack', value: 'MERN' },
  { label: '🤖 AI & Gemini', value: 'AI' },
  { label: '⚡ Real-Time', value: 'Realtime' },
  { label: '🛍️ E-Commerce', value: 'E-Commerce' },
  { label: '⚙️ .NET & SaaS', value: 'DOTNET' },
  { label: '🎨 React & UI', value: 'React' },
]

export default function Projects({ site, onOpen }) {
  const projects = useMemo(() => site.project || [], [site.project])
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const liveLabel = text(site, 'liveLabel', 'Live Demo')
  const codeLabel = text(site, 'codeLabel', 'Source Code')
  const detailsLabel = text(site, 'detailsLabel', 'View Details')
  const featuredLabel = text(site, 'featuredLabel', 'Featured')

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const title = (p.title || '').toLowerCase()
      const desc = (p.data?.description || '').toLowerCase()
      const stack = asArray(p.data?.stack).map((s) => s.toLowerCase())
      const stackStr = stack.join(' ')

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = title.includes(q)
        const matchDesc = desc.includes(q)
        const matchStack = stack.some((s) => s.includes(q))
        if (!matchTitle && !matchDesc && !matchStack) return false
      }

      // Category match
      if (activeCategory === 'Featured') return p.featured
      if (activeCategory === 'MERN') return stackStr.includes('mern') || (stackStr.includes('react') && stackStr.includes('node')) || stackStr.includes('express')
      if (activeCategory === 'AI') return stackStr.includes('gemini') || stackStr.includes('openai') || title.includes('ai') || desc.includes('gemini')
      if (activeCategory === 'Realtime') return stackStr.includes('socket.io') || stackStr.includes('webrtc') || desc.includes('real-time')
      if (activeCategory === 'E-Commerce') return desc.includes('e-commerce') || title.includes('mart') || title.includes('store') || title.includes('kart')
      if (activeCategory === 'DOTNET') return stackStr.includes('asp.net') || stackStr.includes('.net') || stackStr.includes('c#')
      if (activeCategory === 'React') return stackStr.includes('react') || stackStr.includes('vite') || stackStr.includes('tailwind')

      return true
    })
  }, [projects, activeCategory, searchQuery])

  // Show top 6 unless showAll is toggled or user is actively filtering/searching
  const isFiltering = activeCategory !== 'All' || searchQuery.trim() !== ''
  const displayList = isFiltering || showAll ? filteredProjects : filteredProjects.slice(0, 6)

  return (
    <section className="section" id="work">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{text(site, 'workEyebrow')}</span>
          <h2><Heading>{text(site, 'workTitle')}</Heading></h2>
          <p>{text(site, 'workSubtitle')}</p>
        </Reveal>

        {/* Search & Category Filter Control Hub */}
        <Reveal className="project-controls" delay={0.1}>
          <div className="project-search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search projects by name, stack (e.g. Gemini, Socket.io, React, Node.js)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')} aria-label="Clear Search">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filter-bar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={activeCategory === cat.value ? 'active' : ''}
                onClick={() => {
                  setActiveCategory(cat.value)
                  setShowAll(false)
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="project-results-info">
            <span>Showing <strong>{displayList.length}</strong> of <strong>{filteredProjects.length}</strong> {filteredProjects.length === 1 ? 'project' : 'projects'}</span>
            {activeCategory !== 'All' && <span className="active-tag-pill">{activeCategory}</span>}
          </div>
        </Reveal>

        {/* Project List Showcase */}
        <div className="showcase-list">
          <AnimatePresence mode="popLayout">
            {displayList.map((p, i) => {
              const stackList = asArray(p.data?.stack)
              const isAi = stackList.some((s) => /gemini|openai|ai/i.test(s)) || /ai/i.test(p.title)
              const isRealtime = stackList.some((s) => /socket\.io|webrtc/i.test(s))

              return (
                <motion.article
                  key={p._id || p.title}
                  layout
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                  className={i % 2 ? 'showcase-row reverse' : 'showcase-row'}
                >
                  <div className="showcase-media" onClick={() => onOpen(p)}>
                    <ProjectMedia project={p} />
                  </div>
                  <div className="showcase-info">
                    <div className="project-meta-row">
                      <span className="snum">{String(p.order != null ? p.order : i + 1).padStart(2, '0')}</span>
                      {p.featured && <span className="badge-pill featured">★ {featuredLabel}</span>}
                      {isAi && <span className="badge-pill ai"><Sparkles size={12} /> AI Integration</span>}
                      {isRealtime && <span className="badge-pill realtime"><Radio size={12} /> Real-Time</span>}
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.data?.description}</p>
                    <div className="project-tags">
                      {stackList.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                    <div className="fp-actions">
                      {p.data?.liveUrl && p.data.liveUrl !== '#' && (
                        <a href={p.data.liveUrl} target="_blank" rel="noreferrer" className="btn primary compact">
                          {liveLabel} <ArrowUpRight size={16} />
                        </a>
                      )}
                      {p.data?.githubUrl && p.data.githubUrl !== '#' && (
                        <a href={p.data.githubUrl} target="_blank" rel="noreferrer" className="btn ghost compact">
                          <GithubIcon size={15} /> {codeLabel}
                        </a>
                      )}
                      <button className="btn ghost compact" onClick={() => onOpen(p)}>
                        {detailsLabel}
                      </button>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty Search State */}
        {filteredProjects.length === 0 && (
          <div className="projects-empty-state glass">
            <p>No projects found matching "<strong>{searchQuery}</strong>".</p>
            <button className="btn ghost compact" onClick={() => { setSearchQuery(''); setActiveCategory('All') }}>
              Reset Filters
            </button>
          </div>
        )}

        {/* Expand / Show More Projects Button */}
        {!isFiltering && filteredProjects.length > 6 && (
          <div className="show-more-projects">
            <button
              className="btn ghost load-more-btn"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? (
                <>Show Top Projects <ChevronUp size={18} /></>
              ) : (
                <>View All {filteredProjects.length} Projects <ChevronDown size={18} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

