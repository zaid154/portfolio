import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { first, asArray, text } from '../lib/site'
import { Marquee, GithubIcon, ErrorBoundary } from './ui'

// Above the fold — these are the first paint, so they stay in the entry bundle.
import Navbar from './public/Navbar'
import Hero from './public/Hero'
import Stats from './public/Stats'

// Everything below the fold is code-split: it is fetched in parallel right after
// the entry executes instead of being parsed and executed before first paint.
const Projects = lazy(() => import('./public/Projects'))
const Skills = lazy(() => import('./public/Skills'))
const Services = lazy(() => import('./public/Services'))
const Timeline = lazy(() => import('./public/Timeline'))
const Testimonials = lazy(() => import('./public/Testimonials'))
const Blog = lazy(() => import('./public/Blog'))
const Contact = lazy(() => import('./public/Contact'))
const Footer = lazy(() => import('./public/Footer'))
const Modal = lazy(() => import('./public/Modal'))

// Deliberately NOT a spinner: an empty box of roughly the section's height, so
// the scrollbar and the page geometry don't jump when the real section lands.
//
// The ErrorBoundary is not optional. React.lazy() REJECTS — it doesn't just stay
// pending — when a chunk can't be fetched (flaky network, or a deploy that
// replaced the hashed assets mid-session, where the SPA rewrite hands back
// index.html and the browser refuses it as a module). Suspense doesn't catch
// that, so without a boundary here one missing below-fold chunk would unmount an
// already-painted page and swap in the app-level error screen. `fallback={null}`
// degrades it to a missing section instead.
function LazySection({ minHeight, children }) {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={<div aria-hidden="true" style={{ minHeight }} />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

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
        {techWords.length > 0 && <Marquee items={techWords} />}
        {/* `syncing` covers both "nothing yet" and "showing cached/snapshot content
            while the API wakes up" — `loading` is now false the moment the cache
            paints, so it would hide the hint exactly when it's most accurate. It
            clears when the request settles, so a dead API can't pin it on screen. */}
        {(syncing ?? loading) && <div className="notice">{text(site, 'syncingLabel')}</div>}
        <Stats site={site} />
        <LazySection minHeight={640}>
          <Projects site={site} onOpen={openProject} />
        </LazySection>
        <LazySection minHeight={520}>
          <Skills site={site} />
        </LazySection>
        <LazySection minHeight={520}>
          <Services site={site} />
        </LazySection>
        <LazySection minHeight={520}>
          <Timeline site={site} />
        </LazySection>
        <LazySection minHeight={440}>
          <Testimonials site={site} />
        </LazySection>
        <LazySection minHeight={520}>
          <Blog site={site} onOpen={openPost} />
        </LazySection>
        <LazySection minHeight={520}>
          <Contact site={site} />
        </LazySection>
      </main>
      <LazySection minHeight={280}>
        <Footer site={site} />
      </LazySection>
      {/* No placeholder: the modal is an overlay, so it occupies no layout space.
          Same boundary rationale as LazySection — a failed Modal chunk must not
          take the whole page down when someone clicks a project card. */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <Modal item={modal} onClose={() => setModal(null)} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
