import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { asArray, text } from '../../lib/site'
import { Reveal, GithubIcon } from '../ui'
import Img from '../Img'
import { Heading } from './shared'

// Browser-frame address bar: show ONLY the real liveUrl hostname from the CMS.
// If a project has no liveUrl we show its (DB) title rather than fabricating a
// fake "<name>.vercel.app" domain — nothing on screen is invented in code.
function displayUrl(project) {
  const u = project.data.liveUrl
  if (u && /^https?:\/\//i.test(u)) {
    try { return new URL(u).hostname.replace(/^www\./, '') } catch { /* fall through */ }
  }
  return project.title
}

function BrowserFrame({ project }) {
  return (
    <div className="browser">
      <div className="browser-bar">
        <i className="tl r" /><i className="tl y" /><i className="tl g" />
        <span className="url">{displayUrl(project)}</span>
      </div>
      <div className="shot-scroll">
        {project.data.image
          ? <Img className="browser-shot" src={project.data.image} alt={project.title} width={1280} height={800} sizes="(max-width: 900px) 92vw, 620px" />
          : <div className="browser-shot placeholder" />}
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
  const shown = filter === 'All' ? projects : projects.filter((p) => asArray(p.data.stack).includes(filter))
  const liveLabel = text(site, 'liveLabel')
  const codeLabel = text(site, 'codeLabel')
  const detailsLabel = text(site, 'detailsLabel')
  const featuredLabel = text(site, 'featuredLabel')

  return (
    <section className="section" id="work">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{text(site, 'workEyebrow')}</span>
          <h2><Heading>{text(site, 'workTitle')}</Heading></h2>
          <p>{text(site, 'workSubtitle')}</p>
        </Reveal>

        <Reveal className="filter-bar" delay={0.1}>
          {allTags.slice(0, 8).map((tag) => (
            <button key={tag} className={filter === tag ? 'active' : ''} onClick={() => setFilter(tag)}>{tag}</button>
          ))}
        </Reveal>

        <div className="showcase-list">
          <AnimatePresence mode="popLayout">
            {shown.map((p, i) => (
              <motion.article
                key={p._id}
                layout
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                className={i % 2 ? 'showcase-row reverse' : 'showcase-row'}
              >
                <div className="showcase-media" onClick={() => onOpen(p)}>
                  <BrowserFrame project={p} />
                </div>
                <div className="showcase-info">
                  <span className="snum">{String(i + 1).padStart(2, '0')}{p.featured ? ` — ${featuredLabel}` : ''}</span>
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
      </div>
    </section>
  )
}
