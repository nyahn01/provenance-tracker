/**
 * STORM-style curation pipeline (ADR 0003).
 *
 * Turns ONE candidate work into a reviewable, fully-sourced DRAFT:
 *   1. Retrieve   — AIC provenance prose + Getty GPI dealer records.
 *   2. Question   — the three perspective agents (scholarship / risk / market)
 *                   ask questions grounded only in the retrieved text.
 *   3. Reconcile  — merge per-source fragments and SURFACE conflicts. When two
 *                   sources disagree on a date for the same work, the conflict is
 *                   recorded as a visible gap — NEVER collapsed to a fabricated
 *                   "consensus" value.
 *   4. Draft      — write a LocationEntry[] chain (shape of featured-provenance.json)
 *                   plus a cited vault essay.
 *
 * Output is a PROPOSAL for human review — it is written to a gitignored drafts
 * dir and never auto-merged into the committed data (per ADR 0002: autonomy is a
 * dial on initiation, never veto).
 *
 * Usage:
 *   node scripts/curate.mjs aic:16568            # curate one work → vault/agents/drafts/
 *   node scripts/curate.mjs aic:16568 --stdout   # print the chain JSON only, write nothing
 *   node scripts/curate.mjs aic:16568 --dry-run  # run + summarise, write nothing
 *   node scripts/curate.mjs --batch 5            # discover → draft the top 5 new candidates
 *   node scripts/curate.mjs --selftest           # prove the conflict detector (offline)
 *
 * Every draft is checked by the Stage-5 gate (validateChain, ADR 0003 §5) —
 * shape, chronology, no null-island coords, ≥2 mapped entries. Batch mode
 * NEVER promotes; promotion is per-work via scripts/promote-work.mjs.
 *
 * Reuses the extraction prompt, geocoder, and artist-origin fix from
 * scripts/preparse-provenance.mjs / src/app/api/provenance/route.ts.
 * Claude (claude-haiku-4-5) is used when ANTHROPIC_API_KEY is set; otherwise a
 * deterministic prose miner runs so the pipeline still works offline.
 */

import Anthropic from '@anthropic-ai/sdk'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { geocodeKey } from './lib/cities.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')
const MODEL = 'claude-haiku-4-5-20251001'

