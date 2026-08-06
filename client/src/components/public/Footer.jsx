import { Link } from 'react-router-dom'
import { first, text } from '../../lib/site'
import Img from '../Img'
import { NAV } from './shared'

export default function Footer({ site }) {
  const settings = first(site, 'siteSetting').data
  const socials = site.socialLink || []
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <a href="#home" className="brand"><span className="logo">{settings.logoImage ? <Img src={settings.logoImage} alt={settings.siteName} width={40} height={40} /> : settings.logoText}</span>{settings.siteName}</a>
          <div className="footer-links">
            {NAV.map((n) => <a key={n.id} href={`#${n.id}`}>{text(site, n.key)}</a>)}
            <Link to="/admin">{text(site, 'navAdmin')}</Link>
          </div>
          <div className="footer-links">
            {socials.map((s) => <a key={s._id} href={s.data.url} target="_blank" rel="noreferrer">{s.data.platform}</a>)}
          </div>
        </div>
        <div className="footer-bottom">
          {settings.footerText}
        </div>
      </div>
    </footer>
  )
}
