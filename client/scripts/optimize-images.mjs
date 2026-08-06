#!/usr/bin/env node
/**
 * optimize-images.mjs — shrink the portfolio's raster assets in place.
 *
 * For every .png/.jpg/.jpeg in client/public/images/ it:
 *   1. downscales to a max width (never upscales),
 *   2. re-encodes IN PLACE at the same filename+extension,
 *   3. writes a sibling .webp for <picture>/srcset use.
 *
 * Filenames never change, nothing is deleted, and a re-encode is only kept
 * when it is meaningfully smaller than what is already on disk — so running
 * this repeatedly is a no-op instead of a slow quality slide.
 *
 * sharp is not a dependency of the portfolio; it is resolved from the parent
 * repo's node_modules by normal upward ESM lookup from this file's location.
 *
 *   node client/scripts/optimize-images.mjs          # optimize
 *   node client/scripts/optimize-images.mjs --dry    # report only
 *   node client/scripts/optimize-images.mjs --force  # re-encode even if done
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch (err) {
  console.error(
    "Could not load sharp. It is not installed in this project — it is " +
      "resolved from the parent repo's node_modules by walking up from " +
      "client/scripts/. Move the project back under a tree that has sharp, " +
      "or run `npm i -D sharp`.\n" +
      err.message,
  );
  process.exit(1);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(HERE, "..", "public", "images");
const DRY_RUN = process.argv.includes("--dry");
const FORCE = process.argv.includes("--force");

/** Files that must never be rewritten, whatever their size. */
const LEAVE_ALONE = new Set(["favicon.png"]);

/** Max width by asset. Portrait profile shot doesn't need screenshot width. */
const WIDTH_PROFILE = 640;
const WIDTH_SCREENSHOT = 1280;

/**
 * Keep a re-encode only if it actually buys something. Without this the
 * script would recompress already-optimized files on every run, shaving a
 * few bytes and a little quality each time.
 */
const MIN_SAVING_RATIO = 0.03; // 3%
const MIN_SAVING_BYTES = 1024; // 1 KB

/**
 * Has this file already been through the script?
 *
 * The savings threshold above is not enough on its own for PNGs: palette
 * quantization is not a fixed point, so re-quantizing an already-quantized
 * screenshot still finds a smaller palette (5-20% on the second pass) and
 * would keep re-dithering the image run after run. A paletted PNG that is
 * already within the width budget is therefore treated as done — truecolor
 * source screenshots are RGB/RGBA, only our output is indexed.
 *
 * JPEG needs no such marker: re-encoding at the same quality converges below
 * the savings threshold on the second pass.
 */
const isAlreadyOptimized = (meta, ext, maxWidth) =>
  meta.width <= maxWidth && ext === ".png" && meta.isPalette === true;

const maxWidthFor = (name) =>
  /^profile\./i.test(name) ? WIDTH_PROFILE : WIDTH_SCREENSHOT;

const isRaster = (name) => /\.(png|jpe?g)$/i.test(name);

const kb = (bytes) => `${(bytes / 1024).toFixed(1)}K`;

const pct = (before, after) =>
  before === 0 ? "0%" : `${(((before - after) / before) * 100).toFixed(0)}%`;

/** Re-encode a buffer at the target width, in the source's own format. */
async function encodeSameFormat(buffer, ext, maxWidth) {
  const pipeline = sharp(buffer).resize({
    width: maxWidth,
    withoutEnlargement: true, // never upscale
    fit: "inside",
  });

  return ext === ".png"
    ? pipeline
        .png({ quality: 80, compressionLevel: 9, palette: true, effort: 8 })
        .toBuffer()
    : pipeline.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
}

async function encodeWebp(buffer, maxWidth) {
  return sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 74, effort: 6 })
    .toBuffer();
}

async function sizeOf(file) {
  try {
    return (await stat(file)).size;
  } catch {
    return 0;
  }
}

