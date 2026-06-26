#!/usr/bin/env node
/**
 * check-doc-tokens — guards against design-token drift in documentation.
 *
 * WHY: tokens live in ONE place — src/lib/design-tokens.ts. Markdown that restates
 * hex values rots silently (the globe-land color was #7a5828 in code but #1c1612 in
 * three docs). This check fails CI if any tracked markdown mentions a GLOBE token
 * (ocean/land/border) with a hex that disagrees with the code.
 *
 * SCOPE: scans *.md repo-wide EXCEPT node_modules/.git/.next and the legacy `draft/`
 * folder, which is quarantined and slated for removal in Phase 2. When draft/ is
 * deleted, remove it from EXCLUDED below so the guard covers everything.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const TOKENS_FILE = 'src/lib/design-tokens.ts'
const EXCLUDED = ['node_modules', '.git', '.next', 'out', 'draft'] // draft/: legacy, removed in Phase 2

// 1. Canonical globe trio from the single source of truth.
const tokensSrc = readFileSync(join(ROOT, TOKENS_FILE), 'utf8')
const grab = (key) => {
  const m = tokensSrc.match(new RegExp(`${key}:\\s*'(#[0-9a-fA-F]{6})'`))
  if (!m) { console.error(`✗ could not find ${key} in ${TOKENS_FILE}`); process.exit(2) }
  return m[1].toLowerCase()
}
const canonical = { ocean: grab('globeOcean'), land: grab('globeLand'), border: grab('globeBorder') }
const canonicalSet = new Set(Object.values(canonical))

// 2. Walk markdown files.
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (EXCLUDED.includes(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, acc)
    else if (name.endsWith('.md')) acc.push(p)
  }
  return acc
}

// 3. Flag any line that mentions a globe token alongside a non-canonical hex.
const violations = []
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join('/')
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (!/globe/i.test(line)) return
    const hexes = (line.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())
    for (const hex of hexes) {
      // Only judge hexes that look like a globe token claim (ocean/land/border context).
      if (!/ocean|land|border|globe/i.test(line)) continue
      if (hexes.length && !canonicalSet.has(hex) && /ocean|land|border/i.test(line)) {
        violations.push({ rel, line: i + 1, hex, text: line.trim() })
        break
      }
    }
  })
}

if (violations.length) {
  console.error('✗ design-token drift in docs — globe tokens must match', TOKENS_FILE)
  console.error(`  canonical: ocean=${canonical.ocean} land=${canonical.land} border=${canonical.border}`)
  for (const v of violations) console.error(`  ${v.rel}:${v.line}  ${v.hex}  "${v.text}"`)
  console.error('  Fix: reference src/lib/design-tokens.ts; do not restate hex values in markdown.')
  process.exit(1)
}
console.log(`✓ doc-token check passed (globe trio ocean/land/border match ${TOKENS_FILE}; draft/ excluded pending Phase 2)`)
