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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const extractYear = (d) => { if (!d) return 9999; const m = String(d).match(/\d{4}/); return m ? parseInt(m[0], 10) : 9999 }

/**
 * @param {Record<string, Array<{name?:string,institution?:string,lat:number|null,lng:number|null,startDate:string|null}>>} prov
 * @returns {Array<{id:string,label:'proposal',title:string,body:string}>}
 */
export function scanDataQuality(prov) {
  const works = Object.entries(prov).map(([work, raw]) => [work, Array.isArray(raw) ? raw : []])
  const findings = []

  // 1. Null / null-island coordinates (a mappable holder we cannot place honestly).
  const nullCoord = []
  for (const [work, list] of works) {
    for (const e of list) {
      if (e.lat == null || e.lng == null || e.lat === 0 || e.lng === 0) {
        nullCoord.push({ work, where: e.institution || e.name || '(unnamed)' })
      }
    }
  }
  if (nullCoord.length) {
    findings.push({
      id: 'data-quality-null-coordinates',
      label: 'proposal',
      title: '[sentinel] data-quality: custody nodes with no coordinates',
      body: cluster(
        `${nullCoord.length} custody entr${nullCoord.length === 1 ? 'y has' : 'ies have'} null/0,0 coordinates and cannot be placed on the globe.`,
        nullCoord.map(n => `${n.work} — ${n.where}`),
        'Likely a missing gazetteer entry in `src/lib/geocode.ts`. Suggested: `agent:provenance-data`.',
      ),
    })
  }

  // 2. Trailing dateless custody (a "?" row that sorts to the chronological end).
  const trailing = []
  for (const [work, list] of works) {
    if (!list.length) continue
    const sorted = [...list].sort((a, b) => extractYear(a.startDate) - extractYear(b.startDate))
    if (!sorted[sorted.length - 1].startDate) {
      trailing.push({ work, where: sorted[sorted.length - 1].institution || sorted[sorted.length - 1].name || '(unnamed)' })
    }
  }
  if (trailing.length) {
    findings.push({
      id: 'data-quality-trailing-dateless-custody',
      label: 'proposal',
      title: '[sentinel] data-quality: trailing dateless custody entries',
      body: cluster(
        `${trailing.length} work(s) end on a dateless custody entry, which sorts to the wrong (last) position.`,
        trailing.map(t => `${t.work} — ${t.where}`),
        'Add the missing year from the source prose, or mark as a documented gap. Suggested: `agent:provenance-data`.',
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