async function main() {
  const entries = (await readdir(IMAGES_DIR))
    .filter((name) => isRaster(name) && !LEAVE_ALONE.has(name))
    .sort();

  if (entries.length === 0) {
    console.log(`No raster images found in ${IMAGES_DIR}`);
    return;
  }

  console.log(`Optimizing ${entries.length} image(s) in ${IMAGES_DIR}`);
  if (DRY_RUN) console.log("(dry run — nothing will be written)\n");

  const rows = [];
  let totalBefore = 0;
  let totalAfter = 0;
  let totalWebp = 0;

  for (const name of entries) {
    const src = path.join(IMAGES_DIR, name);
    const ext = path.extname(name).toLowerCase();
    const maxWidth = maxWidthFor(name);

    const input = await readFile(src);
    const before = input.length;
    totalBefore += before;

    const meta = await sharp(input).metadata();
    const dims = `${meta.width}x${meta.height}`;

    // --- in-place re-encode -------------------------------------------------
    // `current` is what ends up on disk: the re-encode if it's worth keeping,
    // otherwise the untouched original.
    let current = input;
    let note = "";
    if (!FORCE && isAlreadyOptimized(meta, ext, maxWidth)) {
      note = "skipped (already optimized)";
    } else {
      try {
        const out = await encodeSameFormat(input, ext, maxWidth);
        const saved = before - out.length;
        const worthIt =
          saved >= MIN_SAVING_BYTES && saved / before >= MIN_SAVING_RATIO;

        if (worthIt) {
          if (!DRY_RUN) await writeFile(src, out);
          current = out;
        } else {
          // Output is bigger, or close enough that rewriting is pointless.
          note =
            out.length >= before
              ? "kept (re-encode larger)"
              : "kept (already optimal)";
        }
      } catch (err) {
        note = `FAILED: ${err.message}`;
      }
    }
    const after = current.length;
    totalAfter += after;

    // --- sibling .webp ------------------------------------------------------
    // Always derived from the current source, so re-runs are byte-identical.
    // The webp is written even on the rare occasion it comes out bigger than
    // the original: markup referencing it unconditionally would otherwise 404,
    // and the browser picks the source it is offered, not the smaller file.
    const webpPath = path.join(IMAGES_DIR, `${path.basename(name, ext)}.webp`);
    let webpSize = 0;
    try {
      const webp = await encodeWebp(current, maxWidth);
      if (!DRY_RUN) await writeFile(webpPath, webp);
      webpSize = webp.length;
      if (webpSize >= after) {
        note = note ? `${note}; webp bigger than source` : "webp bigger than source";
      }
    } catch (err) {
      note = note || `webp FAILED: ${err.message}`;
    }
    totalWebp += webpSize;

    const outMeta = await sharp(current).metadata();
    const outDims = `${outMeta.width}x${outMeta.height}`;
    rows.push({
      name,
      dims: dims === outDims ? dims : `${dims} → ${outDims}`,
      before,
      after,
      webp: webpSize,
      note,
    });
  }

  // --- table ----------------------------------------------------------------
  const headers = ["file", "dimensions", "before", "after", "saved", ".webp", ""];
  const table = rows.map((r) => [
    r.name,
    r.dims,
    kb(r.before),
    kb(r.after),
    r.after < r.before ? pct(r.before, r.after) : "-",
    r.webp ? kb(r.webp) : "-",
    r.note,
  ]);
  table.push([
    "TOTAL",
    "",
    kb(totalBefore),
    kb(totalAfter),
    pct(totalBefore, totalAfter),
    kb(totalWebp),
    "",
  ]);

  const widths = headers.map((h, i) =>
    Math.max(h.length, ...table.map((row) => row[i].length)),
  );
  const line = (cells) =>
    cells.map((c, i) => c.padEnd(widths[i])).join("  ").trimEnd();

  console.log();
  console.log(line(headers));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of table.slice(0, -1)) console.log(line(row));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  console.log(line(table.at(-1)));

  const saved = totalBefore - totalAfter;
  console.log();
  console.log(
    `Saved ${kb(saved)} (${pct(totalBefore, totalAfter)}) in place. ` +
      `webp siblings add ${kb(totalWebp)}, ` +
      `${pct(totalAfter, totalWebp)} smaller than the originals they replace.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
