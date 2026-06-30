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
import { getCached, setCached, checkRateLimit } from '@/lib/cache'
import { searchRijks } from '@/lib/rijksmuseum'
import { searchEuropeana } from '@/lib/europeana'
import { searchWikidata } from '@/lib/wikidata-search'
import { searchCleveland } from '@/lib/cleveland'
import { hasGpiCoverage } from '@/lib/getty'
import type { SearchResult, SearchResponse, SearchByMode } from '@/lib/types'

const SEARCH_TTL_MS = 5 * 60 * 1000 // 5 minutes
const FETCH_TIMEOUT_MS = 5000 // per-call cap so one slow upstream never stalls search

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
    { next: { revalidate: 0 }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
  )
  if (!searchRes.ok) throw new Error(`Met search HTTP ${searchRes.status}`)

  const { objectIDs } = (await searchRes.json()) as MetSearchPayload
  if (!objectIDs || objectIDs.length === 0) return []

  const settled = await Promise.allSettled(
    objectIDs.slice(0, 3).map(id =>
      fetch(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
        { next: { revalidate: 0 }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
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
    { next: { revalidate: 0 }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
  )
  if (!res.ok) throw new Error(`AIC search HTTP ${res.status}`)

  const { data } = (await res.json()) as AicSearchPayload

  return (data ?? []).map(a => ({
    id: `aic-${a.id}`,
    source: 'aic' as const,
    title: a.title || 'Untitled',
    artist: a.artist_display || 'Unknown artist',
    date: a.date_display || '',
    // AIC's IIIF image host is now behind a Cloudflare bot challenge (HTTP 403,
    // CORP:same-origin) that blocks both cross-origin <img> hotlinks and
    // server-side proxying. Return null so the UI shows a clean placeholder
    // rather than a broken image. (Featured AIC works are self-hosted instead.)
    thumbnail: null,
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

  // Parse searchBy mode — default 'all'; invalid values fall back to 'all'.
  const rawMode = request.nextUrl.searchParams.get('searchBy')
  const searchBy: SearchByMode =
    rawMode === 'artist' || rawMode === 'title' ? rawMode : 'all'

  const cacheKey = `search:${searchBy}:${q.toLowerCase()}`
  const cached = await getCached<SearchResponse>(cacheKey)
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

  // Dedup by normalised artist+title (the same work can surface from >1 source).
  const dedupKey = (r: SearchResult) =>
    `${r.artist}|${r.title}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  const byKey = new Map<string, SearchResult>()
  for (const r of merged) {
    const k = dedupKey(r)
    const existing = byKey.get(k)
    // Prefer the variant that has a thumbnail.
    if (!existing || (!existing.thumbnail && r.thumbnail)) byKey.set(k, r)
  }

  // ── Relevance ranking ──────────────────────────────────────────────────────
  // Rank by how well the result matches the query, not just "has an image".
  // Title matches outweigh artist matches; exact/prefix beats substring beats
  // per-token; a thumbnail and a provenance-rich source are tie-breakers.
  //
  // searchBy mode adjusts the weights:
  //   'artist' — surname search: artist-field matches are boosted heavily and
  //              title-only matches are penalised so "Claude" → Claude Lorrain,
  //              not every work with "Claude" in its title or Monet's first name.
  //   'title'  — looking for a specific painting: title matches dominate and
  //              artist matches are demoted to avoid first-name false-positives.
  //   'all'    — default: both fields contribute; existing balanced weights apply.
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
  const qn = norm(q)
  const qTokens = qn.split(' ').filter(t => t.length > 1)
  // Sources with dated, structured provenance rank above thin aggregators on ties.
  const sourceRank: Record<SearchResult['source'], number> = {
    aic: 6, met: 5, cleveland: 4, rijks: 3, wikidata: 2, europeana: 1,
  }

  // A whole-word match on the artist field is the strongest signal for a
  // surname query ("Klimt" → works BY Klimt), so weight it near title-exact.
  const wordRe = (t: string) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)

  // Mode-specific multipliers applied to title vs artist score contributions.
  // 'artist': artist signals tripled, title signals halved — surname query.
  // 'title':  title signals doubled, artist signals suppressed — title query.
  // 'all':    equal weight (multiplier = 1) — existing balanced behaviour.
  const titleMult  = searchBy === 'title' ? 2.0 : searchBy === 'artist' ? 0.5 : 1.0
  const artistMult = searchBy === 'artist' ? 3.0 : searchBy === 'title' ? 0.3 : 1.0

  function score(r: SearchResult): number {
    const title = norm(r.title)
    const artist = norm(r.artist)
    const artistKnown = artist.length > 0 && artist !== 'unknown artist'
    let s = 0

    // Title-field contributions (scaled by titleMult)
    if (title === qn) s += 110 * titleMult
    else if (title.startsWith(qn)) s += 70 * titleMult
    else if (title.includes(qn)) s += 45 * titleMult

    // Artist-field contributions (scaled by artistMult)
    if (artistKnown) {
      if (artist === qn) s += 115 * artistMult
      // A work BY the queried artist (surname appears as a word in "Gustav
      // Klimt") beats a work merely TITLED that word by someone else.
      else if (wordRe(qn).test(artist)) s += 115 * artistMult
      else if (artist.includes(qn)) s += 50 * artistMult
    }
    for (const t of qTokens) {
      if (title.includes(t)) s += 10 * titleMult
      if (artistKnown && artist.includes(t)) s += 8 * artistMult
    }
    // A nameless result (common in aggregator junk) is rarely what's wanted.
    if (!artistKnown) s -= 30
    if (r.thumbnail) s += 10
    s += sourceRank[r.source] ?? 0
    // GPI boost: award +15 when the seeded Getty Provenance Index (Knoedler +
    // Goupil) contains verified records for this artist. Offline only — reads
    // from the pre-seeded public/data JSON via hasGpiCoverage(); no network
    // call is made. This is a tiebreaker/booster, never an override.
    if (artistKnown && hasGpiCoverage(r.artist)) s += 15
    return s
  }

  const results: SearchResult[] = [...byKey.values()]
    .map(r => ({ r, s: score(r) }))
    .sort((a, b) => b.s - a.s)
    .map(({ r }) => r)

  const sources: string[] = []
  if (!isRijksQuery && metResult.status === 'fulfilled') sources.push('Metropolitan Museum of Art API')
  if (!isRijksQuery && aicResult.status === 'fulfilled') sources.push('Art Institute of Chicago API')
  if (rijksResult.status === 'fulfilled') sources.push('Rijksmuseum API')
  if (europeanaResult.status === 'fulfilled' && (europeanaResult.value as SearchResult[]).length > 0) sources.push('Europeana API')
  if (wikidataResult.status === 'fulfilled' && (wikidataResult.value as SearchResult[]).length > 0) sources.push('Wikidata')
  if (clevelandResult.status === 'fulfilled' && (clevelandResult.value as SearchResult[]).length > 0) sources.push('Cleveland Museum of Art API')

  const response: SearchResponse = { results, query: q, searchBy, sources }
  await setCached(cacheKey, response, SEARCH_TTL_MS)

  return NextResponse.json(response)
}
