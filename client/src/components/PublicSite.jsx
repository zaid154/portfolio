import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { first, asArray, text } from '../lib/site'
import { Marquee, GithubIcon } from './ui'

import Navbar from './public/Navbar'
import Hero from './public/Hero'
import Stats from './public/Stats'
import Projects from './public/Projects'
import Skills from './public/Skills'
import Timeline from './public/Timeline'
import About from './public/About'
import Contact from './public/Contact'
import Footer from './public/Footer'
import Modal from './public/Modal'

export default function PublicSite({ site, loading, syncing, theme, toggleTheme }) {
  const [modal, setModal] = useState(null)
  const settings = first(site, 'siteSetting').data

  useEffect(() => {
    const seo = first(site, 'seo').data
    if (seo.title) document.title = seo.title
    if (seo.description) document.querySelector('meta[name="description"]')?.setAttribute('content', seo.description)
    if (seo.keywords) {
      let tag = document.querySelector('meta[name="keywords"]')
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', 'keywords'); document.head.appendChild(tag) }
      tag.setAttribute('content', seo.keywords)
    }
    // Let the admin's "accentColor" site setting actually recolor the brand.
    const accent = settings.accentColor
    if (accent) {
      const root = document.documentElement.style
      root.setProperty('--accent', accent)
      root.setProperty('--g1', accent)
      root.setProperty('--accent-soft', `color-mix(in srgb, ${accent} 16%, transparent)`)
    }
  }, [site, settings.accentColor])

  const techWords = useMemo(
    () => Array.from(new Set((site.skill || []).flatMap((s) => asArray(s.data.skills)))).slice(0, 12),
    [site]
  )

  const openProject = (p) => setModal({
    title: p.title,
    img: p.data.image,
    tags: asArray(p.data.stack),
    body: p.data.description,
    actions: [
      p.data.liveUrl && p.data.liveUrl !== '#' && { label: text(site, 'liveLabel'), href: p.data.liveUrl, primary: true, icon: <ArrowUpRight size={17} /> },
      p.data.githubUrl && p.data.githubUrl !== '#' && { label: text(site, 'codeLabel'), href: p.data.githubUrl, icon: <GithubIcon size={17} /> },
    ].filter(Boolean),
  })
  const openPost = (post) => setModal({
    title: post.title,
    img: post.data.coverImage,
    body: post.data.content || post.data.excerpt,
    actions: [],
  })

  return (
    <>
      <Navbar site={site} settings={settings} theme={theme} toggleTheme={toggleTheme} />
      <main>
        <Hero site={site} />
        {/* `syncing` covers both "nothing yet" and "showing cached/snapshot content
            while the API wakes up" — `loading` is now false the moment the cache
            paints, so it would hide the hint exactly when it's most accurate. It
            clears when the request settles, so a dead API can't pin it on screen. */}
        {(syncing ?? loading) && <div className="notice">{text(site, 'syncingLabel')}</div>}
        <Stats site={site} />
        <Projects site={site} onOpen={openProject} />
        <Skills site={site} />
        <Timeline site={site} />
        <About site={site} />
        <Contact site={site} />
      </main>
      <Footer site={site} />
      {modal && <Modal item={modal} onClose={() => setModal(null)} />}
    </>
  )
}
