import { Code2, Server, Sparkles, Database, Layers } from 'lucide-react'
import { asArray, text } from '../../lib/site'
import { Reveal, StaggerGroup, StaggerItem } from '../ui'
import { Heading } from './shared'

const SKILL_ICONS = {
  'Frontend & UI Engineering': Code2,
  'Backend & API Architecture': Server,
  'AI Integration & Third-Party APIs': Sparkles,
  'Databases, Cloud & DevOps': Database,
}

export default function Skills({ site }) {
  const skills = site.skill || []
  return (
    <section className="section" id="skills">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{text(site, 'skillsEyebrow')}</span>
          <h2><Heading>{text(site, 'skillsTitle')}</Heading></h2>
        </Reveal>
        <StaggerGroup className="skills-grid">
          {skills.map((group) => {
            const Icon = SKILL_ICONS[group.title] || Layers
            return (
              <StaggerItem key={group._id} className="skill-card glass">
                <div className="skill-card-top">
                  <div className="skill-icon-wrapper">
                    <Icon size={20} />
                  </div>
                  <h3>{group.title}</h3>
                </div>
                <div className="skill-tags">
                  {asArray(group.data.skills).map((s) => (
                    <span key={s} className="skill-pill">{s}</span>
                  ))}
                </div>
              </StaggerItem>
            )
          })}
        </StaggerGroup>
      </div>
    </section>
  )
}
