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
 *   node scripts/curate.mjs --selftest           # prove the conflict detector (offline)
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

// ─── Geocoder (mirrors src/lib/geocode.ts via preparse) ──────────────────────
const CITIES = {
  paris: { lat: 48.8566, lng: 2.3522 }, london: { lat: 51.5074, lng: -0.1278 },
  'new york': { lat: 40.7128, lng: -74.006 }, chicago: { lat: 41.8781, lng: -87.6298 },
  amsterdam: { lat: 52.3676, lng: 4.9041 }, brussels: { lat: 50.8503, lng: 4.3517 },
  'the hague': { lat: 52.0705, lng: 4.3007 }, rotterdam: { lat: 51.9244, lng: 4.4777 },
  antwerp: { lat: 51.2194, lng: 4.4025 }, bruges: { lat: 51.2093, lng: 3.2247 },
  madrid: { lat: 40.4168, lng: -3.7038 }, barcelona: { lat: 41.3874, lng: 2.1686 },
  lisbon: { lat: 38.7223, lng: -9.1393 }, florence: { lat: 43.7696, lng: 11.2558 },
  rome: { lat: 41.9028, lng: 12.4964 }, venice: { lat: 45.4408, lng: 12.3155 },
  milan: { lat: 45.4642, lng: 9.19 }, naples: { lat: 40.8518, lng: 14.2681 },
  vienna: { lat: 48.2082, lng: 16.3738 }, berlin: { lat: 52.52, lng: 13.405 },
  munich: { lat: 48.1351, lng: 11.582 }, cologne: { lat: 50.9375, lng: 6.9603 },
  dresden: { lat: 51.0504, lng: 13.7373 }, 'st petersburg': { lat: 59.9311, lng: 30.3609 },
  'saint petersburg': { lat: 59.9311, lng: 30.3609 }, moscow: { lat: 55.7558, lng: 37.6173 },
  geneva: { lat: 46.2044, lng: 6.1432 }, zurich: { lat: 47.3769, lng: 8.5417 },
  basel: { lat: 47.5596, lng: 7.5886 }, copenhagen: { lat: 55.6761, lng: 12.5683 },
  stockholm: { lat: 59.3293, lng: 18.0686 }, oslo: { lat: 59.9139, lng: 10.7522 },
  dublin: { lat: 53.3498, lng: -6.2603 }, edinburgh: { lat: 55.9533, lng: -3.1883 },
  prague: { lat: 50.0755, lng: 14.4378 }, budapest: { lat: 47.4979, lng: 19.0402 },
  warsaw: { lat: 52.2297, lng: 21.0122 }, athens: { lat: 37.9838, lng: 23.7275 },
  istanbul: { lat: 41.0082, lng: 28.9784 }, cairo: { lat: 30.0444, lng: 31.2357 },
  washington: { lat: 38.9072, lng: -77.0369 }, 'washington dc': { lat: 38.9072, lng: -77.0369 },
  boston: { lat: 42.3601, lng: -71.0589 }, philadelphia: { lat: 39.9526, lng: -75.1652 },
  'los angeles': { lat: 34.0522, lng: -118.2437 }, 'san francisco': { lat: 37.7749, lng: -122.4194 },
  detroit: { lat: 42.3314, lng: -83.0458 }, toronto: { lat: 43.6532, lng: -79.3832 },
  montreal: { lat: 45.5017, lng: -73.5673 }, 'mexico city': { lat: 19.4326, lng: -99.1332 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 }, tokyo: { lat: 35.6762, lng: 139.6503 },
  kyoto: { lat: 35.0116, lng: 135.7681 }, beijing: { lat: 39.9042, lng: 116.4074 },
  shanghai: { lat: 31.2304, lng: 121.4737 }, taipei: { lat: 25.033, lng: 121.5654 },
  'hong kong': { lat: 22.3193, lng: 114.1694 }, provins: { lat: 48.5597, lng: 3.2972 },
  'lake forest': { lat: 42.2597, lng: -87.8398 },
}
const SORTED = Object.keys(CITIES).sort((a, b) => b.length - a.length)

