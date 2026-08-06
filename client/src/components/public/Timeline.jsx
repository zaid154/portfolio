import { CheckCircle2, ExternalLink } from 'lucide-react'
import { first, asArray, text } from '../../lib/site'
import { Reveal } from '../ui'
import Img from '../Img'
import { Heading } from './shared'

export default function Timeline({ site }) {
  const about = first(site, 'about').data
  const exp = site.experience || []
  const edu = [...(site.education || []), ...(site.certificate || [])]
  const highlights = asArray(about.highlights)
  return (
    <section className="section" id="about">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{text(site, 'aboutEyebrow')}</span>
          <h2><Heading>{text(site, 'aboutTitle')}</Heading></h2>
          {about.summary && <p>{about.summary}</p>}
        </Reveal>
        {highlights.length > 0 && (
          <Reveal className="about-highlights">
            {highlights.map((h) => <span key={h}><CheckCircle2 size={16} /> {h}</span>)}
          </Reveal>
        )}
        <div className="timeline-wrap">
          <Reveal className="timeline-col">
            <h3 className="col-title">{text(site, 'experienceTitle')}</h3>
            <div className="timeline">
              {exp.map((item) => (
                <div className="timeline-item" key={item._id}>
                  <span className="period">{item.data.period}</span>
                  <h4>{item.title}</h4>
                  <span className="org">{item.data.company}</span>
                  {item.data.description && <p>{item.data.description}</p>}
                  {asArray(item.data.points).length > 0 && (
                    <ul>{asArray(item.data.points).map((pt) => <li key={pt}>{pt}</li>)}</ul>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="timeline-col" delay={0.1}>
            <h3 className="col-title">{text(site, 'educationTitle')}</h3>
            <div className="timeline">
              {edu.map((item) => (
                <div className="timeline-item" key={item._id}>
                  <span className="period">{item.data.period || item.data.date}</span>
                  <h4>
                    {item.data.image && <Img className="tl-logo" src={item.data.image} alt="" width={48} height={48} />}
                    {item.title}
                  </h4>
                  <span className="org">{item.data.institution || item.data.issuer}</span>
                  {item.data.description && <p>{item.data.description}</p>}
                  {item.data.credentialUrl && item.data.credentialUrl !== '#' && (
                    <a className="tl-link" href={item.data.credentialUrl} target="_blank" rel="noreferrer">{text(site, 'viewCredentialLabel')} <ExternalLink size={13} /></a>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
