#!/usr/bin/env node
/**
 * check-images — guards against non-image files in public/works/.
 *
 * WHY: a featured work's hero image is self-hosted under public/works/. If a
 * download fails (e.g. Wikimedia returns an error page because no User-Agent was
 * sent), the HTML error body can get saved under a .jpg name. Next serves it as
 * image/jpeg, the browser can't decode it, and the work shows a blank/broken
 * image (#68). This check fails loudly so that never ships silently again.
 *
 * Validates every image in public/works/ by MAGIC BYTES (not extension):
 *   JPEG ff d8 ff · PNG 89 50 4e 47 · WebP RIFF....WEBP · GIF GIF8
 * Also flags suspiciously tiny files and HTML saved as an image.
 *
 * Run: npm run check:images   (exit 1 on any bad file)
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { magicOf, MIN_BYTES } from './lib/image-magic.mjs'

const DIR = 'public/works'
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

const GRN = '\x1b[32m', RED = '\x1b[31m', YLW = '\x1b[33m', RST = '\x1b[0m', DIM = '\x1b[2m'
let files = []
try {
  files = readdirSync(DIR).filter(n => IMG_EXT.has(n.slice(n.lastIndexOf('.')).toLowerCase()))
} catch {
  console.log(`${DIM}check-images: no ${DIR}/ directory — skipping${RST}`)
  process.exit(0)
}

const bad = []
for (const name of files) {
  const buf = readFileSync(join(DIR, name))
  const head = buf.toString('ascii', 0, 64).toLowerCase()
  const magic = magicOf(buf)
  if (head.includes('<!doctype') || head.includes('<html')) {
    bad.push({ name, why: `HTML page saved as an image (${buf.length} bytes) — a failed download` })
  } else if (!magic) {
    bad.push({ name, why: `not a recognized image (no JPEG/PNG/WebP/GIF magic bytes)` })
  } else if (buf.length < MIN_BYTES) {
    bad.push({ name, why: `only ${buf.length} bytes — too small to be a real artwork ${magic}` })
  }
}

console.log(`\n${DIM}Image check — ${files.length} file(s) in ${DIR}/${RST}\n`)
if (!bad.length) {
  console.log(`${GRN}✓ All ${files.length} files are valid images.${RST}\n`)
  process.exit(0)
}
console.log(`${RED}✗ ${bad.length} bad file(s):${RST}\n`)
for (const b of bad) {
  console.log(`  ${YLW}${DIR}/${b.name}${RST}`)
  console.log(`  ${RED}→ ${b.why}${RST}`)
}
console.log(`\n${DIM}Fix: re-download the real public-domain image (Wikimedia Commons), confirming it's a${RST}`)
console.log(`${DIM}JPEG with \`file public/works/<name>\`, then replace the bad file.${RST}\n`)
process.exit(1)
