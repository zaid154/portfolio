import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Portfolio repo root (parent of client/) — where the backend writes .dev-server.json.
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// The backend prefers port 5000 but falls back if it's busy, writing its real port
// to .dev-server.json. Read it fresh on every request so the dev proxy always points
// at the running API — no restart needed, and no startup race (defaults to 5000 until
// the file appears).
function backendPort() {
  try {
    const { port } = JSON.parse(fs.readFileSync(path.join(rootDir, '.dev-server.json'), 'utf8'))
    if (port) return Number(port)
  } catch {
    /* file not written yet → fall back to the preferred port */
  }
  return 5000
}

// Forward /api/* to the backend so the browser only ever talks to the Vite origin.
// This eliminates dev CORS entirely and makes the client immune to backend port drift.
function devApiProxy() {
  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        const port = backendPort()
        const proxyReq = http.request(
          {
            host: '127.0.0.1',
            port,
            method: req.method,
            path: req.originalUrl || req.url,
            headers: req.headers,
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
            proxyRes.pipe(res)
          }
        )
        proxyReq.on('error', (err) => {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              success: false,
              message: `Dev proxy: cannot reach the API on port ${port}. Is the backend running? (${err.code || err.message})`,
            })
          )
        })
        req.pipe(proxyReq)
      })
    },
  }
}

// Print a clear, unambiguous frontend URL once Vite has bound its (possibly
// fallen-back) port — so there's never confusion about where the client is.
function frontendBanner() {
  return {
    name: 'frontend-banner',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer.address()
        const port = typeof addr === 'object' && addr ? addr.port : addr
        const line = '=============================='
        // eslint-disable-next-line no-console
        console.log('\n' + [line, 'Frontend Running', line, `http://localhost:${port}`, line].join('\n') + '\n')
      })
    },
  }
}

export default defineConfig({
  envDir: '../',
  plugins: [react(), devApiProxy(), frontendBanner()],
  // Prefer 5173; if it's busy Vite automatically uses the next free port (5174, …)
  // and the banner above reports the actual URL. No strictPort — we want graceful
  // fallback, not a hard failure.
  server: {
    port: 5173,
    strictPort: false,
    host: true,
  },
  build: {
    // Every browser this site supports has native ESM + optional chaining, so there
    // is no reason to ship downlevelled output or the modulepreload polyfill.
    target: 'es2020',
    modulePreload: { polyfill: false },
    // Below-the-fold sections are React.lazy()'d, so their CSS should travel with
    // them instead of bloating the render-blocking stylesheet.
    cssCodeSplit: true,
    // No sourcemaps in prod (they double the deploy payload and leak source).
    sourcemap: false,
    // Skip the gzip-size pass — it is pure build-time cost, the CDN gzips anyway.
    reportCompressedSize: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Shared vendors stay pinned to their own long-cached chunks. This matters
        // MORE now that sections are lazy: without it, framer-motion / lucide would
        // be duplicated into (or arbitrarily hoisted between) the section chunks.
        // `react` is the only genuinely render-blocking one; `motion` and `icons`
        // are shared by the eager shell and the lazy sections alike, so keeping
        // them separate means the section chunks stay tiny and cache independently
        // of app code changes.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
