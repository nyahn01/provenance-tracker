/**
 * Cleveland Museum of Art — Open Access API adapter.
 *
 * Free, no key. Adds coverage + thumbnails, and crucially carries a STRUCTURED,
 * DATED provenance array (owner descriptions with date ranges) — richer than the
 * prose most museums expose. We join that array into provenance text and feed it
 * through the existing custody-chain extractor, which also drives the WWII-gap
 * detection (the dated chain does the work a separate Nazi-era flag would).
 *
 * Docs: https://openaccess-api.clevelandart.org/
 */
import type { SearchResult, ArtworkMeta } from './types'

const BASE = 'https://openaccess-api.clevelandart.org/api/artworks'
const UA = 'ProvenanceTracker/1.0 (https://github.com/nyahn01/provenance-tracker)'

interface ClevelandCreator { description?: string; role?: string }
interface ClevelandProvenance { description?: string; date?: string }
interface ClevelandArtwork {
  id: number
  title?: string
  creation_date?: string
  creators?: ClevelandCreator[]
  images?: { web?: { url?: string } }
  provenance?: ClevelandProvenance[]
}

/** "Claude Monet (French, 1840–1926)" → "Claude Monet" */
function cleanArtist(creators?: ClevelandCreator[]): string {
  const d = creators?.find(c => c.role === 'artist')?.description ?? creators?.[0]?.description
  return d ? d.replace(/\s*\(.*?\)\s*$/, '').trim() : 'Unknown artist'
}

export async function searchCleveland(q: string, limit = 3): Promise<SearchResult[]> {
  const url =
    `${BASE}/?q=${encodeURIComponent(q)}&has_image=1&limit=${limit}` +
    `&fields=id,title,creators,creation_date,images`
  const res = await fetch(url, { headers: { 'User-Agent': UA }, next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Cleveland search HTTP ${res.status}`)
  const json = (await res.json()) as { data?: ClevelandArtwork[] }
  return (json.data ?? []).map(a => ({
    id: `cleveland-${a.id}`,
    source: 'cleveland' as const,
    title: a.title || 'Untitled',
    artist: cleanArtist(a.creators),
    date: a.creation_date || '',
    thumbnail: a.images?.web?.url ?? null,
  }))
}

/** Detail for the provenance route: meta + provenance text (no separate loans field). */
export async function fetchClevelandDetail(
  id: string,
): Promise<{ meta: ArtworkMeta; provenance: string; exhibitions: string }> {
  const url = `${BASE}/${encodeURIComponent(id)}?fields=id,title,creators,creation_date,images,provenance`
  const res = await fetch(url, { headers: { 'User-Agent': UA }, next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Cleveland detail HTTP ${res.status}`)
  const a = ((await res.json()) as { data?: ClevelandArtwork }).data
  if (!a) throw new Error(`Cleveland artwork ${id} not found`)

  // Lead each clause with the custody date so the year extractor reads the
  // transfer year (not a person's lifespan in the description). Verbatim text —
  // never paraphrased or invented.
  const provenance = (a.provenance ?? [])
    .map(p => (p.date ? `${p.date}: ${p.description ?? ''}` : (p.description ?? '')))
    .filter(s => s.trim().length > 0)
    .join('; ')

  return {
    meta: {
      id: `cleveland-${a.id}`,
      source: 'cleveland',
      title: a.title || 'Untitled',
      artist: cleanArtist(a.creators),
      date: a.creation_date || '',
      thumbnail: a.images?.web?.url ?? null,
      geoLocation: null,
    },
    provenance,
    exhibitions: '',
  }
}
