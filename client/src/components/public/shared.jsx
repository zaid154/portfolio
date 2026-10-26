import { Layers, MonitorSmartphone, Server, LayoutDashboard, Code2, Sparkles, Rocket, Zap, Radio } from 'lucide-react'

// Nav section anchors are structural (they must match each <section> id); only the
// visible LABEL comes from the CMS (siteText), so nothing here is hardcoded copy.
export const NAV = [
  { id: 'work', key: 'navWork', label: 'Work' },
  { id: 'skills', key: 'navSkills', label: 'Skills' },
  { id: 'experience', key: 'navExperience', label: 'Experience' },
  { id: 'about', key: 'navAbout', label: 'About' },
  { id: 'contact', key: 'navContact', label: 'Contact' },
]
// Stable reference so useScrollSpy's effect doesn't re-subscribe on every render.
export const NAV_IDS = NAV.map((n) => n.id)

export const SERVICE_ICONS = { Layers, MonitorSmartphone, Server, LayoutDashboard, Code2, Code: Code2, Sparkles, Rocket, Zap, Radio }

export const initials = (name = '') => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

// Render a heading, gradient-highlighting any *asterisk-wrapped* part (falls back to the last two words).
export function Heading({ children }) {
  const str = String(children || '')
  const stars = (str.match(/\*/g) || []).length
  // Only treat asterisks as markers when they're balanced (even count).
  if (stars >= 2 && stars % 2 === 0) {
    return <>{str.split('*').map((p, i) => (i % 2 ? <span key={i} className="gradient-text">{p}</span> : <span key={i}>{p}</span>))}</>
  }
  const words = str.replace(/\*/g, '').split(' ')
  if (words.length < 3) return <span className="gradient-text">{words.join(' ')}</span>
  return <>{words.slice(0, -2).join(' ')} <span className="gradient-text">{words.slice(-2).join(' ')}</span></>
}
