import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Check } from 'lucide-react'
import { first, text } from '../../lib/site'
import Img from '../Img'
import { NAV } from './shared'

export default function Footer({ site }) {
  const settings = first(site, 'siteSetting').data
  const socials = site.socialLink || []
  const [copied, setCopied] = useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText('zaidm1323@gmail.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-colophon glass">
          <div className="colophon-meta">
            <span className="colophon-tag font-mono">COLOPHON</span>
            <p className="colophon-text">
              Handcrafted portfolio engineered with React 19, Vite, Node.js, Express, and MongoDB Atlas. Deployed on Render & Vercel.
            </p>
          </div>
          <button className="copy-email-btn" onClick={copyEmail} title="Copy email address">
            {copied ? <Check size={14} className="copy-check" /> : <Copy size={14} />}
            <span className="font-mono">zaidm1323@gmail.com</span>
            <span className="copy-pill">{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>

        <div className="footer-inner">
          <a href="#home" className="brand">
            <span className="logo">
              {settings.logoImage ? <Img src={settings.logoImage} alt={settings.siteName} width={38} height={38} /> : settings.logoText}
            </span>
            {settings.siteName}
          </a>

          <div className="footer-links">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`}>{text(site, n.key)}</a>
            ))}
            <Link to="/admin">{text(site, 'navAdmin')}</Link>
          </div>

          <div className="footer-socials">
            {socials.map((s) => (
              <a key={s._id} href={s.data.url} target="_blank" rel="noreferrer" className="footer-social-link">
                {s.data.platform}
              </a>
            ))}
          </div>
        </div>

        <div className="footer-bottom font-mono">
          <span>© {new Date().getFullYear()} Mohd Zaid. All rights reserved.</span>
          <span className="footer-location">Delhi, India (UTC+5:30)</span>
        </div>
      </div>
    </footer>
  )
}
