/**
 * GET /api/provenance?source=met|aic&id=<rawId>
 *
 * Returns the documented movement history for one artwork by combining, in
 * descending credibility tier (see draft/DATA_SOURCES.md):
 *   - Museum prose (tier A): AIC provenance_text + exhibition_history, extracted
 *     by Claude into dated, structured locations — the real journeys live here.
 *   - Wikidata P276 (tier B): location statements with P580/P582 dates + P625 coords.
 *   - Museum detail for title/artist/date/thumbnail + the museum's OWN location.
 *
 * Honesty contract:
 *   - No hardcoded artwork data. Claude only EXTRACTS what the prose states; it
 *     never invents dates or places. If sources are thin, hasGap = true + a note.
 *   - Every LocationEntry carries its own source string (its tier).
 *   - geoLocation is the museum's OWN field, never a cross-museum "on view" claim.
 *   - A place we can't geocode keeps lat/lng null: shown in the timeline, not faked on the map.
 *
 * Cache: 10 min TTL. Rate limit: 20 req / min / IP (shared).
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { cacheGet, cacheSet, checkRateLimit } from '@/lib/cache'
import { geocode, geocodeNamed } from '@/lib/geocode'
import { fetchRijks } from '@/lib/rijksmuseum'
import type {
  ArtworkMeta,
  LocationEntry,
  GapEntry,
  ProvenanceResponse,
} from '@/lib/types'

const PROVENANCE_TTL_MS = 10 * 60 * 1000

// ─── Museum detail fetchers ──────────────────────────────────────────────────

interface MetObject {
  objectID: number
  title: string
  artistDisplayName: string
  objectDate: string
  primaryImageSmall: string
  city: string
  country: string
  repository: string
}

interface Detail { meta: ArtworkMeta; provenance: string; exhibitions: string }

async function fetchMet(id: string): Promise<Detail> {
  const res = await fetch(
    `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
    { next: { revalidate: 0 } },
  )
  if (!res.ok) throw new Error(`Met object HTTP ${res.status}`)
  const o = (await res.json()) as MetObject
  const geo = [o.city, o.country].filter(Boolean).join(', ') || null
  return {
    meta: {
      id: `met-${o.objectID}`,
      source: 'met',
      title: o.title || 'Untitled',
      artist: o.artistDisplayName || 'Unknown artist',
      date: o.objectDate || '',
      thumbnail: o.primaryImageSmall || null,
      geoLocation: geo,
    },
    // The Met public API exposes no provenance/exhibition prose.
    provenance: '',
    exhibitions: '',
  }
}

interface AicData {
  id: number
  title: string
  artist_display: string
  date_display: string
  exhibition_history: string | null
  provenance_text: string | null
  place_of_origin: string | null
  image_id: string | null
}

async function fetchAic(id: string): Promise<Detail> {
  const res = await fetch(
    `https://api.artic.edu/api/v1/artworks/${id}` +
      `?fields=id,title,artist_display,date_display,exhibition_history,` +
      `provenance_text,place_of_origin,image_id`,
    { next: { revalidate: 0 } },
  )
  if (!res.ok) throw new Error(`AIC object HTTP ${res.status}`)
  const { data: d } = (await res.json()) as { data: AicData }
  return {
    meta: {
      id: `aic-${d.id}`,
      source: 'aic',
      title: d.title || 'Untitled',
      artist: d.artist_display || 'Unknown artist',
      date: d.date_display || '',
      thumbnail: d.image_id
        ? `https://www.artic.edu/iiif/2/${d.image_id}/full/200,/0/default.jpg`
        : null,
      geoLocation: d.place_of_origin || null,
    },
    // Kept SEPARATE: provenance = chain of custody (the journey); exhibitions = loans.
    provenance: d.provenance_text || '',
    exhibitions: d.exhibition_history || '',
  }
}

// ─── Wikidata P276 location chain ────────────────────────────────────────────

interface SparqlBinding {
  locationLabel?: { value: string }
  startDate?: { value: string }
  endDate?: { value: string }
  coord?: { value: string } // "Point(lng lat)"
}

function parsePoint(wkt: string | undefined): { lat: number | null; lng: number | null } {
  if (!wkt) return { lat: null, lng: null }
  const m = wkt.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/)
  if (!m) return { lat: null, lng: null }
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) }
}

const WD_UA = 'ProvenanceTracker/0.1 (research demo; provenance reconciliation)'

// Find the artwork's Wikidata entity by title (robust to em-dashes / aliases /
// date suffixes that exact-label matching misses). Prefer a candidate whose
// description names the artist or calls it a painting/artwork.
async function findWikidataQid(title: string, artist: string): Promise<string | null> {
  const surname = artist.replace(/\(.*?\)/g, '').trim().split(/\s+/).pop()?.toLowerCase() ?? ''
  const tries = [title, title.split(/[—–\-:(]/)[0].trim()].filter((v, i, a) => v && a.indexOf(v) === i)

  for (const q of tries) {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=en&type=item&format=json&limit=7&origin=*`
    const res = await fetch(url, { headers: { 'User-Agent': WD_UA }, next: { revalidate: 0 } })
    if (!res.ok) continue
    const json = (await res.json()) as { search?: Array<{ id: string; description?: string }> }
    const hits = json.search ?? []
    if (!hits.length) continue
    // Prefer a hit whose description mentions the artist surname or "painting".
    const best =
      hits.find(h => surname && (h.description ?? '').toLowerCase().includes(surname)) ??
      hits.find(h => /painting|artwork|sculpture|drawing|print/i.test(h.description ?? '')) ??
      hits[0]
    if (best) return best.id
  }
  return null
}

async function fetchWikidataLocations(title: string, artist: string): Promise<LocationEntry[]> {
  const qid = await findWikidataQid(title, artist)
  if (!qid) return []

  const query = `
SELECT ?locationLabel ?startDate ?endDate ?coord WHERE {
  wd:${qid} p:P276 ?stmt .
  ?stmt ps:P276 ?location .
  OPTIONAL { ?stmt pq:P580 ?startDate }
  OPTIONAL { ?stmt pq:P582 ?endDate }
  OPTIONAL { ?location wdt:P625 ?coord }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 25`

  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': WD_UA },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`)
  const json = (await res.json()) as { results: { bindings: SparqlBinding[] } }

  return json.results.bindings.map(b => {
    const { lat, lng } = parsePoint(b.coord?.value)
    return {
      name: b.locationLabel?.value || 'Unknown location',
      lat,
      lng,
      startDate: b.startDate?.value?.slice(0, 10) ?? null,
      endDate: b.endDate?.value?.slice(0, 10) ?? null,
      source: 'Wikidata P276',
    }
  })
}

// ─── Claude prose extraction (tier A — the real journeys) ─────────────────────
// Turn scholarly provenance/exhibition prose into dated, structured locations.
// Claude is instructed to EXTRACT ONLY what the text states — never to invent.

interface ExtractedEntry {
  place: string
  startYear: string | null
  endYear: string | null
}

// Extract a CUSTODY chain (owners/locations over time) from provenance_text.
// Exhibitions are handled separately — a loan is not a change of custody.
async function extractOwnershipLocations(
  title: string,
  artist: string,
  prose: string,
  sourceLabel: string,
): Promise<LocationEntry[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || prose.trim().length < 20) return []

  const client = new Anthropic({ apiKey })
  const prompt = `You extract the CHAIN OF CUSTODY (successive owners/holders and where they were) from an artwork's provenance text. This is ownership over time — NOT exhibitions or loans.
ARTWORK: ${title} — ${artist}

PROVENANCE TEXT:
${prose.slice(0, 4000)}

Return ONLY JSON: {"entries":[{"place": string, "startYear": string|null, "endYear": string|null}]}
Rules:
- One entry per successive owner/holder, in chronological order, with the city they held it in.
- Extract ONLY places/dates explicitly in the text. NEVER invent a place or a date.
- "place" = the city (e.g. "Paris", "Chicago"). Collapse consecutive owners in the same city into one entry.
- Use 4-digit years only; null if none given.
- If no custody/location is documented, return {"entries":[]}.`

  let raw: string
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = msg.content[0]
    raw = block.type === 'text' ? block.text : ''
  } catch (err) {
    console.error('[provenance/extract]', err)
    return []
  }

  let parsed: { entries?: ExtractedEntry[] }
  try {
    parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim())
  } catch {
    return []
  }

  return (parsed.entries ?? [])
    .filter(e => e && typeof e.place === 'string' && e.place.trim())
    .map(e => {
      const pt = geocode(e.place)
      return {
        name: e.place.trim(),
        lat: pt?.lat ?? null,
        lng: pt?.lng ?? null,
        startDate: e.startYear?.match(/\d{4}/)?.[0] ?? null,
        endDate: e.endYear?.match(/\d{4}/)?.[0] ?? null,
        source: sourceLabel,
      }
    })
}

// Deterministic fallback: when Claude is unavailable (no key / no credits / error),
// still mine the same tier-A prose. Split into clauses, geocode each, take its year.
// Lower precision than Claude (it can't resolve "by descent to his mother" to a city),
// but it's honest: it only emits a location when a KNOWN city literally appears in the
// clause, and it never invents a coordinate or a date. Claude upgrades this when funded.
function deterministicExtract(prose: string, sourceLabel: string): LocationEntry[] {
  if (!prose || prose.trim().length < 20) return []
  const clauses = prose.split(/[;\n]+/).map(c => c.trim()).filter(Boolean)
  const out: LocationEntry[] = []
  const seen = new Set<string>()
  for (const clause of clauses) {
    const city = geocodeNamed(clause)
    if (!city) continue
    const years = clause.match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/g)
    const year = years ? years[years.length - 1] : null
    // Collapse exact city+year duplicates (e.g. two catalogue lines for one show).
    const key = `${city.name}:${year ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      name: city.name,
      lat: city.lat,
      lng: city.lng,
      startDate: year,
      endDate: null,
      source: sourceLabel,
    })
  }
  return out
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 20 requests per minute.' },
      { status: 429 },
    )
  }

  const source = request.nextUrl.searchParams.get('source')
  const id = request.nextUrl.searchParams.get('id')

  if (source !== 'met' && source !== 'aic' && source !== 'rijks') {
    return NextResponse.json(
      { error: 'Query param "source" must be "met", "aic", or "rijks"' },
      { status: 400 },
    )
  }
  if (!id) {
    return NextResponse.json({ error: 'Missing query param: id' }, { status: 400 })
  }

  const cacheKey = `provenance:${source}:${id}`
  const cached = cacheGet<ProvenanceResponse>(cacheKey)
  if (cached) return NextResponse.json(cached)

  // 1. Museum detail (required — if this fails, the artwork itself is unknown)
  let meta: ArtworkMeta
  let provenanceText = ''
  let exhibitionText = ''
  try {
    const detail =
      source === 'met' ? await fetchMet(id)
      : source === 'rijks' ? await fetchRijks(id)
      : await fetchAic(id)
    meta = detail.meta
    provenanceText = detail.provenance
    exhibitionText = detail.exhibitions
  } catch (err) {
    console.error('[provenance/detail]', err)
    return NextResponse.json(
      { error: `Could not load artwork ${source}-${id} from museum API` },
      { status: 502 },
    )
  }

  // 2. CUSTODY chain (the journey) from provenance_text — Claude, else deterministic,
  //    else Wikidata P276. Exhibitions are handled separately so a LOAN is never shown
  //    as a change of custody. This is the precision fix.
  const srcName = source === 'met' ? 'Met' : source === 'rijks' ? 'Rijksmuseum' : 'AIC'
  const provLabel = `${srcName} provenance`
  let [ownership, wikiLocs] = await Promise.all([
    extractOwnershipLocations(meta.title, meta.artist, provenanceText, provLabel).catch(err => {
      console.error('[provenance/ownership]', err); return [] as LocationEntry[]
    }),
    fetchWikidataLocations(meta.title, meta.artist).catch(err => {
      console.error('[provenance/wikidata]', err); return [] as LocationEntry[]
    }),
  ])
  if (ownership.length === 0) ownership = deterministicExtract(provenanceText, provLabel)
  // Wikidata only fills the custody chain when the prose gave us nothing — prose is
  // tier-A and avoids the wrong-entity matches Wikidata sometimes returns.
  if (ownership.length === 0) ownership = wikiLocs

  // Exhibitions = loans. Deterministic is fine — exhibition_history is highly structured.
  const exhibitions = deterministicExtract(exhibitionText, `${srcName} exhibition history`)

  const yr = (l: LocationEntry) => (l.startDate ? parseInt(l.startDate.slice(0, 4), 10) : Number.MAX_SAFE_INTEGER)
  const locations = ownership.sort((a, b) => yr(a) - yr(b))
  exhibitions.sort((a, b) => yr(a) - yr(b))

  // 3. Honest gap detection — based on the CUSTODY chain we can map (not loans).
  const located = locations.filter(l => l.lat != null && l.lng != null)
  const hasGap = located.length < 2
  const exhibitionNote = exhibitions.length
    ? ` Exhibition history is available below (${exhibitions.length} loans), but loans are not changes of custody.`
    : ''
  const gaps: GapEntry[] = hasGap
    ? [
        {
          from: null,
          to: null,
          note:
            (locations.length === 0
              ? 'No documented chain of custody found in structured sources or museum records. Provenance gap — help complete it.'
              : located.length === 0
                ? 'Custody is documented but its locations could not be mapped to coordinates. Provenance gap — help complete it.'
                : 'Only one mapped owner/location found; the chain of custody is incomplete. Provenance gap — help complete it.') + exhibitionNote,
        },
      ]
    : []

  const response: ProvenanceResponse = { artwork: meta, locations, exhibitions, gaps, hasGap }
  cacheSet(cacheKey, response, PROVENANCE_TTL_MS)
  return NextResponse.json(response)
}
