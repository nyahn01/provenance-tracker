/**
 * honesty-regression sentinel — the mechanical core of
 * .claude/agents/honesty-regression-sentinel.md.
 *
 * Off-cycle guard that the honesty contract hasn't eroded on `main` between PRs.
 * Runs the full honesty gate and greps the rendered surfaces (src/app,
 * src/components) for over-claim phrasings. Read-only. Any regression →
 * the orchestrator files ONE `priority` issue (honesty is the moat).
 *
 * `findOverclaims` is pure so it can be unit-tested without touching the tree.
 */

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// Over-claim phrasings to watch for in rendered copy. Kept aligned with — never a
// fork of — the canonical list in scripts/honesty-check.mjs (propose additions there).
// Mirror scripts/honesty-check.mjs exactly — the gate is the source of truth, so the
// off-cycle scan never flags copy the gate would pass (no false-positive priority issues).
// honesty-ok lines: these literals are detection patterns, not product copy.
const OVERCLAIM = [
  { re: /["'`]([^"'`]*\bon view\b[^"'`]*)["'`]/i, rule: 'real-time on-view claim we cannot verify from static APIs' }, // honesty-ok
  { re: /currently on (view|display)/i, rule: 'real-time display claim without a dated source' }, // honesty-ok
  { re: /currently (held|housed|located|owned) (at|by)/i, rule: 'present-tense custody without a date' }, // honesty-ok
  { re: /\bprobably (owned|held|acquired) by\b/i, rule: 'speculative ownership' }, // honesty-ok
  { re: /\blikely (owned|held|passed through)\b/i, rule: 'speculative provenance' }, // honesty-ok
]

/**
 * Scan one rendered file's text for over-claim phrasings. Skips comment lines and
 * any line carrying the `honesty-ok` marker (matching the gate's own escape hatch).
 * @returns {Array<{line:number, text:string, rule:string}>}
 */
export function findOverclaims(content) {
  const hits = []
  content.split('\n').forEach((line, i) => {
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || line.includes('honesty-ok')) return
    for (const { re, rule } of OVERCLAIM) {
      if (re.test(line)) hits.push({ line: i + 1, text: t.slice(0, 100), rule })
    }
  })
  return hits
}

function walk(dir, exts = ['.ts', '.tsx']) {
  const out = []
  let names = []
  try { names = readdirSync(dir) } catch { return out }
  for (const name of names) {
    if (name.startsWith('.') || name === 'node_modules') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full, exts))
    else if (exts.includes(extname(name))) out.push(full)
  }
  return out
}

/**
 * Full off-cycle honesty scan. Returns at most one `priority` finding (or none).
 * @returns {Array<{id:string,label:'priority',title:string,body:string}>}
 */
export function scanHonestyRegression() {
  const problems = []

  // 1. The blocking gate, run across the whole tree.
  try {
    execFileSync('node', ['scripts/honesty-check.mjs', '--full'], { cwd: ROOT, stdio: 'pipe' })
  } catch (err) {
    const out = (err.stdout?.toString() || '') + (err.stderr?.toString() || '')
    problems.push('`npm run honesty:full` reported violations:\n```\n' + out.trim().slice(0, 1500) + '\n```')
  }

  // 2. Over-claim phrasings in rendered surfaces.
  const overclaims = []
  for (const file of [...walk(join(ROOT, 'src/app')), ...walk(join(ROOT, 'src/components'))]) {
    const hits = findOverclaims(readFileSync(file, 'utf8'))
    for (const h of hits) overclaims.push(`${relative(ROOT, file)}:${h.line} — ${h.rule} (\`${h.text}\`)`)
  }
  if (overclaims.length) {
    problems.push('Over-claim phrasings in rendered copy:\n' + overclaims.slice(0, 10).map(s => `- ${s}`).join('\n'))
  }

  if (!problems.length) return [] // silence is success — no "all clear" issue

  return [{
    id: 'honesty-regression',
    label: 'priority',
    title: '[sentinel] honesty-regression: contract eroded on main',
    body: `The off-cycle honesty sentinel found a regression on \`main\` (the gate runs per-PR; this catches drift between PRs).\n\n${problems.join('\n\n')}\n\n_Filed as \`priority\` — honesty is the moat. Route: \`agent:provenance-honesty-review\`._`,
  }]
}
