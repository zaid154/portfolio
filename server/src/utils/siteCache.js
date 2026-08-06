import crypto from 'crypto'

/**
 * In-process cache for the public site payload.
 *
 * `GET /api/public/site` is the one request the whole public page blocks on, and
 * it fans out one query per content type. On Render's free plan (cold starts,
 * one shared CPU) that fan-out is the slowest thing the visitor waits for, so we
 * build it at most once every TTL and hand every other request the already
 * serialized bytes.
 *
 * Three things this gives the controller:
 *  - `json`  — the response body, serialized ONCE per rebuild (no per-request
 *              JSON.stringify of the entire site).
 *  - `etag`  — a strong ETag (sha1 of exactly those bytes), so repeat visitors
 *              get a ~0-byte 304 instead of the payload.
 *  - single-flight — concurrent requests arriving during a cold rebuild all
 *              await the SAME builder promise, so a cold start costs one DB
 *              round-trip, not one per waiting request.
 *
 * The cache is per-process and deliberately not Redis: this API runs as a single
 * small instance, and admin writes call `invalidateSite()` in-process.
 */

// How long a built payload is served before it is rebuilt from MongoDB.
export const SITE_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// { site, json, etag, builtAt } — the last successfully built payload.
let cached = null

// The in-flight rebuild, shared by every request that arrives while it runs.
let inFlight = null

// Bumped by invalidateSite(). A rebuild that started before an invalidation is
// stale by the time it resolves, so it must not be stored — otherwise an admin
// edit made mid-rebuild would sit behind old data for a full TTL.
let generation = 0

function buildEntry(site) {
  // Serialize the exact response shape the frontend depends on: { success, site }.
  const json = JSON.stringify({ success: true, site })
  const etag = `"${crypto.createHash('sha1').update(json).digest('hex')}"`
  return { site, json, etag, builtAt: Date.now() }
}

/**
 * Return the cached site entry, building it with `builder()` when the cache is
 * empty or expired. `builder` must resolve to the plain `site` object.
 *
 * @param {() => Promise<object>} builder
 * @returns {Promise<{ site: object, json: string, etag: string, builtAt: number }>}
 */
export async function getCachedSite(builder) {
  if (cached && Date.now() - cached.builtAt < SITE_CACHE_TTL_MS) return cached

  // Single-flight: a rebuild is already running — wait for it instead of firing
  // another fan-out at the database.
  if (inFlight) return inFlight

  const startedAt = generation
  inFlight = (async () => {
    const site = await builder()
    const entry = buildEntry(site)
    // Only publish if nothing invalidated the cache while we were querying.
    if (generation === startedAt) cached = entry
    return entry
  })().finally(() => {
    inFlight = null
  })

  return inFlight
}

/**
 * Drop the cached payload so the next request rebuilds from MongoDB. Called
 * after every successful content mutation so admin edits are visible on the
 * public site immediately, not after the TTL.
 */
export function invalidateSite() {
  cached = null
  generation += 1
}