// ─── Load .env.local (mirrors preparse-provenance.mjs) ───────────────────────
async function loadEnv() {
  try {
    const raw = await readFile(join(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (key && val) process.env[key] = val
    }
  } catch { /* .env.local optional */ }
}

// ─── Geocoder (shared gazetteer — scripts/lib/cities.mjs) ────────────────────
export function geocode(place) {
  const hit = geocodeKey(place)
  return hit ? { name: hit.key, lat: hit.lat, lng: hit.lng } : null
}

/** Loose name match (case/punctuation-insensitive) — mirrors sameName in timeline.ts. */
export function sameName(a, b) {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const na = norm(a), nb = norm(b)
  if (na.length < 4 || nb.length < 4) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

/** When a holder is the artwork's own artist and lacks a startDate, use the creation
 *  year. Never invents a date when the creation year is unknown. Mirrors route.ts. */
export function applyArtistOriginFix(entries, artist, creationYear) {
  return entries.map(e => {
    if (e.startDate != null) return e
    const holder = e.institution ?? e.name
    if (sameName(holder, artist) && creationYear != null) return { ...e, startDate: String(creationYear) }
    return e
  })
}

// ─── 1. Retrieve ─────────────────────────────────────────────────────────────
async function fetchAic(id) {
  const res = await fetch(
    `https://api.artic.edu/api/v1/artworks/${id}?fields=id,title,artist_display,date_start,provenance_text`,
    { headers: { 'User-Agent': 'provenance-tracker/curate (+https://github.com/nyahn01/provenance-tracker)' } },
  )
  if (!res.ok) throw new Error(`AIC fetch failed: ${res.status}`)
  const { data } = await res.json()
  const artist = (data?.artist_display ?? '').split(/\n|,/)[0].trim() || 'Unknown'
  return {
    id: String(data?.id ?? id),
    title: (data?.title ?? '').trim(),
    artist,
    creationYear: Number.isFinite(data?.date_start) && data.date_start > 0 ? data.date_start : null,
    prose: (data?.provenance_text ?? '').trim(),
  }
}

/** Getty GPI dealer records (Knoedler + Goupil), loaded from the seeded JSON. */
export function loadGetty() {
  const out = []
  for (const f of ['getty-knoedler.json', 'getty-goupil.json']) {
    try { out.push(...JSON.parse(readFileSync(join(ROOT, 'public', 'data', f), 'utf8'))) } catch { /* seed optional */ }
  }
  return out
}

function artistLastName(display) {
  const stripped = display.replace(/\s*\(.*?\)\s*/g, '').trim()
  const parts = stripped.split(/\s+/)
  return (parts[parts.length - 1] || '').toUpperCase()
}

/** Split Getty matches into same-work candidates (title matches) vs. artist-only
 *  market context. Only same-work candidates are eligible to raise a conflict —
 *  an artist's *other* paintings are never claimed as this work's custody. */
export function gatherGetty(records, artist, title) {
  const last = artistLastName(artist)
  if (!last) return { sameWork: [], context: [] }
  const byArtist = records.filter(r => r.artist && r.artist.split(',')[0].trim().toUpperCase() === last)
  const words = title.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 4)
  const sameWork = [], context = []
  for (const r of byArtist) {
    const rt = (r.title ?? '').toLowerCase()
    if (words.length && words.some(w => rt.includes(w))) sameWork.push(r)
    else context.push(r)
  }
  return { sameWork, context }
}

// ─── 2. Question (perspectives) ──────────────────────────────────────────────
const PERSPECTIVES = [
  { key: 'scholarship', agent: 'art-historian', lens: 'source credibility and corroboration' },
  { key: 'risk', agent: 'art-insurance-advisor', lens: 'title/transit risk implied by gaps' },
  { key: 'market', agent: 'provenance-strategy', lens: 'market trajectory and dealer evidence' },
]

/** Deterministic, grounded questions — reference the actual holders/places/gaps
 *  found, not generic prompts. Used when Claude is unavailable. */
function deterministicQuestions(meta, chain, getty) {
  const holders = chain.map(e => e.institution || e.name).filter(Boolean)
  const firstDealer = holders.find(h => !sameName(h, meta.artist)) || holders[0] || 'the first holder'
  const gap = chainGaps(chain)[0]
  const gettyN = getty.sameWork.length + getty.context.length
  return {
    scholarship: [
      `AIC prose names ${holders.length} successive holders (${holders.slice(0, 3).join(', ')}…). Do Getty/Knoedler stock books or a catalogue raisonné independently corroborate the ${firstDealer} transaction?`,
      `Which entries rest on a single AIC source and would be strengthened by a second tier-A citation?`,
    ],
    risk: [
      gap
        ? `No custody is documented for ${gap.from ?? '?'}–${gap.to ?? '?'}. What title/transit exposure does that undocumented span imply?`
        : `The chain has no undocumented span — which transfer is least firmly dated and most exposed to a title dispute?`,
      `Which cross-Atlantic move in this chain carried the most transit risk for its period?`,
    ],
    market: [
      gettyN
        ? `Getty GPI holds ${gettyN} ${meta.artist} dealer record(s). What do their prices say about the artist's market trajectory around this work's sale?`
        : `No Getty dealer record matches this artist — what other market source could date the first sale?`,
      `Does the dealer chain (${firstDealer}) reflect the period's dominant Paris→US pipeline?`,
    ],
  }
}

async function claudeQuestions(client, meta, chain, getty) {
  const holders = chain.map(e => `${e.institution || e.name} (${e.startDate ?? '?'}–${e.endDate ?? '?'})`).join('; ')
  const prompt = `You are three provenance analysts examining one artwork. Using ONLY the facts below, write the questions each perspective would ask to verify or deepen this provenance. Ground every question in a named holder, place, date, or gap — no generic questions.

ARTWORK: ${meta.title} — ${meta.artist}
CUSTODY CHAIN (from AIC prose): ${holders || '(none extracted)'}
GETTY DEALER RECORDS for this artist: ${getty.sameWork.length} same-title, ${getty.context.length} other works

Return ONLY JSON: {"scholarship":[string,string],"risk":[string,string],"market":[string,string]}
- scholarship = source credibility and corroboration
- risk = title/transit risk implied by gaps
- market = market trajectory and dealer evidence`
  try {
    const msg = await client.messages.create({ model: MODEL, max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
    const block = msg.content[0]
    const raw = block.type === 'text' ? block.text : ''
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim())
    if (parsed.scholarship && parsed.risk && parsed.market) return parsed
  } catch (err) { console.warn(`  question gen fell back to deterministic: ${err.message}`) }
  return deterministicQuestions(meta, chain, getty)
}

// ─── Custody extraction (Claude or deterministic) ────────────────────────────
function buildPrompt(title, artist, prose) {
  return `You extract the CHAIN OF CUSTODY (successive owners/holders and where they were) from an artwork's provenance text. This is ownership over time — NOT exhibitions or loans.
ARTWORK: ${title} — ${artist}

PROVENANCE TEXT:
${prose.slice(0, 4000)}

Return ONLY JSON: {"entries":[{"institution": string|null, "place": string, "startYear": string|null, "endYear": string|null}]}
Rules:
- One entry per successive owner/holder, in chronological order.
- "institution" = the full name of the person, dealer, gallery, or museum that held it. null if unidentified.
- "place" = the city. Collapse consecutive owners in the same city into one entry.
- Extract ONLY places/dates/names explicitly in the text. NEVER invent anything.
- Use 4-digit years only; null if none given.
- If no custody/location is documented, return {"entries":[]}.`
}

function toEntries(rawEntries, meta) {
  let entries = (rawEntries ?? [])
    .filter(e => e && typeof e.place === 'string' && e.place.trim())
    .map(e => {
      const pt = geocode(e.place)
      return {
        name: pt?.name ? titleCase(pt.name) : e.place.trim(),
        institution: e.institution?.trim() || undefined,
        lat: pt?.lat ?? null,
        lng: pt?.lng ?? null,
        startDate: e.startYear?.match(/\d{4}/)?.[0] ?? null,
        endDate: e.endYear?.match(/\d{4}/)?.[0] ?? null,
        source: 'AIC provenance',
      }
    })
  return applyArtistOriginFix(entries, meta.artist, meta.creationYear)
}

/** Deterministic prose miner — mirrors deterministicExtract in route.ts. */
export function deterministicExtract(meta) {
  const prose = meta.prose
  if (!prose || prose.trim().length < 20) return []
  const clauses = prose.split(/[;\n]+/).map(c => c.trim()).filter(Boolean)
  const out = [], seen = new Set()
  for (const clause of clauses) {
    const city = geocode(clause)
    if (!city) continue
    const years = clause.match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/g)
    const year = years ? years[years.length - 1] : null
    const key = `${city.name}:${year ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    const firstSeg = clause.split(/,\s*/)[0].trim()
    const institution = firstSeg.length > 4 && !/^\d{4}$/.test(firstSeg) ? firstSeg : undefined
    out.push({ name: titleCase(city.name), institution, lat: city.lat, lng: city.lng, startDate: year, endDate: null, source: 'AIC provenance' })
  }
  return applyArtistOriginFix(out, meta.artist, meta.creationYear)
}

async function extractChain(client, meta) {
  if (!meta.prose || meta.prose.length < 20) return []
  if (!client) return deterministicExtract(meta)
  try {
    const msg = await client.messages.create({ model: MODEL, max_tokens: 800, messages: [{ role: 'user', content: buildPrompt(meta.title, meta.artist, meta.prose) }] })
    const block = msg.content[0]
    const raw = block.type === 'text' ? block.text : ''
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim())
    return toEntries(parsed.entries, meta)
  } catch (err) {
    console.warn(`  extraction fell back to deterministic: ${err.message}`)
    return deterministicExtract(meta)
  }
}

// ─── 3. Reconcile + surface conflicts ────────────────────────────────────────
export function gettyYear(r) {
  const m = (r.saleDate || r.entryDate || '').match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/)
  return m ? m[1] : null
}

/**
 * Compare the AIC custody chain against same-work Getty records. When the same
 * named party (buyer/seller) appears in both with DIFFERENT years, record a
 * conflict. The chain is left untouched — no value is silently overwritten.
 * Returns [] when sources agree or no same-work Getty record exists.
 */
export function detectConflicts(chain, sameWorkGetty) {
  const conflicts = []
  for (const r of sameWorkGetty) {
    const gy = gettyYear(r)
    if (!gy) continue
    for (const party of [r.buyer, r.seller]) {
      if (!party) continue
      const hit = chain.find(e => sameName(e.institution ?? e.name, party))
      if (!hit) continue
      const ay = hit.startDate ?? hit.endDate
      if (ay && Math.abs(Number(ay) - Number(gy)) > 1) {
        conflicts.push({
          holder: party,
          aicYear: ay,
          gettyYear: gy,
          gettyRecord: r.piRecordNo,
          source: r.sourceLabel,
          note: `AIC dates ${party} to ${ay}; Getty record ${r.piRecordNo} dates the same party to ${gy}. Shown as an unresolved gap — neither date is treated as settled.`,
        })
      }
    }
  }
  return conflicts
}

/**
 * Stage-5 gate (ADR 0003 §5) — validates a draft chain's shape and honesty
 * invariants before it can be considered for promotion. Pure and exported so
 * promote-work.mjs and the featured-invariants test reuse the same rules.
 *
 * Hard errors (block promotion): bad entry shape, null-island coords,
 * out-of-order dated entries, fewer than 2 mapped entries (a work below that
 * reads as an honest gap, not a featured journey).
 * Warnings (visible, never blocking): unmapped cities, missing institutions,
 * thin dated coverage, documented gaps (gaps are honest — never errors).
 */
export function validateChain(chain) {
  const errors = []
  const warnings = []

  if (!Array.isArray(chain) || chain.length === 0) {
    return { ok: false, errors: ['chain is not a non-empty array'], warnings, stats: { entries: 0, mapped: 0, datedStart: 0 } }
  }

  const yearRe = /^\d{4}$/
  chain.forEach((e, i) => {
    const at = `entry ${i} (${e?.institution ?? e?.name ?? '?'})`
    if (!e || typeof e !== 'object') { errors.push(`${at}: not an object`); return }
    if (typeof e.name !== 'string' || !e.name.trim()) errors.push(`${at}: "name" must be a non-empty string`)
    if (typeof e.source !== 'string' || !e.source.trim()) errors.push(`${at}: "source" must be a non-empty string (every fact carries a source)`)
    for (const d of ['startDate', 'endDate']) {
      if (e[d] !== null && e[d] !== undefined && !(typeof e[d] === 'string' && yearRe.test(e[d]))) {
        errors.push(`${at}: "${d}" must be null or a 4-digit year string, got ${JSON.stringify(e[d])}`)
      }
    }
    for (const c of ['lat', 'lng']) {
      if (e[c] !== null && !Number.isFinite(e[c])) errors.push(`${at}: "${c}" must be null or a finite number`)
    }
    if (e.lat === 0 || e.lng === 0) errors.push(`${at}: null-island coordinate (lat/lng of 0) — use null for unknown, never 0`)
    if (!e.institution) warnings.push(`${at}: no "institution" — the timeline will fall back to the city name`)
    if (e.lat === null || e.lng === null) {
      warnings.push(`${at}: unmapped ("${e.name}") — add the city to scripts/lib/cities.mjs if it's a real place`)
    }
  })

  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i]?.startDate, b = chain[i + 1]?.startDate
    if (a && b && yearRe.test(a) && yearRe.test(b) && Number(b) < Number(a)) {
      errors.push(`entries ${i}→${i + 1}: startDates out of chronological order (${a} → ${b})`)
    }
  }

  const mapped = chain.filter(e => Number.isFinite(e?.lat) && Number.isFinite(e?.lng)).length
  if (mapped < 2) errors.push(`only ${mapped} mapped entr${mapped === 1 ? 'y' : 'ies'} — under 2, the work reads as an honest gap and is not promotable as featured`)

  const datedStart = chain.filter(e => e?.startDate).length
  if (chain.length > 0 && datedStart / chain.length < 0.6) {
    warnings.push(`dated-start coverage ${datedStart}/${chain.length} (<60%) — thin dating weakens the timeline`)
  }
  for (const g of chainGaps(chain)) warnings.push(`documented gap: ${g.note} (honest — shown, never bridged)`)

  return { ok: errors.length === 0, errors, warnings, stats: { entries: chain.length, mapped, datedStart } }
}

