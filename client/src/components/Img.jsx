/* eslint-disable react-refresh/only-export-components -- `cld` is a pure URL helper that ships with this component */

// Image delivery for CMS-supplied URLs.
//
// The CMS stores whatever the admin pasted. In practice that is one of:
//   1. a RAW Cloudinary delivery URL with no transformation segment, e.g.
//      https://res.cloudinary.com/uvxhwkuo/image/upload/v1783331196/portfolio-cms/notegenie.png
//      Cloudinary then serves the untouched original — a full-size PNG, ~1MB.
//   2. a local path we ship ourselves, e.g. /images/profile.jpg
//   3. an arbitrary https URL on some other host.
//
// `cld()` fixes (1) purely at render time by injecting a transformation right
// after `/upload/`, so the CDN does the resizing and format negotiation. Nothing
// in the database is rewritten, and (2)/(3) are passed through untouched.

const TRANSFORM = 'f_auto,q_auto,dpr_auto,c_limit'
const DEFAULT_WIDTH = 1280
const WIDTH_LADDER = [480, 800, 1280]

// https://res.cloudinary.com/<cloud>/image/upload/<rest>
const CLOUDINARY_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i

// Local raster we ship in client/public/images — a .webp sibling exists for each.
const LOCAL_RASTER_RE = /^(\/images\/[^?#]+)\.(?:png|jpe?g)$/i

// A Cloudinary transformation segment is a comma-joined list of short `key_value`
// tokens (`f_auto,q_auto,w_800`, or a lone `w_800`). The two things that are NOT
// transformations — and so mark a URL we still need to rewrite — are a version
// (`v1783331196`) and a plain folder name (`portfolio-cms`). Matching against the
// known key list rather than a loose `\w+_` keeps a folder like `my_photos` from
// being mistaken for a transformation.
const TRANSFORM_TOKEN_RE =
  /^(a|ar|b|bo|c|co|cs|d|dl|dn|dpr|du|e|eo|f|fl|fn|g|h|if|ki|l|o|p|pg|q|r|so|t|u|vc|w|x|y|z)_[^,/]+$/i

const hasTransformSegment = (segment) =>
  Boolean(segment) && segment.split(',').every((token) => TRANSFORM_TOKEN_RE.test(token))

/**
 * Inject `f_auto,q_auto,dpr_auto,c_limit,w_<width>` into a raw Cloudinary
 * delivery URL. Returns anything else — non-Cloudinary hosts, URLs that already
 * carry a transformation, empty/malformed values — exactly as given. Never throws.
 */
export function cld(url, opts = {}) {
  if (!url || typeof url !== 'string') return url
  try {
    const match = CLOUDINARY_RE.exec(url.trim())
    if (!match) return url
    const [, base, rest] = match
    // `rest` is either `v123/folder/file.png` or `folder/file.png` or
    // `f_auto,q_auto/…` — only the last of those already has a transformation.
    if (hasTransformSegment(rest.split('/')[0])) return url
    const requested = Number(opts.width)
    const width = Number.isFinite(requested) && requested > 0 ? Math.round(requested) : DEFAULT_WIDTH
    return `${base}${TRANSFORM},w_${width}/${rest}`
  } catch {
    return url
  }
}

// Candidate widths for the srcSet, capped at 2x the intrinsic width so a 46px
// avatar never pulls a 1280px file. Images smaller than the whole ladder (avatars,
// logos) fall back to a plain 1x/2x pair. Always yields at least one candidate.
function ladderFor(width) {
  const w = Number(width)
  if (!Number.isFinite(w) || w <= 0) return WIDTH_LADDER
  const fits = WIDTH_LADDER.filter((candidate) => candidate <= w * 2)
  return fits.length ? fits : [Math.round(w), Math.round(w * 2)]
}

/**
 * Drop-in replacement for `<img>`.
 *
 * - Cloudinary sources get a transformed `src` plus a responsive `srcSet`.
 * - Local `/images/*.png|jpg` sources get a `<picture>` with a `.webp` sibling first.
 * - Everything is lazy + async-decoded unless `priority` is set (hero photo only).
 * - `width`/`height` are always forwarded so the browser can reserve space (no CLS).
 */
export default function Img({ src, alt = '', width, height, priority = false, className, sizes, ...rest }) {
  if (!src || typeof src !== 'string') return null

  const attrs = {
    className,
    alt,
    width,
    height,
    loading: priority ? 'eager' : 'lazy',
    decoding: 'async',
    // Lowercase on purpose: React 18 does not recognise the camelCase
    // `fetchPriority` prop and logs "React does not recognize the fetchPriority
    // prop..." on every render. `fetchpriority` is the real HTML attribute name,
    // so it passes through untouched on React 18 and 19 alike.
    fetchpriority: priority ? 'high' : 'auto',
    ...rest,
  }

  const local = LOCAL_RASTER_RE.exec(src.trim())
  if (local) {
    // `display: contents` keeps the <picture> out of the box tree entirely, so
    // the <img> stays the real flex/grid item for rules like
    // `.timeline-item h4 { display: flex }` + `.tl-logo { flex: none }`.
    return (
      <picture style={{ display: 'contents' }}>
        <source type="image/webp" srcSet={`${local[1]}.webp`} />
        <img src={src} sizes={sizes} {...attrs} />
      </picture>
    )
  }

  const widths = ladderFor(width)
  const optimized = cld(src, { width: widths[widths.length - 1] })
  // Only build a srcSet when cld() actually rewrote the URL — otherwise every
  // candidate would be the same file.
  const responsive = optimized !== src

  return (
    <img
      src={optimized}
      srcSet={responsive ? widths.map((w) => `${cld(src, { width: w })} ${w}w`).join(', ') : undefined}
      sizes={responsive ? sizes || (width ? `${width}px` : '100vw') : sizes}
      {...attrs}
    />
  )
}
