import { asArray, text } from '../../lib/site'
import { Reveal } from '../ui'
import { Heading } from './shared'

export default function Timeline({ site }) {
  const exp = site.experience || []
  const edu = [...(site.education || []), ...(site.certificate || [])]

  if (!exp.length && !edu.length) return null

  return (
    <section className="section" id="experience">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{text(site, 'experienceEyebrow', 'Career Path')}</span>
          <h2><Heading>{text(site, 'experienceTitle', 'Experience & *Education*')}</Heading></h2>
        </Reveal>

        <div className="timeline-wrap">
          <Reveal className="timeline-col">
            <h3 className="col-title">{text(site, 'experienceColTitle') || 'Work Experience'}</h3>
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
            <h3 className="col-title">{text(site, 'educationColTitle') || 'Education & Certifications'}</h3>
            <div className="timeline">
              {edu.map((item) => (
                <div className="timeline-item" key={item._id}>
                  <span className="period">{item.data.period || item.data.date}</span>
                  <h4>{item.title}</h4>
                  <span className="org">{item.data.institution || item.data.issuer}</span>
                  {item.data.description && <p>{item.data.description}</p>}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
