import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  LayoutDashboard, LogOut, Mail, Menu, Plus, Search, Trash2, X,
  FileStack, Info, Sun, Moon, ChevronUp, ChevronDown, Eye, EyeOff, UserCog,
} from 'lucide-react'
import { api, getErrorMessage } from '../../lib/api'
import { contentTypes } from '../../lib/contentTypes'
import { TOKEN_KEY, TYPE_ICONS, rowThumb } from './constants'
import Overview from './Overview'
import Editor from './Editor'
import MessageManager from './MessageManager'
import ConfirmDialog from './ConfirmDialog'
import Account from './Account'

export default function Dashboard({ theme, toggleTheme }) {
  const [items, setItems] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('overview')
  const [activeType, setActiveType] = useState('hero')
  const [editing, setEditing] = useState(null)
  const [sideOpen, setSideOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [confirm, setConfirm] = useState({ open: false })
  const dirtyRef = useRef(false)
  const navigate = useNavigate()

  const askConfirm = useCallback((cfg) => setConfirm({ open: true, ...cfg }), [])
  const setDirty = useCallback((d) => { dirtyRef.current = d }, [])
  const guard = useCallback((action) => {
    if (dirtyRef.current) {
      askConfirm({ title: 'Discard changes?', message: 'You have unsaved edits. Discard them?', confirmLabel: 'Discard', onConfirm: () => { dirtyRef.current = false; action() } })
    } else action()
  }, [askConfirm])

  async function load() {
    try {
      const [c, m] = await Promise.all([api.get('/admin/content'), api.get('/admin/messages')])
      setItems(c.data.items || [])
      setMessages(m.data.items || [])
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // Esc closes the mobile sidebar
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSideOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const active = contentTypes.find((t) => t.key === activeType)
  const typed = items
    .filter((i) => i.type === activeType)
    .sort((a, b) => {
      const aPub = a.status === 'published' ? 0 : 1
      const bPub = b.status === 'published' ? 0 : 1
      if (aPub !== bPub) return aPub - bPub
      return (a.order ?? 0) - (b.order ?? 0)
    })
  const visible = query
    ? typed.filter((i) => `${i.title} ${JSON.stringify(i.data || {})}`.toLowerCase().includes(query.toLowerCase()))
    : typed
  const singletonFull = active?.singleton && typed.length >= 1
  const stats = useMemo(() => ({
    sections: new Set(items.map((i) => i.type)).size,
    entries: items.length,
    unread: messages.filter((m) => m.status === 'new').length,
  }), [items, messages])

  function logout() {
    guard(() => { localStorage.removeItem(TOKEN_KEY); navigate('/admin') })
  }
  function goView(v) {
    guard(() => { setView(v); setEditing(null); setQuery(''); setSideOpen(false); dirtyRef.current = false })
  }
  function selectType(key) {
    guard(() => { setActiveType(key); setView('content'); setEditing(null); setQuery(''); setSideOpen(false); dirtyRef.current = false })
  }
  function selectEntry(item) { guard(() => setEditing(item)) }
  function newEntry() {
    guard(() => setEditing({ type: activeType, title: '', status: 'published', order: typed.length, featured: false, data: {} }))
  }

  async function move(entry, dir) {
    const list = [...typed]
    const idx = list.findIndex((x) => x._id === entry._id)
    const j = idx + dir
    if (j < 0 || j >= list.length) return
    ;[list[idx], list[j]] = [list[j], list[idx]]
    try {
      await Promise.all(list.map((x, i) => (x.order === i ? null : api.put(`/admin/content/${x._id}`, { order: i }))).filter(Boolean))
      load()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }
  async function toggleStatus(entry) {
    try {
      const nextStatus = entry.status === 'published' ? 'draft' : 'published'
      await api.put(`/admin/content/${entry._id}`, { status: nextStatus })
      toast.success(nextStatus === 'published' ? 'Published' : 'Hidden (moved to bottom)')
      load()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  return (
    <div className="admin">
      {sideOpen && <div className="side-overlay" onClick={() => setSideOpen(false)} />}
      <aside className={sideOpen ? 'admin-side open' : 'admin-side'}>
        <div className="brand"><span className="logo"><img src="/favicon.png" alt="MZ" /></span>Portfolio CMS</div>
        <button className="icon-btn side-close" onClick={() => setSideOpen(false)} aria-label="Close menu"><X size={18} /></button>
        <nav className="admin-nav">
          <button className={view === 'overview' ? 'active' : ''} onClick={() => goView('overview')}>
            <LayoutDashboard size={17} /> <span className="nav-lbl">Overview</span>
          </button>
          <button className={view === 'content' ? 'active' : ''} onClick={() => goView('content')}>
            <FileStack size={17} /> <span className="nav-lbl">Content</span>
          </button>
          {view === 'content' && (
            <div className="nav-sub">
              {contentTypes.map((t) => {
                const Icon = TYPE_ICONS[t.key] || FileStack
                const count = items.filter((i) => i.type === t.key).length
                return (
                  <button key={t.key} className={activeType === t.key ? 'active' : ''} title={t.desc} onClick={() => selectType(t.key)}>
                    <Icon size={15} /> <span className="nav-lbl">{t.label}</span>
                    {count > 0 && <span className="nav-count">{count}</span>}
                  </button>
                )
              })}
            </div>
          )}
          <button className={view === 'messages' ? 'active' : ''} onClick={() => goView('messages')}>
            <Mail size={17} /> <span className="nav-lbl">Messages</span>
            {stats.unread > 0 && <span className="nav-count alert">{stats.unread}</span>}
          </button>
          <button className={view === 'account' ? 'active' : ''} onClick={() => goView('account')}>
            <UserCog size={17} /> <span className="nav-lbl">Account</span>
          </button>
        </nav>
        <button className="side-logout" onClick={logout}><LogOut size={16} /> Logout</button>
      </aside>

      <main className="admin-main">
        <div className="admin-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="icon-btn side-close" style={{ position: 'static' }} onClick={() => setSideOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <div><span className="eyebrow">{view === 'overview' ? 'Dashboard' : view === 'messages' ? 'Inbox' : view === 'account' ? 'Account' : 'Content'}</span><h1>{view === 'overview' ? 'Welcome back' : view === 'messages' ? 'Contact messages' : view === 'account' ? 'Account settings' : (active?.label || 'Content')}</h1></div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {toggleTheme && (
              <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            <Link className="btn ghost compact" to="/">View Site</Link>
          </div>
        </div>

        {view === 'overview' && <Overview stats={stats} messages={messages} loading={loading} goView={goView} />}

        {view === 'content' && (
        <div className="workspace">
          <section className="panel glass">
            <div className="panel-head">
              <div className="panel-title-wrap">
                <h2>{active?.label} {active?.singleton && <span className="badge">one per site</span>}</h2>
                <p className="section-desc"><Info size={13} /> {active?.desc}</p>
              </div>
              {!singletonFull && (
                <button className="btn primary compact" onClick={newEntry}><Plus size={15} /> New</button>
              )}
            </div>

            {typed.length > 3 && (
              <div className="search-box list-search"><Search size={15} /><input placeholder={`Search ${active?.label}…`} value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            )}

            <div className="list">
              {visible.map((item, i) => {
                const img = rowThumb(item)
                const isDraft = item.status !== 'published'
                return (
                  <div key={item._id} className={`${editing?._id === item._id ? 'row active' : 'row'} ${isDraft ? 'row-hidden' : ''}`}>
                    <button className="row-main" onClick={() => selectEntry(item)}>
                      {img ? <img className="row-thumb" src={img} alt="" /> : <span className="row-thumb ph"><FileStack size={14} /></span>}
                      <span className="row-text">
                        <span className="row-title">{item.title || '(untitled)'}</span>
                        <small>{isDraft ? 'hidden (draft)' : `order ${item.order}`}</small>
                      </span>
                    </button>
                    <div className="row-tools">
                      <button className={item.status === 'published' ? 'pubtog on' : 'pubtog'} title={item.status === 'published' ? 'Published — click to hide' : 'Hidden — click to publish'} onClick={() => toggleStatus(item)}>
                        {item.status === 'published' ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      {!query && !isDraft && (
                        <span className="reorder">
                          <button disabled={i === 0} onClick={() => move(item, -1)} aria-label="Move up"><ChevronUp size={14} /></button>
                          <button disabled={i === visible.filter(x => x.status === 'published').length - 1} onClick={() => move(item, 1)} aria-label="Move down"><ChevronDown size={14} /></button>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              {!loading && !visible.length && (
                <div className="empty">
                  {query ? <>No matches for “{query}”.</> : <>No entries yet in <b>{active?.label}</b>.<br />Click <b>New</b> to add the first one.</>}
                </div>
              )}
              {loading && <div className="empty">Loading…</div>}
            </div>
          </section>

          <Editor
            item={editing}
            activeType={activeType}
            onSaved={() => { dirtyRef.current = false; setEditing(null); load() }}
            onDeleted={() => { dirtyRef.current = false; setEditing(null); load() }}
            onNew={newEntry}
            onDirty={setDirty}
            askConfirm={askConfirm}
          />
        </div>
        )}

        {view === 'messages' && (
          <MessageManager messages={messages} loading={loading} reload={load} askConfirm={askConfirm} />
        )}

        {view === 'account' && <Account />}
      </main>

      <ConfirmDialog state={confirm} onClose={() => setConfirm({ open: false })} />
    </div>
  )
}
