import Message from '../models/Message.js'
import { ALL_TYPES, modelForType, scopeForType } from '../models/contentModels.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getCachedSite } from '../utils/siteCache.js'

// Pull published items for every type (scoped so shared types read only their
// own docs from the `content` collection) and group them by type, keeping the
// exact `{ site: { hero: [...], project: [...] } }` shape the frontend uses.
//
// `-__v` is the only projection: it is an EXCLUSION, so every field the client
// reads (_id, title, slug, status, order, featured, data, timestamps) keeps
// flowing through — including any field added later. Mongoose's version key is
// the one thing nothing in client/src ever touches.
async function buildSite() {
  const groups = await Promise.all(
    ALL_TYPES.map((type) =>
      modelForType(type)
        .find({ ...scopeForType(type), status: 'published' }, '-__v')
        .sort({ order: 1 })
        .lean()
        .then((items) => [type, items])
    )
  )
  const site = {}
  for (const [type, items] of groups) if (items.length) site[type] = items
  return site
}

// If-None-Match may carry a list, and a proxy may weaken the tag (`W/"..."`).
function etagMatches(header, tag) {
  if (!header) return false
  if (header === '*') return true
  return header
    .split(',')
    .some((candidate) => candidate.trim().replace(/^W\//, '') === tag)
}

export const getSite = asyncHandler(async (req, res) => {
  // Cached in-process with a TTL + single-flight, so a burst of visitors on a
  // cold Render dyno shares ONE database fan-out. See utils/siteCache.js.
  const { json, etag } = await getCachedSite(buildSite)

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  res.set('ETag', etag)

  // Repeat visitor with the same payload: ~0 bytes, no body serialization.
  if (etagMatches(req.headers['if-none-match'], etag)) return res.status(304).end()

  // Send the exact bytes the ETag was computed over. Identical to
  // res.json({ success: true, site }) — same shape and Content-Type, just
  // serialized once per rebuild instead of once per request. (Express only
  // auto-generates an ETag when none is set, so ours survives.)
  res.set('Content-Type', 'application/json; charset=utf-8').send(json)
})

export const contact = asyncHandler(async (req, res) => {
  const { website, ...clean } = req.body
  // Bot filled the hidden honeypot field — pretend success, save nothing.
  if (website) return res.status(201).json({ success: true, message: 'Message sent successfully' })
  const message = await Message.create(clean)
  res.status(201).json({ success: true, message: 'Message sent successfully', id: message._id })
})
