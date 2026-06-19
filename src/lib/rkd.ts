/**
 * RKD (Rijkskunsthistorisch Documentatiecentrum) Netherlands Art Institute API.
 * Free, no API key required. ~150k Dutch/Flemish artworks with documented provenance.
 * API docs: https://api.rkd.nl/
 *
 * Used as Tier B data enrichment for non-AIC/Met works and to cross-reference
 * Impressionist works that passed through Dutch/Belgian dealers.
 */

export interface RkdRecord {
  priref: string
  title: string | null
  artist: string | null
  dating: string | null
  objectCategory: string | null
  currentLocation: string | null
  provenance: string | null
  sourceUrl: string
  sourceLabel: 'RKD Netherlands Art Institute'
}

const RKD_BASE = 'https://api.rkd.nl/api/search/kunstwerken'
const RKD_UA = 'ProvenanceTracker/0.1 (research demo; contact: provenance@example.com)'

interface RkdHit {
  priref?: string
  titel?: string
  kunstenaar?: Array<{ naam_inverted?: string; naam?: string }> | string
  datering?: string
  objectcategorie?: string[]
  huidige_eigenaar?: Array<{ naam?: string }> | string
  herkomst?: string
}

interface RkdResponse {
  response?: {
    numFound?: number
    docs?: RkdHit[]
  }
}

function artistName(raw: RkdHit['kunstenaar']): string | null {
  if (!raw) return null
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw) && raw.length > 0) return raw[0].naam_inverted ?? raw[0].naam ?? null
  return null
}

function currentLocation(raw: RkdHit['huidige_eigenaar']): string | null {
  if (!raw) return null
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw) && raw.length > 0) return raw[0].naam ?? null
  return null
}

/** Search RKD by artist last name (and optionally title fragment). Returns up to `limit` records. */
export async function searchRkd(artist: string, title = '', limit = 10): Promise<RkdRecord[]> {
  // RKD uses Dutch/inverted name format — extract last name for the query
  const lastName = artist.replace(/\(.*?\)/g, '').trim().split(/\s+/).pop() ?? ''
  if (!lastName || lastName.length < 3) return []

  const params = new URLSearchParams({
    term: lastName,
    format: 'json',
    rows: String(limit * 3), // fetch more, filter down
    start: '0',
    language: 'en',
  })

  let data: RkdResponse
  try {
    const res = await fetch(`${RKD_BASE}?${params}`, {
      headers: { 'User-Agent': RKD_UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      console.warn(`[rkd] HTTP ${res.status} for artist "${lastName}"`)
      return []
    }
    data = (await res.json()) as RkdResponse
  } catch (err) {
    console.warn('[rkd] fetch error:', err)
    return []
  }

  const docs = data.response?.docs ?? []
  const titleLower = title.toLowerCase().replace(/[^a-z0-9 ]/g, ' ')
  const titleWords = titleLower.split(/\s+/).filter(w => w.length > 4)

  return docs
    .filter(doc => {
      if (!doc.priref) return false
      // Title filter: if title provided, at least one keyword must match
      if (titleWords.length > 0 && doc.titel) {
        const docTitle = doc.titel.toLowerCase()
        if (!titleWords.some(w => docTitle.includes(w))) return false
      }
      return true
    })
    .slice(0, limit)
    .map(doc => ({
      priref: doc.priref ?? '',
      title: doc.titel ?? null,
      artist: artistName(doc.kunstenaar),
      dating: doc.datering ?? null,
      objectCategory: doc.objectcategorie?.[0] ?? null,
      currentLocation: currentLocation(doc.huidige_eigenaar),
      provenance: doc.herkomst ?? null,
      sourceUrl: `https://rkd.nl/explore/images/${doc.priref}`,
      sourceLabel: 'RKD Netherlands Art Institute' as const,
    }))
}
