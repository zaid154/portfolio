import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import Img from '../Img'

// Shared reader popup for both projects and blog posts.
export default function Modal({ item, onClose }) {
  useEffect(() => {
    if (!item) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [item, onClose])
  return (
    <AnimatePresence>
      {item && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="modal"
            style={{ position: 'relative' }}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
            {item.img && <div className="modal-img"><Img src={item.img} alt={item.title} width={1280} height={720} sizes="(max-width: 760px) 100vw, 720px" /></div>}
            <div className="modal-body">
              {item.tags?.length > 0 && (
                <div className="project-tags" style={{ marginBottom: 14 }}>{item.tags.map((t) => <span key={t}>{t}</span>)}</div>
              )}
              <h3>{item.title}</h3>
              {item.body && <p style={{ whiteSpace: 'pre-line' }}>{item.body}</p>}
              {item.actions?.length > 0 && (
                <div className="modal-actions">
                  {item.actions.map((a) => (
                    <a key={a.label} href={a.href} target="_blank" rel="noreferrer" className={a.primary ? 'btn primary' : 'btn ghost'}>
                      {a.icon}{a.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
