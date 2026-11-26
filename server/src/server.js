import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import app from './app.js'
import { assertEnv, env } from './config/env.js'
import { connectDb } from './config/db.js'
import { findAvailablePort } from './utils/port.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Portfolio repo root (parent of server/) — where the shared .env and the
// dev port-handshake file live.
const rootDir = path.resolve(__dirname, '../../')

// Background reconnect schedule for the INITIAL connect: 1s, 2s, 4s … capped.
const RETRY_MIN_MS = 1000
const RETRY_MAX_MS = 30000

async function bootstrap() {
  assertEnv()

  const preferred = Number(env.port) || 5000
  const port = await findAvailablePort(preferred)

  // Bind the socket FIRST, connect to Mongo after. The Atlas handshake (SRV →
  // TLS → replica-set discovery → auth) is seconds of cold start, and none of it
  // is needed to answer /api/health, the static client build, or anything else
  // that doesn't touch the database — but awaiting it before listen() put all of
  // that behind it, including Render's post-deploy health probe. Routes that DO
  // need the database are covered by Mongoose's built-in command buffering:
  // they wait for the connection instead of erroring.
  app.listen(port, () => {
    if (env.nodeEnv !== 'production') writeDevServerFile(port)
    printBanner({ port, preferred })
    // eslint-disable-next-line no-console
    connectInBackground().catch((error) => console.error(error))
  })
}

/**
 * Connect to Mongo off the critical path, retrying with bounded backoff until it
 * succeeds. We never exit: killing the container on a transient Atlas hiccup
 * made the visitor pay a SECOND cold start (8s server-selection timeout, then a
 * Render restart) for a blip that a 1-second retry would have absorbed.
 *
 * Only the INITIAL connect needs this. Once it lands, the MongoDB driver's own
 * topology monitoring handles later drops — db.js just logs those transitions.
 */
async function connectInBackground() {
  const startedAt = Date.now()

  for (let attempt = 1; ; attempt += 1) {
    try {
      await connectDb()
      const secs = ((Date.now() - startedAt) / 1000).toFixed(1)
      // eslint-disable-next-line no-console
      console.log(`MongoDB:  connected after ${secs}s — database-backed routes are live.\n`)
      return
    } catch (error) {
      // The boxed diagnostics are long and the suggested fixes never change, so
      // print them once and keep every later attempt to a single line.
      if (attempt === 1) {
        logDbFailure(error)
      } else {
        // eslint-disable-next-line no-console
        console.error(`MongoDB: attempt ${attempt} failed — ${error?.message || error}`)
      }

      const delay = Math.min(RETRY_MIN_MS * 2 ** (attempt - 1), RETRY_MAX_MS)
      // eslint-disable-next-line no-console
      console.warn(
        `MongoDB: retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}). ` +
          'The server is still listening — /api/health and static responses are unaffected.'
      )
      // eslint-disable-next-line no-await-in-loop
      await sleep(delay)
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function printBanner({ port, preferred }) {
  const line = '=============================='
  const apiBase = `http://localhost:${port}/api`
  // The socket is up before Mongo is, by design — say so instead of claiming a
  // connection we don't have yet. connectInBackground() logs the outcome next.
  const mongo = 'connecting…  (result logged below)'
  const rows = [
    line,
    'Portfolio API Started',
    line,
  ]
  if (port !== preferred) rows.push(`Port ${preferred} busy → using ${port}`)
  rows.push(
    `Backend:  http://localhost:${port}`,
    `API:      ${apiBase}`,
    `MongoDB:  ${mongo}`,
    `Client:   ${env.clientUrl}  (expected)`,
    `Env:      ${env.nodeEnv}`,
    line
  )
  // eslint-disable-next-line no-console
  console.log('\n' + rows.join('\n') + '\n')
}

// Write the actual API port so the Vite dev proxy can target it even when the
// backend fell back to a different port. Best-effort — never throws.
function writeDevServerFile(port) {
  try {
    const payload = { port, apiBase: `http://localhost:${port}/api` }
    fs.writeFileSync(path.join(rootDir, '.dev-server.json'), JSON.stringify(payload, null, 2))
  } catch {
    /* ignore — the proxy falls back to the default port */
  }
}

function logDbFailure(error) {
  const line = '------------------------------'
  // eslint-disable-next-line no-console
  console.error(
    '\n' +
      [
        line,
        'MongoDB connection FAILED',
        line,
        `Reason: ${error?.message || error}`,
        '',
        'Common fixes:',
        '  • Check MONGO_URI in .env (user, password, cluster host).',
        '  • In MongoDB Atlas → Network Access, allow your current IP (or 0.0.0.0/0 for testing).',
        '  • If SRV lookup fails on this machine, set DNS_SERVERS=8.8.8.8,1.1.1.1 in .env.',
        line,
      ].join('\n') +
      '\n'
  )
}

bootstrap().catch((error) => {
  // Only fatal, non-DB startup errors reach here (e.g. assertEnv threw).
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
