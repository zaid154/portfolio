import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ChevronDown, ChevronUp, Code2, ExternalLink } from 'lucide-react'
import { asArray, text } from '../../lib/site'
import { Reveal, GithubIcon } from '../ui'
import Img from '../Img'
import { Heading } from './shared'

const INITIAL_LIMIT = 4

// Authentic code snippets for backend / logic-heavy projects without UI screenshots
const CODE_SNIPPETS = {
  'MockMate AI': {
    file: 'controllers/interview.controller.js',
    lang: 'JavaScript',
    lines: [
      `// Evaluate candidate technical response with Google Gemini API`,
      `export async function evaluateAnswer(req, res) {`,
      `  const { question, candidateAnswer, targetRole } = req.body;`,
      `  const prompt = \`Role: \${targetRole}\\nQuestion: \${question}\\nCandidate: \${candidateAnswer}`,
      `Score technical accuracy (1-10), provide constructive feedback and key improvements.\`;`,
      `  const response = await aiModel.generateContent(prompt);`,
      `  const result = parseStructuredFeedback(response.text());`,
      `  await Session.findByIdAndUpdate(req.params.id, { $push: { evaluations: result } });`,
      `  return res.json({ success: true, evaluation: result });`,
      `}`,
    ],
  },
  'ATS Resume Builder and Analyzer': {
    file: 'services/atsScoring.service.js',
    lang: 'JavaScript',
    lines: [
      `// Calculate semantic keyword density and ATS compliance score`,
      `export function analyzeATSCompliance(resumeData, jobKeywords) {`,
      `  const normalized = extractCleanText(resumeData).toLowerCase();`,
      `  const matched = jobKeywords.filter((k) =>`,
      `    new RegExp(\`\\\\b\${k.toLowerCase()}\\\\b\`, 'i').test(normalized)`,
      `  );`,
      `  const score = Math.round((matched.length / jobKeywords.length) * 100);`,
      `  const missing = jobKeywords.filter((k) => !matched.includes(k));`,
      `  return { score, matchedCount: matched.length, missingKeywords: missing };`,
      `}`,
    ],
  },
  DevMeet: {
    file: 'socket/webrtcHandler.js',
    lang: 'JavaScript',
    lines: [
      `// Real-time WebRTC peer-to-peer signaling over Socket.io`,
      `export function registerWebRTCHandlers(io, socket) {`,
      `  socket.on('call:offer', ({ recipientId, sdpOffer }) => {`,
      `    io.to(recipientId).emit('call:incoming', { from: socket.id, sdpOffer });`,
      `  });`,
      `  socket.on('call:answer', ({ targetId, sdpAnswer }) => {`,
      `    io.to(targetId).emit('call:connected', { from: socket.id, sdpAnswer });`,
      `  });`,
      `  socket.on('ice:candidate', ({ targetId, candidate }) => {`,
      `    io.to(targetId).emit('ice:candidate', { candidate });`,
      `  });`,
      `}`,
    ],
  },
  NexTalk: {
    file: 'middleware/cache.js',
    lang: 'JavaScript',
    lines: [
      `// Redis distributed caching middleware for sub-millisecond channel state`,
      `export async function cacheChannelState(req, res, next) {`,
      `  const cacheKey = \`channel:\${req.params.channelId}:messages\`;`,
      `  const cached = await redisClient.get(cacheKey);`,
      `  if (cached) return res.json({ success: true, data: JSON.parse(cached), fromCache: true });`,
      `  res.sendResponse = res.json;`,
      `  res.json = (body) => {`,
      `    redisClient.setEx(cacheKey, 120, JSON.stringify(body));`,
      `    res.sendResponse(body);`,
      `  };`,
      `  next();`,
      `}`,
    ],
  },
  'PeoplePay HR & Payroll EMS': {
    file: 'controllers/payroll.controller.js',
    lang: 'JavaScript',
    lines: [
      `// Automated gross-to-net salary batch calculation with tax deductions`,
      `export function computePayroll(basicSalary, allowances, deductions) {`,
      `  const totalAllowances = allowances.reduce((acc, a) => acc + a.amount, 0);`,
      `  const grossPay = basicSalary + totalAllowances;`,
      `  const taxableIncome = Math.max(0, grossPay - 50000);`,
      `  const taxRate = taxableIncome > 100000 ? 0.15 : 0.05;`,
      `  const computedTax = taxableIncome * taxRate;`,
      `  const netSalary = grossPay - (computedTax + deductions.reduce((acc, d) => acc + d.amount, 0));`,
      `  return { grossPay, computedTax, netSalary };`,
      `}`,
    ],
  },
}

