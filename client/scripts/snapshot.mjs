#!/usr/bin/env node
/**
 * Build-time snapshot of the public CMS payload.
 *
 * The API runs on a free Render instance that sleeps after ~15 minutes idle, so
 * the first request after a quiet period can take 30-60s to answer. This script
 * bakes the current `/public/site` response into `client/public/site-snapshot.json`
 * at build time, so the Vercel CDN can hand a brand-new visitor the full content
 * instantly while the live API is still waking up. `useSite()` swaps in the live
 * response the moment it lands.
 *
 * This script MUST NEVER fail the build. Every failure path (no env var, API
 * asleep, non-200, bad payload, unwritable disk) logs a warning and exits 0
 * without writing anything — a missing snapshot just means the old behaviour.
 *
 * Wired as `prebuild` in package.json, so plain `npm run build` picks it up.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CLIENT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = resolve(CLIENT_DIR, '..')
const OUT_FILE = join(CLIENT_DIR, 'public', 'site-snapshot.json')

// Cold starts are slow; give the instance a fair chance but never hold the build
// hostage. 20s is long enough for a warm/waking API, short enough to be invisible.
const TIMEOUT_MS = 20000

// vite.config.js sets `envDir: '../'`, so VITE_* vars live in the REPO ROOT .env,
// not client/.env. On Vercel they arrive as real environment variables instead —
// process.env always wins, these files are the local-build fallback.
const ENV_FILES = [
  join(REPO_ROOT, '.env.production.local'),
  join(REPO_ROOT, '.env.production'),
  join(REPO_ROOT, '.env.local'),
  join(REPO_ROOT, '.env'),
  join(CLIENT_DIR, '.env.local'),
  join(CLIENT_DIR, '.env'),
]

const warn = (message) => console.warn(`[snapshot] ${message}`)
const info = (message) => console.log(`[snapshot] ${message}`)

/** Read VITE_API_URL from the environment, falling back to a minimal .env parse. */
function readApiUrl() {
  if (process.env.VITE_API_URL && process.env.VITE_API_URL.trim()) {
    return process.env.VITE_API_URL.trim()
  }
  for (const file of ENV_FILES) {
    try {
      if (!existsSync(file)) continue
      for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
        const match = /^\s*(?:export\s+)?VITE_API_URL\s*=\s*(.*)$/.exec(line)
        if (!match) continue
        const raw = match[1].trim()
        const quoted = /^(['"])([\s\S]*)\1\s*$/.exec(raw)
        // Strip a trailing `# comment` only on unquoted values.
        const value = quoted ? quoted[2] : raw.replace(/\s+#.*$/, '').trim()
        if (value) return value
      }
    } catch {
      // Unreadable env file — try the next candidate.
    }
  }
  return ''
}

/**
 * VITE_API_URL points at the API root (e.g. https://x.onrender.com/api).
 * A relative value ('/api', the dev default) can't be fetched from Node.
 */
function snapshotUrl(base) {
  const trimmed = base.replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(trimmed)) return null
  return `${trimmed}/public/site`
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

async function main() {
  if (typeof fetch !== 'function') {
    warn('global fetch is unavailable (needs Node 18+) — skipping snapshot.')
    return
  }

  const apiUrl = readApiUrl()
  if (!apiUrl) {
    warn('VITE_API_URL is not set — skipping snapshot. The site will load from the live API only.')
    return
  }

  const url = snapshotUrl(apiUrl)
  if (!url) {
    warn(`VITE_API_URL ("${apiUrl}") is not an absolute http(s) URL — skipping snapshot.`)
    return
  }

  info(`fetching ${url} (timeout ${TIMEOUT_MS / 1000}s)…`)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let body
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } })
    if (!res.ok) {
      warn(`API responded ${res.status} ${res.statusText} — skipping snapshot.`)
      return
    }
    body = await res.json()
  } catch (error) {
    const reason =
      error && error.name === 'AbortError'
        ? `no response within ${TIMEOUT_MS / 1000}s (the free instance is probably cold)`
        : (error && error.message) || String(error)
    warn(`could not reach the API: ${reason} — skipping snapshot.`)
    return
  } finally {
    clearTimeout(timer)
  }

  if (!isPlainObject(body) || !isPlainObject(body.site)) {
    warn('API payload had no `site` object — skipping snapshot.')
    return
  }

  // Store the exact response envelope the client already knows how to read.
  const json = JSON.stringify({ success: true, site: body.site })
  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, json)
  info(
    `wrote public/site-snapshot.json — ${(json.length / 1024).toFixed(1)} kB, ` +
      `${Object.keys(body.site).length} content type(s).`
  )
}

main().catch((error) => {
  warn(`unexpected error: ${(error && error.message) || error} — continuing without a snapshot.`)
})

// Belt and braces: whatever happened above, the build carries on.
process.exitCode = 0
