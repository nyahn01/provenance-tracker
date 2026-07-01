/**
 * security sentinel — watches the dependency surface.
 *
 * Runs `npm audit --json` and, when advisories exist, files an issue: `priority`
 * if anything is high/critical (security is high-stakes), else `proposal`.
 * Read-only; never edits lockfiles or opens fix PRs. If audit can't run (offline),
 * it stays silent rather than inventing a finding.
 *
 * `summarizeAudit` is pure so it can be unit-tested with a fixture.
 */

import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ORDER = ['critical', 'high', 'moderate', 'low', 'info']

/**
 * Turn `npm audit --json` output into a finding (or null when clean).
 * @param {any} audit parsed audit JSON (npm v7+ schema)
 * @returns {{id:string,label:'priority'|'proposal',title:string,body:string}|null}
 */
export function summarizeAudit(audit) {
  const meta = audit?.metadata?.vulnerabilities || {}
  const total = ORDER.reduce((n, sev) => n + (meta[sev] || 0), 0)
  if (!total) return null

  const counts = ORDER.filter(s => meta[s]).map(s => `${meta[s]} ${s}`).join(', ')
  const severe = (meta.critical || 0) + (meta.high || 0) > 0
  const advisories = Object.values(audit?.vulnerabilities || {})
    .map(v => `- \`${v.name}\` (${v.severity})${v.via?.length ? ` — via ${v.via.map(x => typeof x === 'string' ? x : x.title).slice(0, 2).join(', ')}` : ''}`)
    .slice(0, 10)

  return {
    id: 'security-npm-audit',
    label: severe ? 'priority' : 'proposal',
    title: `[sentinel] security: ${counts} dependency vulnerabilit${total === 1 ? 'y' : 'ies'}`,
    body: `\`npm audit\` reports **${counts}**.\n\n${advisories.join('\n') || '_(no per-package detail)_'}\n\nRun \`npm audit fix\` (or bump/override the offending dep) and verify the build. Suggested: \`agent:provenance-data\`.\n\n_Filed by the security sentinel (read-only). ${severe ? '`priority` — high/critical present.' : ''}_`,
  }
}

/** @returns {Array<{id:string,label:string,title:string,body:string}>} */
export function scanSecurity() {
  let raw
  try {
    // npm audit exits non-zero when vulnerabilities exist; capture stdout regardless.
    raw = execFileSync('npm', ['audit', '--json'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString()
  } catch (err) {
    raw = err.stdout?.toString() || ''
  }
  let audit
  try { audit = JSON.parse(raw) } catch { return [] } // offline / unparseable → silent
  const finding = summarizeAudit(audit)
  return finding ? [finding] : []
}
