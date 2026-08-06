import net from 'net'
import { env } from '../config/env.js'

/**
 * Find the first free TCP port at or above `preferred`.
 *
 * The app prefers a conventional port (5000 for the API) but must never die just
 * because another local process is already holding it — a common situation when
 * several dev servers run side by side. We probe ports one at a time and return
 * the first one that binds cleanly.
 *
 * PRODUCTION SKIPS THE PROBE ENTIRELY. This is dev ergonomics only, and on a
 * host like Render it is worse than useless: the platform injects PORT, owns the
 * port, and scans for a listener on exactly that number. The probe would cost an
 * extra bind/close on the cold-start path, and if it ever misread the port as
 * busy we would quietly listen on PORT+1 — where the port scan never looks — so
 * the deploy would hang until it timed out and failed.
 *
 * @param {number} preferred  first port to try (e.g. 5000)
 * @param {number} maxTries   how many consecutive ports to try before giving up
 * @returns {Promise<number>} an available port
 */
export async function findAvailablePort(preferred, maxTries = 15) {
  const start = Number(preferred) || 5000
  if (env.nodeEnv === 'production') return start

  for (let port = start; port < start + maxTries; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port
  }
  throw new Error(
    `No free port found in range ${start}-${start + maxTries - 1}. ` +
      'Close whatever is using them, or set a different PORT in .env.'
  )
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => {
        // EADDRINUSE / EACCES → not usable; anything else, treat as unusable too.
        resolve(false)
      })
      .once('listening', () => {
        tester.close(() => resolve(true))
      })
      // Bind exactly the way app.listen(port) does — no host, so the probe and the
      // real server agree on availability (on Windows a host mismatch can disagree).
      .listen(port)
  })
}
