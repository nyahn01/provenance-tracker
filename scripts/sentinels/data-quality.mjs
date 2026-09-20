/**
 * data-quality sentinel — the mechanical core of .claude/agents/data-quality-sentinel.md.
 *
 * Read-only scan of the featured custody chains for the recurring decay classes
 * (#43/#48/#52): null/0,0 coordinates, trailing dateless custody, and thin dating.
 * Pure + offline so it is unit-testable and CI-safe — no network, no API spend.
 *
 * Returns a list of clustered findings (by root cause, not by work). The
 * orchestrator turns each finding into ONE idempotent `proposal` issue.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isCountryLevel } from '../lib/cities.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const extractYear = (d) => { if (!d) return null; const m = String(d).match(/\d{4}/); return m ? parseInt(m[0], 10) : null }

/**
 * @param {Record<string, Array<{name?:string,institution?:string,lat:number|null,lng:number|null,startDate:string|null}>>} prov
 * @returns {Array<{id:string,label:'proposal',title:string,body:string}>}
 */
export function scanDataQuality(prov) {
  const works = Object.entries(prov).map(([work, raw]) => [work, Array.isArray(raw) ? raw : []])
  const findings = []

  // 1. Coordinates we failed to resolve for a place that should have resolved.
  //    A country-level place (AIC prose sometimes names only a country) carries no
  //    coordinate ON PURPOSE — pinning a national centroid would assert a location
  //    the source never gave. Flagging it would pressure a future fix to fake one,
  //    so it is excluded here and counted separately by `npm run metrics`.
  const nullCoord = []
  for (const [work, list] of works) {
    for (const e of list) {
      const missing = e.lat == null || e.lng == null || e.lat === 0 || e.lng === 0
      if (missing && !isCountryLevel(e.name)) {
        nullCoord.push({ work, where: e.institution || e.name || '(unnamed)' })
      }
    }
  }
  if (nullCoord.length) {
    findings.push({
      id: 'data-quality-null-coordinates',
      label: 'proposal',
      signal: { entries: nullCoord.length },
      title: '[sentinel] data-quality: custody nodes with no coordinates',
      body: cluster(
        `${nullCoord.length} custody entr${nullCoord.length === 1 ? 'y has' : 'ies have'} null/0,0 coordinates and cannot be placed on the globe.`,
        nullCoord.map(n => `${n.work} — ${n.where}`),
        'Likely a missing gazetteer entry in `src/lib/geocode.ts`. Suggested: `agent:provenance-data`.',
      ),
    })
  }

  // 2. A chain with NO dated entry anywhere. The app orders an undated holder by its
  //    position in the source prose (#236), so a dateless row is no longer misplaced
  //    on its own — the source sequence still places it. What remains a real defect
  //    is a chain carrying no date at all: nothing to anchor the sequence to, so the
  //    whole chain is unorderable and its "when" is unknown.
  const placed = (e) => (e.startDate ? extractYear(e.startDate) : extractYear(e.endDate))
  const undatable = []
  for (const [work, list] of works) {
    if (!list.length) continue
    if (!list.some(e => placed(e) != null)) {
      undatable.push({ work, where: `${list.length} entr${list.length === 1 ? 'y' : 'ies'}, none dated` })
    }
  }
  if (undatable.length) {
    findings.push({
      id: 'data-quality-undatable-chain',
      label: 'proposal',
      signal: { works: undatable.length },
      title: '[sentinel] data-quality: custody chains with no dated entry',
      body: cluster(
        `${undatable.length} work(s) carry no date on any custody entry, so the chain cannot be anchored in time.`,
        undatable.map(t => `${t.work} — ${t.where}`),
        'Recover years from the source prose, or drop the work from featured. Suggested: `agent:provenance-data`.',
      ),
    })
  }

  return findings
}

function cluster(summary, examples, suggestion) {
  const shown = examples.slice(0, 5).map(e => `- ${e}`).join('\n')
  const more = examples.length > 5 ? `\n- …and ${examples.length - 5} more` : ''
  return `${summary}\n\n**Examples**\n${shown}${more}\n\n${suggestion}\n\n_Filed by the data-quality sentinel (read-only). A human promotes \`proposal\` → \`priority\`._`
}

/** Convenience: scan the committed featured-provenance.json. */
export function scanFeatured() {
  const prov = JSON.parse(readFileSync(join(ROOT, 'src/lib/featured-provenance.json'), 'utf8'))
  return scanDataQuality(prov)
}
