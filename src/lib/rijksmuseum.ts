/**
 * Rijksmuseum integration via the new keyless Linked Art API (data.rijksmuseum.nl).
 *
 * The old www.rijksmuseum.nl/api endpoint is retired (HTTP 410). The new service
 * returns Linked Art JSON and needs no key. Trade-offs we accept honestly:
 *   - Search returns only object URIs; we resolve each (+ its creator) — so we cap
 *     results and time-box every call so a slow Rijks never stalls our search.
 *   - Provenance here is owner-centric prose (often without cities), so journeys are
 *     frequently sparse → honest gap. That's expected for works that stayed in NL.
 *   - Thumbnails are nested another level deep; we skip them for now (null).
 *
 * Provenance statement is reliably classified by Getty AAT 300444174 (history of ownership).
 */

import type { SearchResult, ArtworkMeta } from '@/lib/types'

const UA = 'ProvenanceTracker/0.1 (research demo)'
const AAT_PROVENANCE = 'aat/300444174'
const TIMEOUT_MS = 4500

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function primaryName(obj: any): string | null {
  for (const n of obj?.identified_by ?? []) {
    if (n?.type === 'Name' && n?.content) return n.content as string
  }
  return null
}

function creatorUri(obj: any): string | null {
  const prod = obj?.produced_by ?? {}
  for (const part of prod.part ?? []) {
    for (const c of part.carried_out_by ?? []) if (c?.id) return c.id as string
  }
  for (const c of prod.carried_out_by ?? []) if (c?.id) return c.id as string
  return null
}

function productionDate(obj: any): string {
  const ts = obj?.produced_by?.timespan
  if (!ts) return ''
  if (ts._label) return String(ts._label)
  const begin = ts.begin_of_the_begin?.slice?.(0, 4)
  const end = ts.end_of_the_end?.slice?.(0, 4)
  return [begin, end].filter(Boolean).join('–')
}

function numericId(uri: string): string {
  return uri.split('/').pop() ?? uri
}

async function creatorName(obj: any): Promise<string> {
  const uri = creatorUri(obj)
  if (!uri) return 'Unknown artist'
  const c = await getJson(uri)
  return (c && primaryName(c)) || 'Unknown artist'
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchRijks(query: string, limit = 2): Promise<SearchResult[]> {
  // type=schilderij = paintings only (excludes photo-reproductions). Query the term as
  // BOTH a creator and a title since we don't know which the user typed; merge + dedupe.
  const q = encodeURIComponent(query)
  const base = 'https://data.rijksmuseum.nl/search/collection'
  const [byCreator, byTitle] = await Promise.all([
    getJson(`${base}?creator=${q}&type=schilderij`),
    getJson(`${base}?title=${q}&type=schilderij`),
  ])
  const collect = (s: any): string[] => (s?.orderedItems ?? []).map((i: any) => i?.id).filter(Boolean)
  const uris = [...new Set([...collect(byCreator), ...collect(byTitle)])].slice(0, limit)

  const settled = await Promise.all(
    uris.map(async (uri: string): Promise<SearchResult | null> => {
      const obj = await getJson(uri)
      if (!obj) return null
      const title = primaryName(obj)
      if (!title) return null
      const artist = await creatorName(obj)
      return {
        id: `rijks-${numericId(uri)}`,
        source: 'rijks',
        title,
        artist,
        date: productionDate(obj),
        thumbnail: null,
      }
    }),
  )
  const out: SearchResult[] = []
  for (const r of settled) if (r) out.push(r)
  return out
}

// ── Provenance detail ─────────────────────────────────────────────────────────
export async function fetchRijks(
  id: string,
): Promise<{ meta: ArtworkMeta; provenance: string; exhibitions: string }> {
  const obj = await getJson(`https://id.rijksmuseum.nl/${id}`)
  if (!obj) throw new Error(`Rijksmuseum object ${id} unavailable`)

  const title = primaryName(obj) || 'Untitled'
  const artist = await creatorName(obj)

  // Provenance statement (Getty AAT history-of-ownership), prefer English content.
  const provStatements = (obj.referred_to_by ?? []).filter((r: any) =>
    (r.classified_as ?? []).some((c: any) => (c.id ?? '').includes(AAT_PROVENANCE)),
  )
  const provenance = provStatements.map((r: any) => r.content).filter(Boolean).join('\n') || ''

  const currentLocation =
    obj.current_location?._label ?? obj.current_location?.id ?? null

  return {
    meta: {
      id: `rijks-${numericId(obj.id ?? id)}`,
      source: 'rijks',
      title,
      artist,
      date: productionDate(obj),
      thumbnail: null,
      geoLocation: currentLocation,
    },
    provenance,
    exhibitions: '',
  }
}
