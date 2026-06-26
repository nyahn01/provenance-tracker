/**
 * Wikidata search adapter — closes the biggest coverage gap.
 *
 * The museum APIs (Met/AIC/Rijks) only hold their own collections, so famous
 * artists held elsewhere (e.g. Gustav Klimt at the Belvedere) return nothing.
 * Wikidata indexes paintings across all institutions and carries a Wikimedia
 * Commons image (P18), so this adapter makes those works searchable WITH a
 * thumbnail.
 *
 * Two-step (fast + reliable on the public endpoint):
 *   1. wbsearchentities REST call resolves the query term to a few candidate
 *      entity ids (~200ms).
 *   2. one lean SPARQL returns paintings (direct P31 = painting, no subclass
 *      walk) that are EITHER a matched entity (title query) OR created by a
 *      matched entity (artist query), each with an image.
 *
 * Honest by construction — only real Wikidata items are returned, each carrying
 * source 'wikidata'.
 */
import type { SearchResult } from './types'

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql'
const UA = 'ProvenanceTracker/1.0 (https://github.com/nyahn01/provenance-tracker)'
const PAINTING = 'wd:Q3305213'

interface SparqlBinding {
  painting?: { value: string }
  title?: { value: string }
  creatorLabel?: { value: string }
  image?: { value: string }
  date?: { value: string }
}

function qid(uri: string): string {
  return uri.slice(uri.lastIndexOf('/') + 1)
}

/** Commons FilePath URL → sized thumbnail (FilePath honours a width param).
 *  Wikimedia SPARQL returns http:// URLs; force https:// to prevent mixed-content
 *  blocking on HTTPS pages (Vercel production blocks HTTP media). */
function thumb(imageUrl: string, width = 220): string {
  const secure = imageUrl.replace(/^http:\/\//, 'https://')
  return secure.includes('?') ? secure : `${secure}?width=${width}`
}

async function resolveEntities(q: string, signal: AbortSignal): Promise<string[]> {
  const url =
    `https://www.wikidata.org/w/api.php?action=wbsearchentities` +
    `&search=${encodeURIComponent(q)}&language=en&type=item&format=json&limit=5&origin=*`
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal, next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`wbsearchentities HTTP ${res.status}`)
  const json = (await res.json()) as { search?: { id: string }[] }
  return (json.search ?? []).map(s => s.id).filter(Boolean).slice(0, 5)
}

// NOTE: manual rdfs:label, NOT SERVICE wikibase:label — the label service
// hangs the public endpoint on these patterns (verified 25s timeout vs ~500ms).
// Two lean queries run in parallel instead of one UNION (the `BIND(?match AS
// ?painting)` UNION blew up to 30s; these direct-bind shapes are ~500ms each):

// Artist query: paintings CREATED BY a matched entity (the famous-artist case).
function buildCreatorQuery(ids: string[]): string {
  const values = ids.map(id => `wd:${id}`).join(' ')
  return `
SELECT DISTINCT ?painting ?title ?creatorLabel ?image ?date WHERE {
  VALUES ?creatorE { ${values} }
  ?painting wdt:P170 ?creatorE ; wdt:P31 ${PAINTING} ; wdt:P18 ?image ; rdfs:label ?title .
  FILTER(LANG(?title) = "en")
  ?creatorE rdfs:label ?creatorLabel . FILTER(LANG(?creatorLabel) = "en")
  OPTIONAL { ?painting wdt:P571 ?dateRaw . BIND(YEAR(?dateRaw) AS ?date) }
}
LIMIT 12`
}

// Title query: matched entities that ARE paintings (the exact-title case).
function buildPaintingQuery(ids: string[]): string {
  const values = ids.map(id => `wd:${id}`).join(' ')
  return `
SELECT DISTINCT ?painting ?title ?creatorLabel ?image ?date WHERE {
  VALUES ?painting { ${values} }
  ?painting wdt:P31 ${PAINTING} ; wdt:P18 ?image ; rdfs:label ?title .
  FILTER(LANG(?title) = "en")
  OPTIONAL { ?painting wdt:P170 ?creatorE . ?creatorE rdfs:label ?creatorLabel . FILTER(LANG(?creatorLabel) = "en") }
  OPTIONAL { ?painting wdt:P571 ?dateRaw . BIND(YEAR(?dateRaw) AS ?date) }
}
LIMIT 12`
}

async function runSparql(query: string, signal: AbortSignal): Promise<SparqlBinding[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' },
    signal,
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Wikidata SPARQL HTTP ${res.status}`)
  const json = (await res.json()) as { results?: { bindings?: SparqlBinding[] } }
  return json.results?.bindings ?? []
}

export async function searchWikidata(q: string, limit = 4): Promise<SearchResult[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 9000)
  try {
    const ids = await resolveEntities(q, controller.signal)
    if (ids.length === 0) return []

    // Title matches (matched entity IS a painting) ranked before artist matches.
    const [byPainting, byCreator] = await Promise.all([
      runSparql(buildPaintingQuery(ids), controller.signal),
      runSparql(buildCreatorQuery(ids), controller.signal),
    ])
    const bindings = [...byPainting, ...byCreator]

    const seen = new Set<string>()
    const out: SearchResult[] = []
    for (const b of bindings) {
      if (!b.painting?.value || !b.image?.value) continue
      const id = qid(b.painting.value)
      if (seen.has(id)) continue
      seen.add(id)
      out.push({
        id: `wikidata-${id}`,
        source: 'wikidata',
        title: b.title?.value || 'Untitled',
        artist: b.creatorLabel?.value || 'Unknown artist',
        date: b.date?.value ? String(b.date.value) : '',
        thumbnail: thumb(b.image.value),
      })
      if (out.length >= limit) break
    }
    return out
  } catch (err) {
    console.error('[wikidata-search]', err)
    return []
  } finally {
    clearTimeout(timer)
  }
}
