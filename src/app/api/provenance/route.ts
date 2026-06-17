/**
 * GET /api/provenance?source=met|aic&id=<id>
 *
 * Fetches artwork detail from Met or AIC, then queries Wikidata SPARQL for
 * P276 (location) statements with optional P580/P582 start+end dates.
 *
 * Returns:
 *   {
 *     artwork: { id, source, title, artist, date, thumbnail, geoLocation? }
 *     locations: LocationEntry[]   — each entry carries its source
 *     gaps: GapEntry[]             — explicitly surfaced unknown periods
 *     hasGap: boolean
 *   }
 *
 * Honesty rules enforced here:
 *   - is_on_view (Met) is NEVER exposed as cross-museum location truth.
 *   - Wikidata P276 coverage is ~5.5%; sparse results produce an explicit gap.
 *   - No coordinates are invented; unknown coords are omitted, not zeroed.
 *
 * Cache: 10 min TTL.
 * Rate limit: 20 req / min / IP.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet, checkRateLimit } from '@/lib/cache'

const PROVENANCE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql'

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface ArtworkMeta {
  id: string
  source: 'met' | 'aic'
  title: string
  artist: string
  date: string
  thumbnail: string | null
  /** Raw geographic info from the museum record, if present */
  geoLocation: string | null
}

export interface LocationEntry {
  /** Display name of the location */
  name: string
  lat: number | null
  lng: number | null
  /** ISO-8601 or partial year string, e.g. "1889" */
  startDate: string | null
  endDate: string | null
  source: string
}

export interface GapEntry {
  from: string | null
  to: string | null
  note: string
}

export interface ProvenanceResponse {
  artwork: ArtworkMeta
  locations: LocationEntry[]
  gaps: GapEntry[]
  hasGap: boolean
}

// ---------------------------------------------------------------------------
// Met API
// ---------------------------------------------------------------------------

interface MetObject {
  objectID: number
  title: string
  artistDisplayName: string
  objectDate: string
  primaryImageSmall: string
  GeoDecLat: string
  GeoDecLng: string
  city: string
  country: string
  artistNationality: string
}

async function fetchMetArtwork(id: string): Promise<ArtworkMeta> {
  const res = await fetch(
    `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
    { next: { revalidate: 0 } },
  )
  if (!res.ok) throw new Error(`Met object HTTP ${res.status}`)
  const obj = (await res.json()) as MetObject

  // Compose a geo-location string from whatever fields exist — this is the
  // museum's own field about where the object was created/found, NOT loan status.
  const geoLocation =
    [obj.city, obj.country].filter(Boolean).join(', ') ||
    obj.artistNationality ||
    null

  return {
    id,
    source: 'met',
    title: obj.title || 'Untitled',
    artist: obj.artistDisplayName || 'Unknown artist',
    date: obj.objectDate || '',
    thumbnail: obj.primaryImageSmall || null,
    geoLocation,
  }
}

// ---------------------------------------------------------------------------
// AIC API
// ---------------------------------------------------------------------------

interface AicObject {
  id: number
  title: string
  artist_display: string
  date_display: string
  exhibition_history: string | null
  provenance_text: string | null
  place_of_origin: string | null
  latitude: number | null
  longitude: number | null
  image_id: string | null
}

async function fetchAicArtwork(id: string): Promise<ArtworkMeta> {
  const fields = [
    'id', 'title', 'artist_display', 'date_display',
    'exhibition_history', 'provenance_text',
    'place_of_origin', 'latitude', 'longitude', 'image_id',
  ].join(',')
  const res = await fetch(
    `https://api.artic.edu/api/v1/artworks/${id}?fields=${fields}`,
    { next: { revalidate: 0 } },
  )
  if (!res.ok) throw new Error(`AIC object HTTP ${res.status}`)
  const wrapper = (await res.json()) as { data: AicObject }
  const obj = wrapper.data

  return {
    id,
    source: 'aic',
    title: obj.title || 'Untitled',
    artist: obj.artist_display || 'Unknown artist',
    date: obj.date_display || '',
    thumbnail: obj.image_id
      ? `https://www.artic.edu/iiif/2/${obj.image_id}/full/200,/0/default.jpg`
      : null,
    geoLocation: obj.place_of_origin || null,
  }
}

