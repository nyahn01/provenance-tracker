/**
 * GET /api/provenance?source=met|aic&id=<rawId>
 *
 * Returns the documented movement history for one artwork by combining:
 *   - museum detail (Met or AIC) for title/artist/date/thumbnail + own location
 *   - Wikidata P276 (location) statements with P580/P582 (start/end) qualifiers
 *     and P625 coordinates of each location
 *
 * Honesty contract:
 *   - No hardcoded artwork data. If sources are thin, hasGap = true + a gap note.
 *   - Every LocationEntry carries its own source string.
 *   - geoLocation is the museum's OWN field, never a cross-museum "on view" claim.
 *
 * Cache: 10 min TTL. Rate limit: 20 req / min / IP (shared).
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet, checkRateLimit } from '@/lib/cache'
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

async function fetchMet(id: string): Promise<{ meta: ArtworkMeta; raw: string }> {
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
    raw: o.repository || '',
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

async function fetchAic(id: string): Promise<{ meta: ArtworkMeta; raw: string }> {
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
    raw: [d.provenance_text, d.exhibition_history].filter(Boolean).join('\n\n'),
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

async function fetchWikidataLocations(title: string): Promise<LocationEntry[]> {
  // Match the artwork by exact English label, pull P276 with date + coord.
  const escaped = title.replace(/["\\]/g, '\\$&')
  const query = `
SELECT ?locationLabel ?startDate ?endDate ?coord WHERE {
  ?item rdfs:label "${escaped}"@en .
  ?item p:P276 ?stmt .
  ?stmt ps:P276 ?location .
  OPTIONAL { ?stmt pq:P580 ?startDate }
  OPTIONAL { ?stmt pq:P582 ?endDate }
  OPTIONAL { ?location wdt:P625 ?coord }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 25`

  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'ProvenanceTracker/0.1 (research demo)',
    },
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

  if (source !== 'met' && source !== 'aic') {
    return NextResponse.json(
      { error: 'Query param "source" must be "met" or "aic"' },
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
  try {
    const detail = source === 'met' ? await fetchMet(id) : await fetchAic(id)
    meta = detail.meta
  } catch (err) {
    console.error('[provenance/detail]', err)
    return NextResponse.json(
      { error: `Could not load artwork ${source}-${id} from museum API` },
      { status: 502 },
    )
  }

  // 2. Wikidata location chain (best-effort — thin coverage is expected & honest)
  let locations: LocationEntry[] = []
  try {
    locations = await fetchWikidataLocations(meta.title)
  } catch (err) {
    console.error('[provenance/wikidata]', err)
    // Leave locations empty; the gap state below covers it honestly.
  }

  // 3. Honest gap detection
  const located = locations.filter(l => l.lat != null && l.lng != null)
  const hasGap = located.length < 2
  const gaps: GapEntry[] = hasGap
    ? [
        {
          from: null,
          to: null,
          note:
            located.length === 0
              ? 'No mapped movement history found in structured sources (Wikidata P276). Provenance gap — help complete it.'
              : 'Only one mapped location found; the movement chain is incomplete. Provenance gap — help complete it.',
        },
      ]
    : []

  const response: ProvenanceResponse = { artwork: meta, locations, gaps, hasGap }
  cacheSet(cacheKey, response, PROVENANCE_TTL_MS)
  return NextResponse.json(response)
}
