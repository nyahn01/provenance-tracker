/**
 * Pre-parse provenance prose for the 6 featured artworks using Claude Haiku.
 * Commit the output — featured works then have zero runtime Claude cost.
 *
 * Run: node scripts/preparse-provenance.mjs
 * Requires: ANTHROPIC_API_KEY in .env.local
 */

import Anthropic from '@anthropic-ai/sdk'
import { writeFile, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

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

// ─── Inline geocoder (mirrors src/lib/geocode.ts) ────────────────────────────
const CITIES = {
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
  'new york': { lat: 40.7128, lng: -74.006 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  amsterdam: { lat: 52.3676, lng: 4.9041 },
  brussels: { lat: 50.8503, lng: 4.3517 },
  'the hague': { lat: 52.0705, lng: 4.3007 },
  rotterdam: { lat: 51.9244, lng: 4.4777 },
  antwerp: { lat: 51.2194, lng: 4.4025 },
  bruges: { lat: 51.2093, lng: 3.2247 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  barcelona: { lat: 41.3874, lng: 2.1686 },
  lisbon: { lat: 38.7223, lng: -9.1393 },
  florence: { lat: 43.7696, lng: 11.2558 },
  rome: { lat: 41.9028, lng: 12.4964 },
  venice: { lat: 45.4408, lng: 12.3155 },
  milan: { lat: 45.4642, lng: 9.19 },
  naples: { lat: 40.8518, lng: 14.2681 },
  vienna: { lat: 48.2082, lng: 16.3738 },
  berlin: { lat: 52.52, lng: 13.405 },
  munich: { lat: 48.1351, lng: 11.582 },
  cologne: { lat: 50.9375, lng: 6.9603 },
  dresden: { lat: 51.0504, lng: 13.7373 },
  'st petersburg': { lat: 59.9311, lng: 30.3609 },
  'saint petersburg': { lat: 59.9311, lng: 30.3609 },
  moscow: { lat: 55.7558, lng: 37.6173 },
  geneva: { lat: 46.2044, lng: 6.1432 },
  zurich: { lat: 47.3769, lng: 8.5417 },
  basel: { lat: 47.5596, lng: 7.5886 },
  copenhagen: { lat: 55.6761, lng: 12.5683 },
  stockholm: { lat: 59.3293, lng: 18.0686 },
  oslo: { lat: 59.9139, lng: 10.7522 },
  dublin: { lat: 53.3498, lng: -6.2603 },
  edinburgh: { lat: 55.9533, lng: -3.1883 },
  prague: { lat: 50.0755, lng: 14.4378 },
  budapest: { lat: 47.4979, lng: 19.0402 },
  warsaw: { lat: 52.2297, lng: 21.0122 },
  athens: { lat: 37.9838, lng: 23.7275 },
  istanbul: { lat: 41.0082, lng: 28.9784 },
  cairo: { lat: 30.0444, lng: 31.2357 },
  washington: { lat: 38.9072, lng: -77.0369 },
  'washington dc': { lat: 38.9072, lng: -77.0369 },
  boston: { lat: 42.3601, lng: -71.0589 },
  philadelphia: { lat: 39.9526, lng: -75.1652 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  detroit: { lat: 42.3314, lng: -83.0458 },
  toronto: { lat: 43.6532, lng: -79.3832 },
  montreal: { lat: 45.5017, lng: -73.5673 },
  'mexico city': { lat: 19.4326, lng: -99.1332 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  kyoto: { lat: 35.0116, lng: 135.7681 },
  beijing: { lat: 39.9042, lng: 116.4074 },
  shanghai: { lat: 31.2304, lng: 121.4737 },
  taipei: { lat: 25.033, lng: 121.5654 },
  'hong kong': { lat: 22.3193, lng: 114.1694 },
  // French towns that appear in provenance records
  provins: { lat: 48.5597, lng: 3.2972 },
  // US towns that appear in provenance records
  'lake forest': { lat: 42.2597, lng: -87.8398 },
}
const SORTED = Object.keys(CITIES).sort((a, b) => b.length - a.length)

function geocode(place) {
  if (!place) return null
  const s = place.toLowerCase()
  for (const city of SORTED) {
    if (s.includes(city)) return CITIES[city]
  }
  return null
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