// ---------------------------------------------------------------------------
// Wikidata SPARQL — P276 (location) with P580/P582 dates
//
// Coverage is ~5.5% and often a single value.  We design for sparsity:
// an explicit gap is returned rather than an empty array.
// ---------------------------------------------------------------------------

interface WikidataBinding {
  location?: { value: string }
  locationLabel?: { value: string }
  startDate?: { value: string }
  endDate?: { value: string }
}

interface WikidataResponse {
  results: { bindings: WikidataBinding[] }
}

async function queryWikidataLocations(
  title: string,
  artist: string,
): Promise<LocationEntry[]> {
  // Escape double-quotes inside the title to avoid SPARQL injection
  const safeTitle = title.replace(/"/g, '\\"').replace(/\n/g, ' ').trim()

  const sparql = `
SELECT ?item ?location ?locationLabel ?startDate ?endDate WHERE {
  ?item wdt:P31 wd:Q3305213 ;
        rdfs:label "${safeTitle}"@en .
  OPTIONAL { ?item p:P276 ?locStmt .
             ?locStmt ps:P276 ?location .
             OPTIONAL { ?locStmt pq:P580 ?startDate }
             OPTIONAL { ?locStmt pq:P582 ?endDate } }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 20`

  const url =
    `${WIKIDATA_SPARQL_ENDPOINT}?query=${encodeURIComponent(sparql)}` +
    `&format=json`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000) // 25 s (Wikidata limit is 30 s)

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': 'ProvenanceTracker/1.0 (ahn.ny01@gmail.com)',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`Wikidata SPARQL HTTP ${res.status}`)

    const data = (await res.json()) as WikidataResponse
    const bindings = data.results.bindings

    const locations: LocationEntry[] = []
    for (const b of bindings) {
      if (!b.location) continue // row matched item but no P276 statement
      locations.push({
        name: b.locationLabel?.value ?? b.location.value,
        lat: null, // Wikidata SPARQL result doesn't directly include coords here
        lng: null,
        startDate: b.startDate?.value ?? null,
        endDate: b.endDate?.value ?? null,
        source: 'Wikidata P276',
      })
    }
    return locations
  } catch (err) {
    clearTimeout(timeout)
    console.error('[provenance/wikidata]', err)
    return [] // non-fatal — gaps will be surfaced to the UI
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Per-IP rate limiting
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

  const source = request.nextUrl.searchParams.get('source')?.toLowerCase()
  const id = request.nextUrl.searchParams.get('id')?.trim()

  if (!source || !id) {
    return NextResponse.json({ error: 'Missing required params: source, id' }, { status: 400 })
  }
  if (source !== 'met' && source !== 'aic') {
    return NextResponse.json({ error: 'source must be "met" or "aic"' }, { status: 400 })
  }

  const cacheKey = `provenance:${source}:${id}`
  const cached = cacheGet<ProvenanceResponse>(cacheKey)
  if (cached) {
    return NextResponse.json({ ...cached, cached: true })
  }

  // 1. Fetch artwork metadata from the museum API
  let artwork: ArtworkMeta
  try {
    artwork = source === 'met' ? await fetchMetArtwork(id) : await fetchAicArtwork(id)
  } catch (err) {
    console.error(`[provenance/${source}]`, err)
    return NextResponse.json({ error: 'Failed to fetch artwork from museum API' }, { status: 502 })
  }

  // 2. Query Wikidata for P276 location history
  const wikidataLocations = await queryWikidataLocations(artwork.title, artwork.artist)

  // 3. Build the locations array and detect gaps
  //    Wikidata coverage is sparse — fewer than 2 entries triggers a gap.
  const locations: LocationEntry[] = wikidataLocations

  const gaps: GapEntry[] = []
  const hasGap = locations.length < 2

  if (hasGap) {
    gaps.push({
      from: null,
      to: null,
      note:
        locations.length === 0
          ? 'No location history found in Wikidata (P276). The full provenance of this artwork is not publicly recorded in structured data.'
          : 'Only one location entry found in Wikidata (P276). Earlier or later location history is not available in structured data.',
    })
  }

  const response: ProvenanceResponse = { artwork, locations, gaps, hasGap }
  cacheSet(cacheKey, response, PROVENANCE_TTL_MS)

  return NextResponse.json(response)
}
