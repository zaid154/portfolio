import slugify from 'slugify'
import {
  modelForType,
  isKnownType,
  scopeForType,
  allModels,
  findAcrossModels,
} from '../models/contentModels.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import { invalidateSite } from '../utils/siteCache.js'

// Generate a slug that doesn't collide within the given scope (whole collection
// for standalone types, or {type} within the shared collection).
async function uniqueSlug(model, base, scope, excludeId) {
  const root = (base && base.trim()) || 'item'
  let slug = root
  let n = 2
  // eslint-disable-next-line no-await-in-loop
  while (await model.exists({ ...scope, slug, _id: { $ne: excludeId || null } })) {
    slug = `${root}-${n++}`
  }
  return slug
}

export const listContent = asyncHandler(async (req, res) => {
  if (req.query.type) {
    if (!isKnownType(req.query.type)) return res.json({ success: true, items: [] })
    const items = await modelForType(req.query.type)
      .find(scopeForType(req.query.type))
      .sort({ order: 1, createdAt: -1 })
    return res.json({ success: true, items })
  }
  // No type filter → the admin dashboard fetches everything at once and groups
  // it client-side, so union every underlying collection into one list.
  const groups = await Promise.all(allModels().map((m) => m.find()))
  const items = groups.flat().sort((a, b) => {
    if (a.type !== b.type) return a.type < b.type ? -1 : 1
    if (a.order !== b.order) return a.order - b.order
    return b.createdAt - a.createdAt
  })
  res.json({ success: true, items })
})

export const createContent = asyncHandler(async (req, res) => {
  const { type } = req.body
  const model = modelForType(type)
  if (!model) throw new ApiError(400, `Unknown content type: ${type}`)
  const base = req.body.slug || slugify(req.body.title, { lower: true, strict: true })
  const slug = await uniqueSlug(model, base, scopeForType(type))
  const item = await model.create({ ...req.body, type, slug })
  // Public payload is cached in-process — drop it so the edit shows up now.
  invalidateSite()
  res.status(201).json({ success: true, item })
})

export const updateContent = asyncHandler(async (req, res) => {
  const found = await findAcrossModels(req.params.id)
  if (!found) throw new ApiError(404, 'Content item not found')
  const { model, doc } = found

  const payload = { ...req.body }
  // Type is fixed by where the doc lives — never move it between types.
  delete payload.type
  if ((payload.title && !payload.slug) || payload.slug) {
    const base = payload.slug || slugify(payload.title, { lower: true, strict: true })
    payload.slug = await uniqueSlug(model, base, scopeForType(doc.type), doc._id)
  }

  const item = await model.findByIdAndUpdate(doc._id, payload, {
    new: true,
    runValidators: true,
  })
  // Covers edits, publish/unpublish and the dashboard's drag-reorder (which
  // saves each moved row through this same PUT with a new `order`).
  invalidateSite()
  res.json({ success: true, item })
})

export const deleteContent = asyncHandler(async (req, res) => {
  const found = await findAcrossModels(req.params.id)
  if (!found) throw new ApiError(404, 'Content item not found')
  await found.model.findByIdAndDelete(found.doc._id)
  invalidateSite()
  res.json({ success: true })
})
