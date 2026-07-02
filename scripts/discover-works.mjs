/**
 * Candidate discovery for the STORM curation pipeline (ADR 0003, issue #147).
 *
 * Enumerates AIC public-domain PAINTINGS with provenance prose and an image,
 * scores each by data richness, excludes the already-featured works, and
 * prints a ranked list — the queue that drives `curate.mjs --batch` toward
 * the 25-works product gate (BUSINESS_CASE.md §10).
 *
 * Honesty notes: scoring reads only what the AIC API returns — nothing is
 * inferred or invented. `is_public_domain` is re-checked client-side
 * (belt-and-braces) because featuring a copyrighted image is a hard no.
 * If the API is unreachable, the script fails loudly — it never fakes results.
 *
 * Usage:
 *   node scripts/discover-works.mjs             # top 25, table to stdout
 *   node scripts/discover-works.mjs 10          # top 10
 *   node scripts/discover-works.mjs 25 --json   # also write vault/agents/drafts/candidates.json (gitignored)
 *   node scripts/discover-works.mjs --pages 5   # scan fewer search pages (default 10 → ≤1,000 works)
 */

import { writeFile, mkdir } from 'fs/promises'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { gatherGetty, loadGetty } from './curate.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')

const SEARCH_URL = 'https://api.artic.edu/api/v1/artworks/search'
const FIELDS = ['id', 'title', 'artist_display', 'date_start', 'is_public_domain', 'image_id', 'provenance_text', 'exhibition_history']
const PAGE_LIMIT = 100 // AIC max per page; deep pagination caps accessible results at 1,000

/**
 * Score one AIC search hit by curation value. Deterministic; the breakdown is
 * printed so a human can see WHY a work ranks where it does.
 *  - prose:  provenance_text length (the raw material) ........... ≤40
 *  - years:  distinct 4-digit years in the prose (chain depth) ... ≤20
 *  - getty:  same-title ×3 + artist-context GPI records .......... ≤20
 *  - exh:    has exhibition_history (loan dimension exists) ...... +10
 *  - image:  has an image_id (hero image is findable) ............ +10
 */
export function scoreCandidate(work, gettyRecords) {
  const prose = (work.provenance_text ?? '').trim()
  const proseScore = Math.round(Math.min(prose.length, 2000) / 2000 * 40)
  const years = new Set(prose.match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/g) ?? [])
  const yearScore = Math.min(years.size, 10) * 2
  const artist = (work.artist_display ?? '').split(/\n|,/)[0].trim()
  const { sameWork, context } = artist
    ? gatherGetty(gettyRecords, artist, work.title ?? '')
    : { sameWork: [], context: [] }
  const gettyScore = Math.min(sameWork.length * 3 + context.length, 20)
  const exhScore = (work.exhibition_history ?? '').trim() ? 10 : 0
  const imageScore = work.image_id ? 10 : 0
  return {
    score: proseScore + yearScore + gettyScore + exhScore + imageScore,
    breakdown: { prose: proseScore, years: yearScore, getty: gettyScore, exhibitions: exhScore, image: imageScore },
    proseChars: prose.length,
    distinctYears: years.size,
    gettySameWork: sameWork.length,
    gettyContext: context.length,
  }
}

/** Filter, score, and rank search hits; already-featured ids are excluded. */
export function rankCandidates(works, gettyRecords, featuredIds) {
  const out = []
  for (const w of works) {
    if (!w || !w.is_public_domain) continue // hard rule: never feature a copyrighted image
    if (featuredIds.has(String(w.id))) continue
    if (!(w.provenance_text ?? '').trim()) continue
    const artist = (w.artist_display ?? '').split(/\n|,/)[0].trim()
    out.push({
      id: String(w.id),
      title: (w.title ?? '').trim(),
      artist,
      year: Number.isFinite(w.date_start) && w.date_start > 0 ? w.date_start : null,
      hasImage: !!w.image_id,
      hasExhibitions: !!(w.exhibition_history ?? '').trim(),
      ...scoreCandidate(w, gettyRecords),
    })
  }
  return out.sort((a, b) => b.score - a.score)
}