/** Undocumented spans between consecutive dated custody entries. */
export function chainGaps(chain) {
  const gaps = []
  for (let i = 0; i < chain.length - 1; i++) {
    const end = chain[i].endDate, next = chain[i + 1].startDate
    if (end && next && Number(next) - Number(end) > 1) {
      gaps.push({ from: end, to: next, note: `No documented custody between ${end} and ${next}.` })
    }
  }
  return gaps
}

// ─── 4. Draft (essay + chain) ────────────────────────────────────────────────
function titleCase(s) { return s.replace(/\b\w/g, c => c.toUpperCase()) }

function buildEssay(meta, chain, getty, conflicts, questions, date, usedClaude) {
  const sourceLine = usedClaude ? 'Claude (claude-haiku-4-5) over AIC tier-A prose' : 'deterministic prose miner over AIC tier-A prose'
  const holders = chain.map(e => `- **${e.institution || e.name}** — ${e.name}, ${e.startDate ?? '?'}–${e.endDate ?? 'present'} _(source: ${e.source})_`).join('\n')
  const gaps = chainGaps(chain)
  const q = (arr) => (arr ?? []).map(s => `- ${s}`).join('\n')
  // Drive the perspective headers from the single PERSPECTIVES map, not literals.
  const perspectiveBlocks = PERSPECTIVES
    .map(p => `**${titleCase(p.key)} — ${p.lens} (${p.agent})**\n${q(questions[p.key])}`)
    .join('\n\n')
  return `---
title: "${date} — ${meta.title}"
date: ${date}
artwork: aic:${meta.id}
agent: curate-pipeline
finding: "Draft custody chain (${chain.length} entries) + ${conflicts.length} source conflict(s) for review"
confidence: ${conflicts.length ? 'low' : 'medium'}
sources: [AIC provenance, Getty GPI]
openQuestion: ${conflicts.length ? 'true' : 'false'}
tags: [agent-finding, curate-draft]
---

# ${date} — ${meta.title}

**Agent:** curate-pipeline (STORM, ADR 0003)
**Confidence:** ${conflicts.length ? 'low — unresolved source conflicts below' : 'medium'}

> DRAFT proposal for human review. Promote into \`src/lib/featured-provenance.json\`
> + \`vault/agents/findings/\` only after a curator verifies it. Not auto-merged.

## Finding

Drafted a ${chain.length}-entry chain of custody for *${meta.title}* (${meta.artist}) from ${sourceLine}, cross-checked against ${getty.sameWork.length + getty.context.length} Getty GPI dealer record(s) for this artist.

## Custody chain (proposed)

${holders || '_No custody documented in AIC prose._'}

## Source conflicts ${conflicts.length ? '⚠️' : '✓'}

${conflicts.length
    ? conflicts.map(c => `- **${c.holder}** — ${c.note}`).join('\n')
    : '_No cross-source date conflict found between AIC prose and same-work Getty records._'}

## Documented gaps

${gaps.length ? gaps.map(g => `- ${g.note}`).join('\n') : '_No undocumented span between dated entries._'}

## Multi-perspective questions (STORM)

${perspectiveBlocks}

## Evidence

- Source: AIC provenance_text (tier A) for artwork \`aic:${meta.id}\`
- Getty GPI: ${getty.sameWork.length} same-title + ${getty.context.length} other-work record(s) for ${meta.artist}
- Extraction: ${usedClaude ? 'Claude' : 'deterministic fallback'}

## Limitations

- Custody rests on a single institution's prose unless a conflict/corroboration is noted above.
- Getty records matched by artist are market context, not this work's custody, unless the title matches.
- Coordinates are null where the geocoder has no entry — never approximated.

## Suggested Next Step

${conflicts.length ? 'Resolve the date conflict(s) against the primary Getty record image before promoting.' : 'Verify holders against a second tier-A source, then promote the chain.'}

## Related

- [[Provenance Gap]]
`
}

