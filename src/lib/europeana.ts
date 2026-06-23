/**
 * Europeana API integration — 50M+ objects from 3,000+ European cultural institutions.
 * API key: register at https://apis.europeana.eu/api/apikey to get a free key instantly.
 * Set EUROPEANA_API_KEY in .env.local to activate. Gracefully returns [] when key absent.
 *
 * Honesty contract (same as all sources):
 * - Source label: 'Europeana' (tier B — aggregated; variable quality per provider)
 * - Confidence: 'medium' by default; 'high' when dctermsProvenance has explicit dates
 * - Provenance text is passed to deterministicExtract in the API route — never invented
 */

import type { SearchResult, ArtworkMeta } from './types'

const EUROPEANA_BASE = 'https://api.europeana.eu/record/v2'

function apiKey(): string | null {
  return process.env.EUROPEANA_API_KEY ?? null
}

// ─── Search ──────────────────────────────────────────────────────────────────

interface EuropeanaSearchDoc {
  id: string
  title?: string[]
  dcCreator?: string[]
  year?: string[]
  dataProvider?: string[]
  edmPreview?: string
}

interface EuropeanaSearchResponse {
  success: boolean
  items?: EuropeanaSearchDoc[]
  error?: string
}

export async function searchEuropeana(q: string, limit = 3): Promise<SearchResult[]> {
  const key = apiKey()
  if (!key) return []

  const params = new URLSearchParams({
    wskey: key,
    query: q,
    qf: 'TYPE:IMAGE',
    fl: 'id,title,dcCreator,year,dataProvider,edmPreview',
    rows: String(limit),
    profile: 'minimal',
  })
  const res = await fetch(`${EUROPEANA_BASE}/search.json?${params}`, { next: { revalidate: 0 } })
  if (!res.ok) {
    console.error(`[europeana/search] HTTP ${res.status}`)
    return []
  }
  const json = (await res.json()) as EuropeanaSearchResponse
  if (!json.success || !json.items) return []

  return json.items.map(doc => ({
    id: encodeEuropeanaId(doc.id),
    source: 'europeana' as const,
    title: doc.title?.[0] ?? 'Untitled',
    artist: doc.dcCreator?.[0] ?? 'Unknown artist',
    date: doc.year?.[0] ?? '',
    thumbnail: doc.edmPreview ?? null,
  }))
}

// ─── Record fetch ─────────────────────────────────────────────────────────────

interface EuropeanaProxy {
  dcTitle?: Record<string, string[]>
  dcCreator?: Record<string, string[]>
  dctermsCreated?: Record<string, string[]>
  dctermsProvenance?: Record<string, string[]>
  dcDescription?: Record<string, string[]>
}

interface EuropeanaAggregation {
  edmIsShownBy?: string
  edmPreview?: string
  dataProvider?: string[]
}

interface EuropeanaRecordResponse {
  success: boolean
  object?: {
    about: string
    title?: string[]
    proxies?: EuropeanaProxy[]
    aggregations?: EuropeanaAggregation[]
    europeanaAggregation?: { edmPreview?: string; edmCountry?: string[] }
  }
  error?: string
}

export async function fetchEuropeana(rawId: string): Promise<{ meta: ArtworkMeta; provenance: string }> {
  const key = apiKey()
  if (!key) throw new Error('Europeana API key not configured (set EUROPEANA_API_KEY)')

  const europeanaPath = decodeEuropeanaId(rawId)
  const params = new URLSearchParams({ wskey: key, profile: 'full' })
  const res = await fetch(`${EUROPEANA_BASE}${europeanaPath}.json?${params}`, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Europeana record HTTP ${res.status}`)
  const json = (await res.json()) as EuropeanaRecordResponse
  if (!json.success || !json.object) throw new Error('Europeana record not found')

  const obj = json.object
  const proxy = obj.proxies?.[0]
  const agg = obj.aggregations?.[0]

  const title = obj.title?.[0] ?? firstValue(proxy?.dcTitle) ?? 'Untitled'
  const artist = firstValue(proxy?.dcCreator) ?? 'Unknown artist'
  const date = firstValue(proxy?.dctermsCreated) ?? ''
  const thumbnail = obj.europeanaAggregation?.edmPreview ?? agg?.edmIsShownBy ?? null
  const provenanceLines = allValues(proxy?.dctermsProvenance)
  const descLines = allValues(proxy?.dcDescription)
  // Prefer dedicated provenance field; fall back to description prose
  const provenance = provenanceLines.length ? provenanceLines.join('; ') : descLines.join('; ')

  return {
    meta: {
      id: `europeana-${rawId}`,
      source: 'europeana' as const,
      title,
      artist,
      date,
      thumbnail,
      geoLocation: obj.europeanaAggregation?.edmCountry?.[0] ?? agg?.dataProvider?.[0] ?? null,
    },
    provenance,
  }
}

// ─── ID encoding ──────────────────────────────────────────────────────────────
// Europeana record IDs look like "/9200338/BibliographicResource_3000096299271".
// We encode as "9200338~BibliographicResource_3000096299271" to avoid ambiguity
// with the hyphen-based "source-rawId" convention in SearchResult.id.

function encodeEuropeanaId(europeanaId: string): string {
  // Strip leading slash, replace first "/" with "~"
  const stripped = europeanaId.replace(/^\//, '')
  const firstSlash = stripped.indexOf('/')
  if (firstSlash === -1) return `europeana-${stripped}`
  const collection = stripped.slice(0, firstSlash)
  const localId = stripped.slice(firstSlash + 1)
  return `europeana-${collection}~${localId}`
}

export function decodeEuropeanaId(rawId: string): string {
  // rawId = "9200338~BibliographicResource_..." → "/9200338/BibliographicResource_..."
  const tilde = rawId.indexOf('~')
  if (tilde === -1) return `/${rawId}`
  return `/${rawId.slice(0, tilde)}/${rawId.slice(tilde + 1)}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstValue(map?: Record<string, string[]>): string | null {
  if (!map) return null
  const vals = Object.values(map).flat()
  return vals[0] ?? null
}

function allValues(map?: Record<string, string[]>): string[] {
  if (!map) return []
  return Object.values(map).flat()
}
