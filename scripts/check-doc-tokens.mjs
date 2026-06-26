#!/usr/bin/env node
/**
 * check-doc-tokens — guards against design-token drift in documentation.
 *
 * WHY: tokens live in ONE place — src/lib/design-tokens.ts. Markdown that restates
 * hex values rots silently (the globe-land color was #7a5828 in code but #1c1612 in
 * three docs). This check fails CI if any tracked markdown mentions a GLOBE token
 * (ocean/land/border) with a hex that disagrees with the code.
 *
 * SCOPE: scans *.md repo-wide EXCEPT node_modules/.git/.next/out. Covers all docs
 * (the legacy draft/ folder was removed in Phase 2).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const TOKENS_FILE = 'src/lib/design-tokens.ts'
const EXCLUDED = ['node_modules', '.git', '.next', 'out']

// 1. Canonical globe trio from the single source of truth.
const tokensSrc = readFileSync(join(ROOT, TOKENS_FILE), 'utf8')
const grab = (key) => {
  const m = tokensSrc.match(new RegExp(`${key}:\\s*'(#[0-9a-fA-F]{6})'`))
  if (!m) { console.error(`✗ could not find ${key} in ${TOKENS_FILE}`); process.exit(2) }
  return m[1].toLowerCase()
}
const canonical = { ocean: grab('globeOcean'), land: grab('globeLand'), border: grab('globeBorder') }

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

// 3. For each `globe<token>` mention (globeOcean / globe-land / globe ocean …),
//    the nearest hex on that line must equal that token's canonical value.
//    The (?![a-z]) lookahead rejects words like "landing" / "borderless".
const TOKEN_RE = /globe[\s_.-]?(ocean|land|border)(?![a-z])/gi
const violations = []
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join('/')
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    let m
    TOKEN_RE.lastIndex = 0
    while ((m = TOKEN_RE.exec(line))) {
      const which = m[1].toLowerCase()
      const want = canonical[which]
      const after = line.slice(m.index + m[0].length)
      const hexM = after.match(/#[0-9a-fA-F]{6}/) || line.match(/#[0-9a-fA-F]{6}/)
      if (hexM) {
        const got = hexM[0].toLowerCase()
        if (got !== want) violations.push({ rel, line: i + 1, which, got, want, text: line.trim() })
      }
    }
  })
}

if (violations.length) {
  console.error('✗ design-token drift in docs — globe tokens must match', TOKENS_FILE)
  console.error(`  canonical: ocean=${canonical.ocean} land=${canonical.land} border=${canonical.border}`)
  for (const v of violations) console.error(`  ${v.rel}:${v.line}  globe-${v.which} is ${v.got}, must be ${v.want}  "${v.text}"`)
  console.error('  Fix: reference src/lib/design-tokens.ts; do not restate hex values in markdown.')
  process.exit(1)
}
console.log(`✓ doc-token check passed (globe trio ocean/land/border in all docs match ${TOKENS_FILE})`)
