/**
 * Image magic-byte validation — shared by check-images.mjs (the CI guard) and
 * promote-work.mjs (validates a hero image before copying it into
 * public/works/). One fact, one home: the byte signatures live only here.
 */

export const MIN_BYTES = 4 * 1024 // a real artwork JPEG is tens-to-hundreds of KB

export function magicOf(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'JPEG'
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'PNG'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'WebP'
  if (buf.length >= 4 && buf.toString('ascii', 0, 4) === 'GIF8') return 'GIF'
  return null
}

/** Full validation used at promotion time: returns { ok, why } — never throws. */
export function validateImageBuffer(buf) {
  const head = buf.toString('ascii', 0, 64).toLowerCase()
  if (head.includes('<!doctype') || head.includes('<html')) {
    return { ok: false, why: `HTML page saved as an image (${buf.length} bytes) — a failed download` }
  }
  const magic = magicOf(buf)
  if (!magic) return { ok: false, why: 'not a recognized image (no JPEG/PNG/WebP/GIF magic bytes)' }
  if (buf.length < MIN_BYTES) return { ok: false, why: `only ${buf.length} bytes — too small to be a real artwork ${magic}` }
  return { ok: true, why: `${magic}, ${buf.length} bytes` }
}
