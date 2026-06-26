/**
 * GET /api/search?q=<artwork or artist name>
 *
 * Queries Met and AIC APIs in parallel and returns a merged result array.
 * Every result carries its source so the UI can trace facts back.
 *
 * Cache: 5 min TTL per normalised query string (in-memory Map).
 * Rate limit: 20 req / min / IP (sliding window).
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet, checkRateLimit } from '@/lib/cache'
import { searchRijks } from '@/lib/rijksmuseum'
import { searchEuropeana } from '@/lib/europeana'
import { searchWikidata } from '@/lib/wikidata-search'
import { searchCleveland } from '@/lib/cleveland'
import type { SearchResult, SearchResponse } from '@/lib/types'

const SEARCH_TTL_MS = 5 * 60 * 1000 // 5 minutes

// ---------------------------------------------------------------------------
// Met Museum helpers
// ---------------------------------------------------------------------------

interface MetSearchPayload {
  total: number
  objectIDs: number[] | null
}

interface MetObject {
  objectID: number
  title: string
  artistDisplayName: string
  objectDate: string
  primaryImageSmall: string
}

async function searchMet(q: string): Promise<SearchResult[]> {
  const searchRes = await fetch(
    `https://collectionapi.metmuseum.org/public/collection/v1/search` +
      `?q=${encodeURIComponent(q)}&hasImages=true`,
    { next: { revalidate: 0 } },
  )
  if (!searchRes.ok) throw new Error(`Met search HTTP ${searchRes.status}`)

  const { objectIDs } = (await searchRes.json()) as MetSearchPayload
  if (!objectIDs || objectIDs.length === 0) return []

  const settled = await Promise.allSettled(
    objectIDs.slice(0, 3).map(id =>
      fetch(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
        { next: { revalidate: 0 } },
      ).then(r => {
        if (!r.ok) throw new Error(`Met object HTTP ${r.status}`)
        return r.json() as Promise<MetObject>
      }),
    ),
  )

  return settled
    .filter((r): r is PromiseFulfilledResult<MetObject> => r.status === 'fulfilled')
    .map(r => ({
      id: `met-${r.value.objectID}`,
      source: 'met' as const,
      title: r.value.title || 'Untitled',
      artist: r.value.artistDisplayName || 'Unknown artist',
      date: r.value.objectDate || '',
      thumbnail: r.value.primaryImageSmall || null,
    }))
}

// ---------------------------------------------------------------------------
// AIC helpers
// ---------------------------------------------------------------------------

interface AicArtwork {
  id: number
  title: string
  artist_display: string
  date_display: string
  place_of_origin: string | null
  image_id: string | null
}

interface AicSearchPayload {
  data: AicArtwork[]
}

async function searchAic(q: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://api.artic.edu/api/v1/artworks/search` +
      `?q=${encodeURIComponent(q)}&limit=3` +
      `&fields=id,title,artist_display,date_display,place_of_origin,image_id`,
    { next: { revalidate: 0 } },
  )
  if (!res.ok) throw new Error(`AIC search HTTP ${res.status}`)

  const { data } = (await res.json()) as AicSearchPayload

  return (data ?? []).map(a => ({
    id: `aic-${a.id}`,
    source: 'aic' as const,
    title: a.title || 'Untitled',
    artist: a.artist_display || 'Unknown artist',
    date: a.date_display || '',
    thumbnail: a.image_id
      ? `https://www.artic.edu/iiif/2/${a.image_id}/full/200,/0/default.jpg`
      : null,
  }))
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Per-IP rate limiting (20 req / min)
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

  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Missing or too-short query parameter: q' },
      { status: 400 },
    )
  }

  const cacheKey = `search:${q.toLowerCase()}`
  const cached = cacheGet<SearchResponse>(cacheKey)
  if (cached) {
    return NextResponse.json({ ...cached, cached: true })
  }

  // Detect institution-name queries so we don't send "Rijksmuseum" as an artwork
  // title to Met/AIC (which matches provenance text, not collection source).
  const qLower = q.toLowerCase().replace(/[^a-z]/g, '')
  const isRijksQuery = ['rijksmuseum', 'rijks'].includes(qLower)
  const isMetQuery = ['met', 'metropolitan', 'metropolitanmuseum'].includes(qLower)
  const isAicQuery = ['aic', 'artinstituteofchicago', 'artinstitute', 'chicago'].includes(qLower)

  const [metResult, aicResult, rijksResult, europeanaResult, wikidataResult, clevelandResult] = await Promise.allSettled([
    isRijksQuery ? Promise.resolve([]) : searchMet(q),
    isRijksQuery ? Promise.resolve([]) : searchAic(q),
    // For Rijksmuseum name queries: browse without a specific title term
    isRijksQuery ? searchRijks('') : searchRijks(q),
    searchEuropeana(q, 3),
    // Wikidata indexes works held outside our museum APIs (e.g. Klimt at the Belvedere)
    isRijksQuery || isMetQuery || isAicQuery ? Promise.resolve([]) : searchWikidata(q, 4),
    // Cleveland: open access, dated structured provenance + images
    isRijksQuery || isMetQuery || isAicQuery ? Promise.resolve([]) : searchCleveland(q, 3),
  ])

  if (metResult.status === 'rejected') console.error('[search/met]', metResult.reason)
  if (aicResult.status === 'rejected') console.error('[search/aic]', aicResult.reason)
  if (rijksResult.status === 'rejected') console.error('[search/rijks]', rijksResult.reason)
  if (europeanaResult.status === 'rejected') console.error('[search/europeana]', europeanaResult.reason)
  if (wikidataResult.status === 'rejected') console.error('[search/wikidata]', wikidataResult.reason)
  if (clevelandResult.status === 'rejected') console.error('[search/cleveland]', clevelandResult.reason)

  const merged: SearchResult[] = [
    ...(metResult.status === 'fulfilled' ? metResult.value : []),
    ...(aicResult.status === 'fulfilled' ? aicResult.value : []),
    ...(rijksResult.status === 'fulfilled' ? rijksResult.value : []),
    ...(europeanaResult.status === 'fulfilled' ? europeanaResult.value : []),
    ...(wikidataResult.status === 'fulfilled' ? wikidataResult.value : []),
    ...(clevelandResult.status === 'fulfilled' ? clevelandResult.value : []),
  ]

  // Dedup by normalised artist+title (the same work can surface from >1 source),
  // then sort so results WITH a thumbnail come first (better visual scan).
  const dedupKey = (r: SearchResult) =>
    `${r.artist}|${r.title}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  const byKey = new Map<string, SearchResult>()
  for (const r of merged) {
    const k = dedupKey(r)
    const existing = byKey.get(k)
    // Prefer the variant that has a thumbnail.
    if (!existing || (!existing.thumbnail && r.thumbnail)) byKey.set(k, r)
  }
  const results: SearchResult[] = [...byKey.values()].sort(
    (a, b) => (b.thumbnail ? 1 : 0) - (a.thumbnail ? 1 : 0),
  )

  const sources: string[] = []
  if (!isRijksQuery && metResult.status === 'fulfilled') sources.push('Metropolitan Museum of Art API')
  if (!isRijksQuery && aicResult.status === 'fulfilled') sources.push('Art Institute of Chicago API')
  if (rijksResult.status === 'fulfilled') sources.push('Rijksmuseum API')
  if (europeanaResult.status === 'fulfilled' && (europeanaResult.value as SearchResult[]).length > 0) sources.push('Europeana API')
  if (wikidataResult.status === 'fulfilled' && (wikidataResult.value as SearchResult[]).length > 0) sources.push('Wikidata')
  if (clevelandResult.status === 'fulfilled' && (clevelandResult.value as SearchResult[]).length > 0) sources.push('Cleveland Museum of Art API')

  const response: SearchResponse = { results, query: q, sources }
  cacheSet(cacheKey, response, SEARCH_TTL_MS)

  return NextResponse.json(response)
}
