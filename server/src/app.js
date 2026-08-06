import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { env } from './config/env.js'
import { hasEverConnected } from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import contentRoutes from './routes/content.routes.js'
import messageRoutes from './routes/message.routes.js'
import publicRoutes from './routes/public.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import { errorHandler, notFound } from './middleware/error.js'
import { sanitize } from './middleware/sanitize.js'

const app = express()

// CORS allow-list. Requests with no Origin (curl, health checks, same-origin) always
// pass. In development any localhost/127.0.0.1 origin is allowed, so the client can
// run on 5173, 5174, … without CORS breaking. In production we allow the origins in
// CLIENT_URL (comma-separated) plus any *.vercel.app host, covering the production
// Vercel domain and its preview deployments.
const clientAllowList = env.clientUrl
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean)

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true)

  let host = ''
  try {
    host = new URL(origin).hostname
  } catch {
    return callback(new Error(`Invalid Origin: ${origin}`))
  }

  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1'
  if (env.nodeEnv !== 'production' && isLocalhost) return callback(null, true)

  const normalized = origin.replace(/\/$/, '')
  const allowed = clientAllowList.includes(normalized) || /\.vercel\.app$/i.test(host)
  if (allowed) return callback(null, true)

  return callback(new Error(`Origin not allowed by CORS: ${origin}`))
}

// Behind a reverse proxy in production (e.g. Render) the socket IP is the proxy, not
// the visitor. Trust the first hop so req.ip is the real client IP — otherwise every
// request shares one key and the rate limiters throttle all users together (and a
// handful of failed logins would lock everyone out). Use 1, not `true`, which
// express-rate-limit rejects as too permissive.
if (env.nodeEnv === 'production') app.set('trust proxy', 1)

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // The CMS renders uploaded images from Cloudinary, and admins can paste any
        // https image URL. Helmet's default `img-src 'self' data:` would block them
        // all in the single-service production deploy, breaking the core feature.
        'img-src': ["'self'", 'data:', 'https:'],
      },
    },
  })
)
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
)
// Compress everything, so it sits above the routers AND the static client build
// (the site payload and the JS bundles are where gzip actually pays off).
app.use(compression())
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

// Tighter limits on the two abuse-prone endpoints (brute-force / spam).
const strict = (limit, windowMs, message) =>
  rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { success: false, message } })
app.use('/api/auth/login', strict(15, 15 * 60 * 1000, 'Too many login attempts. Please try again later.'))
app.use('/api/public/contact', strict(8, 60 * 60 * 1000, 'Too many messages sent. Please try again later.'))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(sanitize)
app.use(cookieParser())
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

// Liveness probe, and the endpoint an EXTERNAL keep-warm cron (UptimeRobot,
// cron-job.org, Render cron) should ping to keep the free-plan instance from
// cold-starting. Deliberately no in-process self-ping timer: a process pinging
// itself keeps nothing awake once the host has already suspended it, and it
// burns the one shared CPU we are trying to protect.
//
// It answers 503 until the database has been reached ONCE. Without that, a
// container that can never talk to Atlas (bad MONGO_URI, lapsed IP allowlist)
// would still pass render.yaml's healthCheckPath — because binding now happens
// before the connect — and Render would promote the broken deploy over a working
// one. A healthy deploy flips to 200 within a second or two; see
// hasEverConnected() in config/db.js for why it latches instead of tracking the
// live connection state.
app.get('/api/health', (_req, res) => {
  const dbReady = hasEverConnected()
  res.status(dbReady ? 200 : 503).json({
    success: dbReady,
    service: 'portfolio-cms-api',
    db: dbReady ? 'connected' : 'connecting',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin/content', contentRoutes)
app.use('/api/admin/messages', messageRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/public', publicRoutes)

// Serve the built React frontend if it exists (so `npm run build` + `npm start`
// serves the whole app — site + API — from this one server on port 5000).
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(__dirname, '../../client/dist')
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  const ONE_YEAR = '365d'
  app.use(
    express.static(clientDist, {
      // Vite writes content-hashed filenames into /assets, so those bytes can
      // never change under a given URL — cache them forever and skip even the
      // revalidation request.
      maxAge: ONE_YEAR,
      immutable: true,
      setHeaders(res, filePath) {
        const rel = path.relative(clientDist, filePath).replace(/\\/g, '/')
        const hashed = rel.startsWith('assets/')
        // Set it explicitly in BOTH branches so we never depend on whether
        // serve-static's own maxAge header lands before or after this hook.
        // index.html (and anything else unhashed) must revalidate, otherwise a
        // deploy leaves visitors pinned to a stale bundle reference.
        res.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache')
      },
    })
  )
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    res.set('Cache-Control', 'no-cache')
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

export default app