// ─── Self-test (proves the conflict rule, offline) ───────────────────────────
function selftest() {
  const chain = [{ name: 'Chicago', institution: 'Bertha Palmer', startDate: '1895', endDate: '1922', source: 'AIC provenance' }]
  const getty = [{ piRecordNo: 'K-TEST', buyer: 'Bertha Palmer', seller: 'M. Knoedler & Co.', saleDate: '1892-03-03', sourceLabel: 'Getty GPI — Knoedler Stock Books (1872–1970)' }]
  const conflicts = detectConflicts(chain, getty)
  const ok = conflicts.length === 1 && conflicts[0].aicYear === '1895' && conflicts[0].gettyYear === '1892'
  // A matching year must NOT raise a conflict.
  const agree = detectConflicts(
    [{ name: 'Chicago', institution: 'Bertha Palmer', startDate: '1892', endDate: null, source: 'AIC provenance' }],
    getty,
  )
  const ok2 = agree.length === 0
  if (ok && ok2) { console.log('selftest: PASS — conflict surfaced, agreement stays silent'); process.exit(0) }
  console.error('selftest: FAIL', { conflicts, agree }); process.exit(1)
}

// ─── Curate one work (shared by single-work mode and --batch) ────────────────
function printGate(gate) {
  if (gate.ok) {
    console.log(`  GATE: PASS — ${gate.stats.entries} entries, ${gate.stats.mapped} mapped, ${gate.stats.datedStart} dated`)
  } else {
    console.log('  GATE: FAIL')
    for (const e of gate.errors) console.log(`    ✗ ${e}`)
  }
  for (const w of gate.warnings) console.log(`    ⚠ ${w}`)
}

