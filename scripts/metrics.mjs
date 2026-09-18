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
import { isCountryLevel } from './lib/cities.mjs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const prov = JSON.parse(readFileSync(join(ROOT, 'src/lib/featured-provenance.json'), 'utf8'))

const extractYear = (d) => { if (!d) return null; const m = String(d).match(/\d{4}/); return m ? parseInt(m[0], 10) : null }
const isATier = (s = '') => /aic|art institute|met(ropolitan)?|rijks|getty|gpi/i.test(s)
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0)

const works = Object.entries(prov)
let custodyEntries = 0, datedStart = 0, ungeocoded = 0, countryLevel = 0, aTier = 0, datelessLeadWorks = 0, deepChains = 0
const perWork = []

for (const [work, raw] of works) {
  const list = Array.isArray(raw) ? raw : []
  const datedN = list.filter(e => e.startDate).length
  custodyEntries += list.length
  datedStart += datedN
  // A missing coordinate is only a DEFECT when the place should have geocoded.
  // A country-level place is unplaced on purpose — pinning it would assert a
  // location the source never gave — so it is counted, not flagged.
  for (const e of list) {
    if (e.lat != null && e.lng != null) continue
    if (isCountryLevel(e.name)) countryLevel++
    else ungeocoded++
  }
  aTier += list.filter(e => isATier(e.source)).length
  // The #43/#48/#52 data signal, restated for the source-order sort (#236). An
  // undated entry is now placed by its position in the source prose, so it is only
  // a defect when NOTHING before it in the source carries a date — then there is
  // no evidence to order it by at all and it really does land last.
  const placedYear = (e) => (e.startDate ? extractYear(e.startDate) : extractYear(e.endDate))
  const noDatedEntry = list.length > 0 && !list.some(e => placedYear(e) != null)
  if (noDatedEntry) datelessLeadWorks++
  if (datedN >= 3) deepChains++
  perWork.push({ work, entries: list.length, datedStart: datedN, noDatedEntry })
}

const snapshot = {
  scope: 'featured custody chains — offline, from src/lib/featured-provenance.json',
  featuredWorks: works.length,
  custodyEntries,
  datedStartCoveragePct: pct(datedStart, custodyEntries),
  aTierEntries: aTier,
  ungeocodedEntries: ungeocoded,
  countryLevelEntries: countryLevel,
  worksWithNoDatedEntry: datelessLeadWorks,
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
line('ungeocoded entries:', `${snapshot.ungeocodedEntries}  (a defect — target 0)`)
line('country-level entries:', `${snapshot.countryLevelEntries}  (unplaced on purpose, not a defect)`)
line('works with no dated entry:', `${snapshot.worksWithNoDatedEntry}/${snapshot.featuredWorks} works  (#43/#48/#52 data signal)`)
line('deep chains (>=3 dated):', `${snapshot.worksWithDeepChain}/${snapshot.featuredWorks} works`)
console.log('Wrote metrics/latest.json')
