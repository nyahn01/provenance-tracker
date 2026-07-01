#!/usr/bin/env node
/**
 * metrics.mjs — the measurement step of the Act+Outcome loop (ADR 0002).
 *
 * Computes a deterministic, OFFLINE snapshot of featured custody-chain health
 * from src/lib/featured-provenance.json — no network, no API spend, CI-safe.
 * Prints a human summary and overwrites metrics/latest.json (a SINGLE snapshot,
 * not a dated file, per CLAUDE.md "one fact, one home"). The `retro` agent reads
 * this snapshot + recent merges to write lessons into docs/INSIGHTS.md.
 *
 * Scope is honest: this measures the pre-parsed custody chains only. Getty/RKD/
 * exhibition coverage is runtime data, and honesty-gate status is `npm run
 * honesty:full` — both are measured elsewhere, not invented here.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const prov = JSON.parse(readFileSync(join(ROOT, 'src/lib/featured-provenance.json'), 'utf8'))

// Mirror the app's timeline sort: a missing start date buckets to 9999 (sorts last).
const extractYear = (d) => { if (!d) return 9999; const m = String(d).match(/\d{4}/); return m ? parseInt(m[0], 10) : 9999 }
const isATier = (s = '') => /aic|art institute|met(ropolitan)?|rijks|getty|gpi/i.test(s)
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0)

const works = Object.entries(prov)
let custodyEntries = 0, datedStart = 0, nullCoord = 0, aTier = 0, datelessLeadWorks = 0, deepChains = 0
const perWork = []

for (const [work, raw] of works) {
  const list = Array.isArray(raw) ? raw : []
  const datedN = list.filter(e => e.startDate).length
  custodyEntries += list.length
  datedStart += datedN
  nullCoord += list.filter(e => e.lat == null || e.lng == null).length
  aTier += list.filter(e => isATier(e.source)).length
  // The #43/#48/#52 data signal: after the app's sort (which falls back to an entry's
  // endDate when it has no startDate), would a truly UNPLACEABLE custody entry — one
  // with neither a start nor an end date — land at the chronological end?
  const placedYear = (e) => (e.startDate ? extractYear(e.startDate) : (e.endDate ? extractYear(e.endDate) : 9999))
  const sorted = [...list].sort((a, b) => placedYear(a) - placedYear(b))
  const lastEntry = sorted[sorted.length - 1]
  const trailingDateless = !!lastEntry && !lastEntry.startDate && !lastEntry.endDate
  if (trailingDateless) datelessLeadWorks++
  if (datedN >= 3) deepChains++
  perWork.push({ work, entries: list.length, datedStart: datedN, trailingDatelessCustody: trailingDateless })
}

const snapshot = {
  scope: 'featured custody chains — offline, from src/lib/featured-provenance.json',
  featuredWorks: works.length,
  custodyEntries,
  datedStartCoveragePct: pct(datedStart, custodyEntries),
  aTierEntries: aTier,
  nullCoordinateEntries: nullCoord,
  worksWithTrailingDatelessCustody: datelessLeadWorks,
  worksWithDeepChain: deepChains,
  perWork,
  measuredElsewhere: 'Getty/RKD/exhibition coverage (runtime) and honesty-gate status (npm run honesty:full).',
}

mkdirSync(join(ROOT, 'metrics'), { recursive: true })
writeFileSync(join(ROOT, 'metrics/latest.json'), JSON.stringify(snapshot, null, 2) + '\n')

const line = (label, val) => console.log('  ' + label.padEnd(34) + val)
console.log('Platform health — featured custody chains')
line('works:', snapshot.featuredWorks)
line('custody entries:', snapshot.custodyEntries)
line('dated-start coverage:', snapshot.datedStartCoveragePct + '%')
line('A-tier entries:', snapshot.aTierEntries)
line('null-coordinate entries:', snapshot.nullCoordinateEntries)
line('trailing dateless custody:', `${snapshot.worksWithTrailingDatelessCustody}/${snapshot.featuredWorks} works  (#43/#48/#52 data signal)`)
line('deep chains (>=3 dated):', `${snapshot.worksWithDeepChain}/${snapshot.featuredWorks} works`)
console.log('Wrote metrics/latest.json')
