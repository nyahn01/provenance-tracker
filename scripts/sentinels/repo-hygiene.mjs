/**
 * repo-hygiene sentinel — surfaces lingering tech-debt markers.
 *
 * Greps the source tree for TODO / FIXME / HACK / XXX markers and clusters them
 * into ONE `proposal` so debt is tracked in the queue instead of rotting in code.
 * Read-only. Conservative by design (only explicit markers) to avoid noise.
 *
 * `findMarkers` is pure so it can be unit-tested.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const MARKER = /\b(TODO|FIXME|HACK|XXX)\b[:\s]/

/** @returns {Array<{line:number, marker:string, text:string}>} */
export function findMarkers(content) {
  const hits = []
  content.split('\n').forEach((line, i) => {
    const m = line.match(MARKER)
    // Ignore this sentinel's own definition line and honesty-ok escape hatches.
    if (m && !line.includes('honesty-ok') && !/MARKER =/.test(line)) {
      hits.push({ line: i + 1, marker: m[1], text: line.trim().slice(0, 100) })
    }
  })
  return hits
}

function walk(dir, exts = ['.ts', '.tsx', '.mjs', '.js']) {
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

/** @returns {Array<{id:string,label:'proposal',title:string,body:string}>} */
export function scanRepoHygiene(root = ROOT) {
  const found = []
  for (const file of [...walk(join(root, 'src')), ...walk(join(root, 'scripts'))]) {
    if (file.includes('repo-hygiene')) continue // don't flag ourselves
    for (const h of findMarkers(readFileSync(file, 'utf8'))) {
      found.push(`${relative(root, file)}:${h.line} — ${h.marker}: ${h.text}`)
    }
  }
  if (!found.length) return []
  const shown = found.slice(0, 10).map(f => `- ${f}`).join('\n')
  const more = found.length > 10 ? `\n- …and ${found.length - 10} more` : ''
  return [{
    id: 'repo-hygiene-tech-debt-markers',
    label: 'proposal',
    title: `[sentinel] repo-hygiene: ${found.length} unresolved TODO/FIXME marker(s)`,
    body: `Explicit tech-debt markers left in the source. Track them in the queue or clear them.\n\n${shown}${more}\n\nSuggested: route each to its owning \`agent:<domain>\`.\n\n_Filed by the repo-hygiene sentinel (read-only)._`,
  }]
}
