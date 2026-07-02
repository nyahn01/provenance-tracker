/**
 * Pre-parse provenance prose for the 8 featured artworks using Claude Haiku.
 * Commit the output — featured works then have zero runtime Claude cost.
 *
 * Run: node scripts/preparse-provenance.mjs
 * Requires: ANTHROPIC_API_KEY in .env.local
 */

import Anthropic from '@anthropic-ai/sdk'
import { writeFile, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { geocodeKey } from './lib/cities.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')

// ─── Load .env.local ──────────────────────────────────────────────────────────
async function loadEnv() {
  try {
    const raw = await readFile(join(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (key && val) process.env[key] = val
    }
  } catch { /* .env.local optional */ }
}

// ─── Geocoder (shared gazetteer — scripts/lib/cities.mjs) ────────────────────
function geocode(place) {
  return geocodeKey(place)
}

/** Loose name match (case/punctuation-insensitive) — mirrors sameName in timeline.ts. */
function sameName(a, b) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const na = norm(a), nb = norm(b)
  if (na.length < 4 || nb.length < 4) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

/**
 * Post-process entries: when a holder matches the artwork's artist and has no
 * startDate, set startDate to the creation year. Never invents a date when the
 * creation year is unknown. Mirrors applyArtistOriginFix in route.ts.
 */
function applyArtistOriginFix(entries, artist, creationYear) {
  return entries.map(e => {
    if (e.startDate != null) return e
    const holder = e.institution ?? e.name
    if (sameName(holder, artist) && creationYear != null) {
      return { ...e, startDate: String(creationYear) }
    }
    return e
  })
}

// ─── Featured works ───────────────────────────────────────────────────────────
const FEATURED = [
  { id: '16568',  title: 'Water Lilies',                  artist: 'Claude Monet',         creationYear: 1906 },
  { id: '27992',  title: 'A Sunday on La Grande Jatte',   artist: 'Georges Seurat',        creationYear: 1884 },
  { id: '18951',  title: 'Yellow Dancers (In the Wings)', artist: 'Edgar Degas',           creationYear: 1874 },
  { id: '20684',  title: 'Paris Street; Rainy Day',       artist: 'Gustave Caillebotte',   creationYear: 1877 },
  { id: '28560',  title: 'The Bedroom',                   artist: 'Vincent van Gogh',      creationYear: 1889 },
  { id: '64818',  title: 'Stacks of Wheat (End of Summer)', artist: 'Claude Monet',        creationYear: 1890 },
  { id: '111442', title: "The Child's Bath",              artist: 'Mary Cassatt',          creationYear: 1893 },
  { id: '111436', title: 'The Basket of Apples',          artist: 'Paul Cézanne',          creationYear: 1893 },
]

// ─── Extraction prompt (identical to route.ts extractOwnershipLocations) ─────
function buildPrompt(title, artist, prose) {
  return `You extract the CHAIN OF CUSTODY (successive owners/holders and where they were) from an artwork's provenance text. This is ownership over time — NOT exhibitions or loans.
ARTWORK: ${title} — ${artist}

PROVENANCE TEXT:
${prose.slice(0, 4000)}

Return ONLY JSON: {"entries":[{"institution": string|null, "place": string, "startYear": string|null, "endYear": string|null}]}
Rules:
- One entry per successive owner/holder, in chronological order.
- "institution" = the full name of the person, dealer, gallery, or museum that held it (e.g. "Galerie Bernheim-Jeune", "Helen Birch Bartlett", "The Art Institute of Chicago"). null if unidentified.
- "place" = the city (e.g. "Paris", "Chicago"). Collapse consecutive owners in the same city into one entry.
- Extract ONLY places/dates/names explicitly in the text. NEVER invent anything.
- Use 4-digit years only; null if none given.
- If no custody/location is documented, return {"entries":[]}.`
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await loadEnv()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY not set in .env.local')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })
  const results = {}

  for (const work of FEATURED) {
    console.log(`\n[${work.id}] ${work.title} — ${work.artist}`)

    // Fetch AIC provenance text
    const aicRes = await fetch(
      `https://api.artic.edu/api/v1/artworks/${work.id}?fields=id,title,provenance_text`,
      { headers: { 'User-Agent': 'provenance-tracker/preparse (+https://github.com/nyahn01/provenance-tracker)' } },
    )
    if (!aicRes.ok) {
      console.warn(`  AIC fetch failed: ${aicRes.status}`)
      results[`aic:${work.id}`] = []
      continue
    }
    const { data } = await aicRes.json()
    const prose = (data?.provenance_text ?? '').trim()

    if (prose.length < 20) {
      console.log('  No provenance prose — skipping')
      results[`aic:${work.id}`] = []
      continue
    }
    console.log(`  Prose: ${prose.length} chars`)

    // Call Claude Haiku
    let raw = ''
    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: buildPrompt(work.title, work.artist, prose) }],
      })
      const block = msg.content[0]
      raw = block.type === 'text' ? block.text : ''
    } catch (err) {
      console.error('  Claude error:', err.message)
      results[`aic:${work.id}`] = []
      continue
    }

    // Parse JSON response
    let parsed
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.warn('  JSON parse failed — raw:', raw.slice(0, 200))
      results[`aic:${work.id}`] = []
      continue
    }

    // Geocode entries
    let entries = (parsed.entries ?? [])
      .filter(e => e && typeof e.place === 'string' && e.place.trim())
      .map(e => {
        const pt = geocode(e.place)
        return {
          name: e.place.trim(),
          institution: e.institution?.trim() || undefined,
          lat: pt?.lat ?? null,
          lng: pt?.lng ?? null,
          startDate: e.startYear?.match(/\d{4}/)?.[0] ?? null,
          endDate: e.endYear?.match(/\d{4}/)?.[0] ?? null,
          source: 'AIC provenance',
        }
      })

    // Apply artist-origin startDate fix: when the first holder is the artwork's own artist
    // and has no startDate, set it to the creation year (honest — never invented).
    entries = applyArtistOriginFix(entries, work.artist, work.creationYear)

    results[`aic:${work.id}`] = entries
    console.log(`  → ${entries.length} entries: ${entries.map(e => e.name).join(', ')}`)
  }

  // Write output
  const outPath = join(ROOT, 'src', 'lib', 'featured-provenance.json')
  await writeFile(outPath, JSON.stringify(results, null, 2) + '\n', 'utf8')
  console.log(`\nWrote ${outPath}`)
  console.log('Commit src/lib/featured-provenance.json to lock in the results.')
}

main().catch(e => { console.error(e); process.exit(1) })
