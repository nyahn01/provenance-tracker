/**
 * docs-drift sentinel — keeps documentation honest about the code it points at.
 *
 * Greps every Markdown doc for inline repo paths (e.g. `src/lib/types.ts`) and
 * flags any that no longer exist on disk — the classic rot where a file is moved
 * or renamed and the docs silently lie. Read-only; files ONE `proposal`.
 *
 * `extractRepoPaths` is pure so it can be unit-tested without the tree.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// Top-level dirs that denote a real in-repo path when seen at the start of a ref.
const REPO_DIRS = ['src/', 'scripts/', 'public/', 'docs/', '.claude/', '.github/', 'vault/', 'tests/']

/**
 * Pull inline-code tokens that look like real repo file paths out of Markdown.
 * Only tokens with a file extension and a known top-level dir are considered, so
 * prose like `npm run build` or `agent:data` is ignored.
 * @returns {string[]} unique candidate paths
 */
export function extractRepoPaths(md) {
  const out = new Set()
  for (const m of md.matchAll(/`([^`]+)`/g)) {
    let tok = m[1].trim()
    // Strip a trailing :line or #anchor and any surrounding punctuation.
    tok = tok.replace(/[:#].*$/, '').replace(/[),.;]+$/, '')
    if (!REPO_DIRS.some(d => tok.startsWith(d))) continue
    if (!extname(tok)) continue // must look like a file, not a directory
    if (tok.includes('*') || tok.includes(' ')) continue // globs / commands
    // Skip template placeholders, e.g. `<date>-<slug>.md`, `YYYY-MM-DD-<slug>.md`.
    if (/[<>]/.test(tok) || /\b(YYYY|MM|DD|HH|SLUG|SLUG|ID|NAME|DOMAIN|N)\b/.test(tok)) continue
    out.add(tok)
  }
  return [...out]
}

function walkMd(dir) {
  const out = []
  let names = []
  try { names = readdirSync(dir) } catch { return out }
  for (const name of names) {
    if (name.startsWith('.') || name === 'node_modules') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walkMd(full))
    else if (extname(name) === '.md') out.push(full)
  }
  return out
}

/** @returns {Array<{id:string,label:'proposal',title:string,body:string}>} */
export function scanDocsDrift(root = ROOT, exists = (p) => existsSync(join(root, p))) {
  const broken = []
  const docs = [...walkMd(join(root, 'docs')), ...walkMd(join(root, 'vault'))]
  // Also the root-level markdown contracts.
  for (const f of ['README.md', 'CLAUDE.md', 'AGENTS.md']) {
    const full = join(root, f)
    if (existsSync(full)) docs.push(full)
  }
  for (const file of docs) {
    for (const p of extractRepoPaths(readFileSync(file, 'utf8'))) {
      if (!exists(p)) broken.push(`${relative(root, file)} → \`${p}\` (missing)`)
    }
  }
  if (!broken.length) return []
  const shown = broken.slice(0, 10).map(b => `- ${b}`).join('\n')
  const more = broken.length > 10 ? `\n- …and ${broken.length - 10} more` : ''
  return [{
    id: 'docs-drift-broken-paths',
    label: 'proposal',
    title: '[sentinel] docs-drift: docs reference files that no longer exist',
    body: `${broken.length} documentation reference(s) point at repo paths that are missing on disk (moved/renamed/deleted).\n\n${shown}${more}\n\nFix the reference or restore the file. Suggested: \`agent:provenance-strategy\` (docs) or the owning domain.\n\n_Filed by the docs-drift sentinel (read-only)._`,
  }]
}