async function curateOne(client, id, { stdout = false, dryRun = false, outDir, date }) {
  const meta = await fetchAic(id)
  const chain = await extractChain(client, meta)
  const getty = gatherGetty(loadGetty(), meta.artist, meta.title)
  const conflicts = detectConflicts(chain, getty.sameWork)
  const gate = validateChain(chain)

  if (stdout) { console.log(JSON.stringify(chain, null, 2)); return { meta, chain, conflicts, gate } }

  console.log(`  ${meta.title} — ${meta.artist} (${meta.creationYear ?? 'year?'})`)
  console.log(`  chain: ${chain.length} entries · getty: ${getty.sameWork.length} same-work / ${getty.context.length} context · conflicts: ${conflicts.length}`)

  if (dryRun) { printGate(gate); console.log('  --dry-run: nothing written'); return { meta, chain, conflicts, gate } }

  const questions = client ? await claudeQuestions(client, meta, chain, getty) : deterministicQuestions(meta, chain, getty)
  const essay = buildEssay(meta, chain, getty, conflicts, questions, date, !!client)
  await mkdir(outDir, { recursive: true })
  // Filenames derive ONLY from the validated numeric id + sanitized date — never
  // from network-fetched fields (artist/title) — so the write path can't be
  // steered by upstream API content.
  const chainPath = join(outDir, `aic-${id}.chain.json`)
  const essayPath = join(outDir, `aic-${id}-${date}.md`)
  await writeFile(chainPath, JSON.stringify({ [`aic:${id}`]: chain }, null, 2) + '\n', 'utf8')
  await writeFile(essayPath, essay, 'utf8')
  console.log(`  wrote ${chainPath.replace(ROOT, '.')}`)
  console.log(`  wrote ${essayPath.replace(ROOT, '.')}`)
  // The draft is written BEFORE the gate verdict prints — a failing draft is
  // reviewable evidence, not discarded work.
  printGate(gate)
  console.log('  → DRAFT for review. Run `npm run honesty`, then `npm run promote aic:' + id + ' …` after a human review.')
  return { meta, chain, conflicts, gate }
}