export function geocode(place) {
  if (!place) return null
  const s = place.toLowerCase()
  for (const city of SORTED) if (s.includes(city)) return { name: city, ...CITIES[city] }
  return null
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
function loadGetty() {
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
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) }

function buildEssay(meta, chain, getty, conflicts, questions, date, usedClaude) {
  const sourceLine = usedClaude ? 'Claude (claude-haiku-4-5) over AIC tier-A prose' : 'deterministic prose miner over AIC tier-A prose'
  const holders = chain.map(e => `- **${e.institution || e.name}** — ${e.name}, ${e.startDate ?? '?'}–${e.endDate ?? 'present'} _(source: ${e.source})_`).join('\n')
  const gaps = chainGaps(chain)
  const q = (arr) => arr.map(s => `- ${s}`).join('\n')
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

**Scholarship (art-historian)**
${q(questions.scholarship)}

**Risk (art-insurance-advisor)**
${q(questions.risk)}

**Market (provenance-strategy)**
${q(questions.market)}

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

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.length === 0) {
    console.log('Usage: node scripts/curate.mjs aic:<id> [--stdout|--dry-run|--out <dir>|--date <YYYY-MM-DD>]\n       node scripts/curate.mjs --selftest')
    process.exit(args.length === 0 ? 1 : 0)
  }
  if (args.includes('--selftest')) return selftest()

  await loadEnv()
  const ref = args.find(a => !a.startsWith('--'))
  const id = (ref || '').replace(/^aic:/, '')
  if (!/^\d+$/.test(id)) { console.error(`Bad work ref "${ref}" — expected aic:<numeric id>`); process.exit(1) }
  const stdout = args.includes('--stdout')
  const dryRun = args.includes('--dry-run')
  const outDir = argValue(args, '--out') || join(ROOT, 'vault', 'agents', 'drafts')
  const date = argValue(args, '--date') || new Date().toISOString().slice(0, 10)

  const key = process.env.ANTHROPIC_API_KEY
  const client = key ? new Anthropic({ apiKey: key }) : null
  if (!stdout) console.log(`[curate] aic:${id} — ${client ? 'Claude' : 'deterministic (no ANTHROPIC_API_KEY)'} extraction`)

  const meta = await fetchAic(id)
  const chain = await extractChain(client, meta)
  const getty = gatherGetty(loadGetty(), meta.artist, meta.title)
  const conflicts = detectConflicts(chain, getty.sameWork)
  const questions = client ? await claudeQuestions(client, meta, chain, getty) : deterministicQuestions(meta, chain, getty)

  if (stdout) { console.log(JSON.stringify(chain, null, 2)); return }

  console.log(`  ${meta.title} — ${meta.artist} (${meta.creationYear ?? 'year?'})`)
  console.log(`  chain: ${chain.length} entries · getty: ${getty.sameWork.length} same-work / ${getty.context.length} context · conflicts: ${conflicts.length}`)

  if (dryRun) { console.log('  --dry-run: nothing written'); return }

  const slug = slugify(`${meta.artist}-${meta.title}`) || `aic-${id}`
  const essay = buildEssay(meta, chain, getty, conflicts, questions, date, !!client)
  await mkdir(outDir, { recursive: true })
  const chainPath = join(outDir, `aic-${id}.chain.json`)
  const essayPath = join(outDir, `${date}-${slug}.md`)
  await writeFile(chainPath, JSON.stringify({ [`aic:${id}`]: chain }, null, 2) + '\n', 'utf8')
  await writeFile(essayPath, essay, 'utf8')
  console.log(`  wrote ${chainPath.replace(ROOT, '.')}`)
  console.log(`  wrote ${essayPath.replace(ROOT, '.')}`)
  console.log('  → DRAFT for review. Run `npm run honesty` then promote into featured-provenance.json + vault/agents/findings/.')
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
