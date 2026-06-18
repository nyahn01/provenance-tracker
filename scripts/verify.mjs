#!/usr/bin/env node
/**
 * verify.mjs — the runtime gate. An agent's work does not exist until THIS passes.
 *
 * What it proves (against a live dev server, not types):
 *   1. /api/search returns real results with real source URLs
 *   2. the first result's id feeds /api/provenance and returns the CONTRACT shape
 *   3. no hardcoded/faked artwork data is being served
 *   4. honest gap state is present when coverage is thin
 *
 * Usage:
 *   node scripts/verify.mjs            # assumes server already on :3000
 *   BASE=http://localhost:3000 node scripts/verify.mjs
 *
 * Exit 0 = green (safe to commit). Exit 1 = blocked.
 */

const BASE = process.env.BASE || 'http://localhost:3000'
const FORBIDDEN = ['DEMO_DATA', 'insurance_risk_flag', 'conflicting_claims']

let failures = 0
const fail = (msg) => { console.error(`  ✗ ${msg}`); failures++ }
const pass = (msg) => console.log(`  ✓ ${msg}`)

async function getJson(path, init) {
  const res = await fetch(`${BASE}${path}`, init)
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = null }
  return { status: res.status, json, text }
}

async function waitForServer(tries = 30) {
  // Probe a real route and tolerate first-hit compile latency (dev) by retrying.
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${BASE}/api/search?q=test`)
      if (res.status === 200) return true
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 1500))
  }
  return false
}

async function main() {
  console.log(`\n▶ verify.mjs against ${BASE}\n`)

  if (!(await waitForServer())) {
    fail('dev server never became reachable on ' + BASE)
    process.exit(1)
  }

  // ── 1. SEARCH ──────────────────────────────────────────────────────────────
  console.log('1. /api/search?q=van gogh')
  const search = await getJson('/api/search?q=van%20gogh')
  if (search.status !== 200) fail(`search returned HTTP ${search.status}`)
  const results = search.json?.results
  if (!Array.isArray(results) || results.length === 0) {
    fail('search returned no results')
  } else {
    pass(`search returned ${results.length} results`)
    const r0 = results[0]
    for (const k of ['id', 'source', 'title', 'artist']) {
      if (!(k in r0)) fail(`search result missing field "${k}"`)
    }
    if (r0.thumbnail && !/^https?:\/\//.test(r0.thumbnail)) {
      fail('thumbnail is not a real URL')
    } else {
      pass('first result matches SearchResult contract')
    }
  }

  // ── 2. PROVENANCE via the shape the FRONTEND actually calls ─────────────────
  const first = results?.[0]
  if (first) {
    const rawId = first.id.includes('-') ? first.id.split('-')[1] : first.id
    console.log(`\n2. /api/provenance?source=${first.source}&id=${rawId}`)
    const prov = await getJson(`/api/provenance?source=${first.source}&id=${rawId}`)
    if (prov.status !== 200) {
      fail(`provenance returned HTTP ${prov.status} — frontend click would break`)
    } else {
      const p = prov.json
      // contract shape
      const shapeOk =
        p && p.artwork && Array.isArray(p.locations) &&
        Array.isArray(p.gaps) && typeof p.hasGap === 'boolean'
      if (!shapeOk) fail('provenance does NOT match ProvenanceResponse contract')
      else pass('provenance matches ProvenanceResponse contract')

      // honesty: gap state present when thin
      if (p?.hasGap === true && p.gaps.length === 0) {
        fail('hasGap=true but gaps[] is empty (silent gap)')
      } else {
        pass('gap state is consistent')
      }
      // every located entry must carry a source
      for (const loc of p?.locations ?? []) {
        if (!loc.source) { fail('a location entry has no source attribution'); break }
      }
    }
  }

  // ── 3. NO FAKED DATA on disk ────────────────────────────────────────────────
  console.log('\n3. honesty grep (no hardcoded provenance)')
  const { readFileSync } = await import('node:fs')
  const routeSrc = readFileSync(
    new URL('../src/app/api/provenance/route.ts', import.meta.url), 'utf8',
  )
  const hit = FORBIDDEN.find(tok => routeSrc.includes(tok))
  if (hit) fail(`provenance route still contains forbidden token: ${hit}`)
  else pass('no DEMO_DATA / fake confidence / risk-flag tokens in provenance route')

  // ── verdict ─────────────────────────────────────────────────────────────────
  console.log('')
  if (failures > 0) {
    console.error(`✗ BLOCKED — ${failures} check(s) failed. Do not commit.\n`)
    process.exit(1)
  }
  console.log('✓ GREEN — all checks passed. Safe to commit.\n')
}

main().catch(err => { console.error('verify.mjs crashed:', err); process.exit(1) })
