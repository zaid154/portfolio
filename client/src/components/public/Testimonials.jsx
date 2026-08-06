import { Quote } from 'lucide-react'
import { text } from '../../lib/site'
import { Reveal, StaggerGroup, StaggerItem } from '../ui'
import Img from '../Img'
import { Heading, initials } from './shared'

export default function Testimonials({ site }) {
  const list = site.testimonial || []
  if (!list.length) return null
  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">{text(site, 'testimonialsEyebrow')}</span>
          <h2><Heading>{text(site, 'testimonialsTitle')}</Heading></h2>
        </Reveal>
        <StaggerGroup className="tst-grid">
          {list.map((t) => (
            <StaggerItem key={t._id} className="tst-card glass">
              <Quote className="quote-icon" size={30} />
              <p>{t.data.quote}</p>
              <div className="tst-author">
                {t.data.avatar
                  ? <Img className="tst-avatar" src={t.data.avatar} alt={t.data.name || t.title} width={96} height={96} />
                  : <div className="tst-avatar">{initials(t.data.name || t.title)}</div>}
                <div><strong>{t.data.name || t.title}</strong><span>{t.data.role}</span></div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