/** Ids already committed as featured — read from the one registry a .mjs script can parse. */
function featuredIds() {
  const json = JSON.parse(readFileSync(join(ROOT, 'src', 'lib', 'featured-provenance.json'), 'utf8'))
  return new Set(Object.keys(json).map(k => k.replace(/^aic:/, '')))
}

async function fetchSearchPage(page) {
  // Elasticsearch bool query via POST — the GET equivalent bracket-encodes
  // nested arrays (query[bool][must][][term][is_public_domain]=true&…) and is
  // kept here only as documentation should POST ever be rejected.
  const body = {
    query: {
      bool: {
        must: [
          { term: { is_public_domain: true } },
          { exists: { field: 'provenance_text' } },
          { exists: { field: 'image_id' } },
          { term: { artwork_type_id: 1 } }, // Painting — the proven tier-A path
        ],
      },
    },
    fields: FIELDS,
    limit: PAGE_LIMIT,
    page,
  }
  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'provenance-tracker/discover (+https://github.com/nyahn01/provenance-tracker)',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`AIC search failed: HTTP ${res.status} (page ${page})`)
  const json = await res.json()
  return json.data ?? []
}

/** Full discovery pass: fetch pages, rank, return candidates (used by --batch). */
export async function discoverCandidates({ pages = 10 } = {}) {
  const getty = loadGetty()
  const featured = featuredIds()
  const hits = []
  for (let page = 1; page <= pages; page++) {
    const data = await fetchSearchPage(page)
    hits.push(...data)
    if (data.length < PAGE_LIMIT) break // last page
    await new Promise(res => setTimeout(res, 1100)) // AIC asks ≤60 req/min
  }
  return rankCandidates(hits, getty, featured)
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  const n = Number(args.find(a => /^\d+$/.test(a)) ?? 25)
  const pagesArg = args.indexOf('--pages')
  const pages = pagesArg >= 0 ? Number(args[pagesArg + 1]) || 10 : 10
  const asJson = args.includes('--json')

  console.log(`[discover] AIC public-domain paintings with provenance prose (≤${pages * PAGE_LIMIT} scanned)…`)
  let candidates
  try {
    candidates = await discoverCandidates({ pages })
  } catch (err) {
    console.error(`[discover] ${err.message}`)
    console.error('AIC is unreachable from this environment — no results (results are never faked). Retry from a network that can reach api.artic.edu.')
    process.exit(1)
  }

  const top = candidates.slice(0, n)
  console.log(`\n rank  work        score  prose  yrs  getty S/C  exh  title — artist`)
  top.forEach((c, i) => {
    console.log(
      `  ${String(i + 1).padStart(2)}   aic:${c.id.padEnd(7)} ${String(c.score).padStart(4)}  ${String(c.proseChars).padStart(5)}  ${String(c.distinctYears).padStart(3)}  ${String(c.gettySameWork).padStart(4)}/${String(c.gettyContext).padEnd(3)}  ${c.hasExhibitions ? ' ✓ ' : '   '}  ${c.title.slice(0, 48)} — ${c.artist}`,
    )
  })
  console.log(`\n${candidates.length} candidate(s) total. Next: node scripts/curate.mjs aic:<id> (or --batch N).`)

  if (asJson) {
    const outDir = join(ROOT, 'vault', 'agents', 'drafts')
    await mkdir(outDir, { recursive: true })
    const outPath = join(outDir, 'candidates.json')
    await writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), pagesScanned: pages, candidates }, null, 2) + '\n', 'utf8')
    console.log(`wrote ${outPath.replace(ROOT, '.')} (gitignored draft)`)
  }
}

// CLI guard — importing this module (tests, curate --batch) must not fetch.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => { console.error(e); process.exit(1) })
}