// ─── Batch mode (discovery → curate loop) ────────────────────────────────────
// Drafts only — batch NEVER promotes. Promotion is per-work and human-invoked
// (ADR 0002: autonomy is a dial on initiation, never veto).
async function runBatch(client, n, { dryRun, outDir, date }) {
  const { discoverCandidates } = await import('./discover-works.mjs')
  console.log(`[curate] --batch ${n} — discovering candidates…`)
  const candidates = await discoverCandidates()
  const { existsSync } = await import('fs')
  const fresh = candidates.filter(c => !existsSync(join(outDir, `aic-${c.id}.chain.json`))).slice(0, n)
  if (fresh.length === 0) { console.log('  no new candidates (all top-ranked works already have drafts)'); return }

  const results = []
  for (const c of fresh) {
    console.log(`\n[curate] aic:${c.id} (score ${c.score}) — ${c.title}`)
    try {
      const r = await curateOne(client, c.id, { dryRun, outDir, date })
      results.push({ id: c.id, title: c.title, entries: r.chain.length, conflicts: r.conflicts.length, gate: r.gate.ok ? 'PASS' : 'FAIL' })
    } catch (err) {
      console.error(`  ERROR: ${err.message}`)
      results.push({ id: c.id, title: c.title, entries: 0, conflicts: 0, gate: 'ERROR' })
    }
    await new Promise(res => setTimeout(res, 1500)) // AIC asks ≤60 req/min; each work is 1 fetch + optional Claude calls
  }

  console.log('\n─── batch summary ───')
  for (const r of results) console.log(`  aic:${r.id} · ${r.gate.padEnd(5)} · ${r.entries} entries · ${r.conflicts} conflict(s) · ${r.title}`)
  console.log('\nDrafts are proposals — review each essay, then promote per work with `npm run promote`.')
  if (!results.some(r => r.gate === 'PASS')) process.exit(1)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.length === 0) {
    console.log(`Usage: node scripts/curate.mjs aic:<id> [--stdout|--dry-run|--out <dir>|--date <YYYY-MM-DD>]
       node scripts/curate.mjs --batch <N> [--dry-run]   # discover → draft top N new candidates
       node scripts/curate.mjs --selftest`)
    process.exit(args.length === 0 ? 1 : 0)
  }
  if (args.includes('--selftest')) return selftest()

  await loadEnv()
  const stdout = args.includes('--stdout')
  const dryRun = args.includes('--dry-run')
  const outDir = argValue(args, '--out') || join(ROOT, 'vault', 'agents', 'drafts')
  const dateArg = argValue(args, '--date')
  // Only an ISO date is allowed in the filename; anything else falls back to today.
  const date = dateArg && /^\d{4}-\d{2}-\d{2}$/.test(dateArg) ? dateArg : new Date().toISOString().slice(0, 10)

  const key = process.env.ANTHROPIC_API_KEY
  const client = key ? new Anthropic({ apiKey: key }) : null

  const batchN = argValue(args, '--batch')
  if (batchN !== null) {
    const n = Number(batchN)
    if (!Number.isInteger(n) || n < 1 || n > 25) { console.error(`--batch expects 1–25, got "${batchN}"`); process.exit(1) }
    return runBatch(client, n, { dryRun, outDir, date })
  }

  const ref = args.find(a => !a.startsWith('--'))
  const id = (ref || '').replace(/^aic:/, '')
  if (!/^\d+$/.test(id)) { console.error(`Bad work ref "${ref}" — expected aic:<numeric id>`); process.exit(1) }
  if (!stdout) console.log(`[curate] aic:${id} — ${client ? 'Claude' : 'deterministic (no ANTHROPIC_API_KEY)'} extraction`)

  const { gate } = await curateOne(client, id, { stdout, dryRun, outDir, date })
  if (!gate.ok && !stdout) process.exit(1)
}

function argValue(args, flag) {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null
}

// Only run the CLI when executed directly — importing the module (e.g. from a
// test, per issue #90) must not kick off a curation run.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => { console.error(e); process.exit(1) })
}