function ProjectMedia({ project }) {
  const snippet = CODE_SNIPPETS[project.title]

  return (
    <div className="project-preview-frame">
      <div className="preview-top-bar">
        <span className="preview-file-meta font-mono">
          {snippet ? snippet.file : `src/${project.title.toLowerCase().replace(/\s+/g, '-')}`}
        </span>
        <span className="preview-type-pill">
          {project.data.image ? 'PRODUCTION UI' : 'SOURCE CODE'}
        </span>
      </div>

      <div className="preview-content">
        {project.data.image ? (
          <Img
            className="project-shot"
            src={project.data.image}
            alt={project.title}
            width={1280}
            height={800}
            sizes="(max-width: 900px) 92vw, 620px"
          />
        ) : snippet ? (
          <div className="code-snippet-box">
            <pre className="code-pre font-mono">
              <code>
                {snippet.lines.map((line, idx) => (
                  <div key={idx} className="code-line">
                    <span className="line-num">{idx + 1}</span>
                    <span className="line-code">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        ) : (
          <div className="code-snippet-box">
            <pre className="code-pre font-mono">
              <code>
                <div className="code-line">
                  <span className="line-num">1</span>
                  <span className="line-code">{`// ${project.title} — Full-Stack Implementation`}</span>
                </div>
                <div className="code-line">
                  <span className="line-num">2</span>
                  <span className="line-code">{`// Tech Stack: ${asArray(project.data.stack).join(', ')}`}</span>
                </div>
                <div className="code-line">
                  <span className="line-num">3</span>
                  <span className="line-code">{`export default async function handleRequest(req, res) {`}</span>
                </div>
                <div className="code-line">
                  <span className="line-num">4</span>
                  <span className="line-code">{`  return res.status(200).json({ status: "healthy", ready: true });`}</span>
                </div>
                <div className="code-line">
                  <span className="line-num">5</span>
                  <span className="line-code">{`}`}</span>
                </div>
              </code>
            </pre>
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
  const codeLabel = text(site, 'codeLabel', 'Source Code')
  const detailsLabel = text(site, 'detailsLabel', 'Architecture Details')

  return (
    <section className="section" id="work">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">{text(site, 'workEyebrow', 'Selected Work')}</span>
          <h2><Heading>{text(site, 'workTitle', 'Production Systems & Applications')}</Heading></h2>
          <p>{text(site, 'workSubtitle', 'Full-stack web applications, real-time architectures, and backend microservices engineered with clean architecture.')}</p>
        </Reveal>

        <Reveal className="filter-bar" delay={0.1}>
          {allTags.slice(0, 10).map((tag) => (
            <button key={tag} className={filter === tag ? 'active' : ''} onClick={() => setFilter(tag)}>{tag}</button>
          ))}
        </Reveal>

        <div className="showcase-list">
          <AnimatePresence mode="popLayout">
            {displayed.map((p, i) => (
              <motion.article
                key={p._id || p.title}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className={i % 2 ? 'showcase-row reverse' : 'showcase-row'}
              >
                <div className="showcase-media" onClick={() => onOpen(p)}>
                  <ProjectMedia project={p} />
                </div>
                <div className="showcase-info">
                  <div className="showcase-meta-header font-mono">
                    <span className="project-index">#{String(p.order != null ? p.order : i + 1).padStart(2, '0')}</span>
                    {p.featured && <span className="featured-tag">FLAGSHIP</span>}
                  </div>
                  <h3>{p.title}</h3>
                  <p className="project-desc">{p.data.description}</p>

                  <div className="project-tags">
                    {asArray(p.data.stack).map((t) => (
                      <span key={t} className="project-tag-pill">{t}</span>
                    ))}
                  </div>

                  <div className="fp-actions">
                    {p.data.liveUrl && p.data.liveUrl !== '#' && (
                      <a href={p.data.liveUrl} target="_blank" rel="noreferrer" className="btn primary compact">
                        {liveLabel} <ArrowUpRight size={14} />
                      </a>
                    )}
                    {p.data.githubUrl && p.data.githubUrl !== '#' && (
                      <a href={p.data.githubUrl} target="_blank" rel="noreferrer" className="btn ghost compact">
                        <GithubIcon size={14} /> {codeLabel}
                      </a>
                    )}
                    <button className="btn ghost compact" onClick={() => onOpen(p)}>
                      {detailsLabel}
                    </button>
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
                <>Show Less <ChevronUp size={16} /></>
              ) : (
                <>View All Projects (+{remainingCount}) <ChevronDown size={16} /></>
              )}
            </button>
          </Reveal>
        )}
      </div>
    </section>
  )
}
