/**
 * orchestrate.mjs — the Stage-2/3 runner (ADR 0002), replacing the inert stub.
 *
 * Read by .github/workflows/orchestrate.yml. Does nothing unless
 * .claude/orchestration.json has `mode` = scheduled|event-driven AND `paused` = false.
 *
 * When active it runs the **Sense** loop: each enabled, read-only sentinel scans
 * `main` and the runner files ONE idempotent issue per finding (data-quality →
 * `proposal`, honesty-regression → `priority`), capped by `max_prs_per_run`. It then
 * reads the `priority` queue and prints the routed plan.
 *
 * Guardrails (non-negotiable, per ADR 0002):
 *  - Sentinels are read-only; they never edit code, never merge, never close.
 *  - Idempotent: an open issue carrying the same `<!-- sentinel:ID -->` marker is
 *    updated with a comment, never duplicated.
 *  - Capped by max_prs_per_run; honors the `paused` kill-switch.
 *  - Building a `priority` issue into a PR is delegated to a coding-agent step
 *    (Claude Code / Agent SDK), NOT performed here — the runner only senses + routes.
 *    A human always merges.
 *
 * Without a GITHUB_TOKEN the runner is automatically a dry-run (prints intended issues).
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanFeatured } from './sentinels/data-quality.mjs'
import { scanHonestyRegression } from './sentinels/honesty-regression.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const cfg = JSON.parse(readFileSync(join(ROOT, '.claude/orchestration.json'), 'utf8'))

const DRY = process.argv.includes('--dry-run') || !process.env.GITHUB_TOKEN
const REPO = process.env.GITHUB_REPOSITORY || 'nyahn01/provenance-tracker'
const API = 'https://api.github.com'

function log(...a) { console.log('[orchestrate]', ...a) }

async function gh(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (!res.ok) throw new Error(`GitHub ${init.method || 'GET'} ${path} → ${res.status} ${await res.text()}`)
  return res.json()
}

const marker = (id) => `<!-- sentinel:${id} -->`

async function openSentinelIssues() {
  // Map of marker-id → issue number for the runner's own open issues (idempotency).
  const issues = await gh(`/repos/${REPO}/issues?state=open&per_page=100&labels=`)
  const found = {}
  for (const it of issues) {
    const m = (it.body || '').match(/<!-- sentinel:([a-z0-9-]+) -->/)
    if (m) found[m[1]] = it.number
  }
  return found
}

async function fileFinding(f, existing) {
  const body = `${f.body}\n\n${marker(f.id)}`
  if (existing[f.id]) {
    log(`exists #${existing[f.id]} — ${f.id} (idempotent: not duplicated)`) // a human triages the open one
    return false
  }
  if (DRY) { log(`DRY would file [${f.label}] "${f.title}"`); return true }
  const created = await gh(`/repos/${REPO}/issues`, {
    method: 'POST',
    body: JSON.stringify({ title: f.title, body, labels: [f.label] }),
  })
  log(`filed #${created.number} [${f.label}] ${f.id}`)
  return true
}

async function main() {
  const active = ['scheduled', 'event-driven'].includes(cfg.mode) && !cfg.paused
  log(`mode=${cfg.mode} paused=${cfg.paused} → ${active ? 'ACTIVE' : 'inert (no-op)'}${DRY ? ' [dry-run]' : ''}`)
  if (!active) return

  // ── Sense: run enabled sentinels ──────────────────────────────────────────
  const findings = []
  if (cfg.sentinels?.['data-quality-sentinel']?.enabled) {
    const f = scanFeatured()
    log(`data-quality: ${f.length} finding(s)`) ; findings.push(...f)
  }
  if (cfg.sentinels?.['honesty-regression-sentinel']?.enabled) {
    const f = scanHonestyRegression()
    log(`honesty-regression: ${f.length} finding(s)`) ; findings.push(...f)
  }

  // File issues, idempotent + capped.
  const cap = cfg.cadence?.max_prs_per_run ?? 3
  const existing = DRY ? {} : await openSentinelIssues()
  let filed = 0
  for (const f of findings) {
    if (filed >= cap) { log(`cap reached (${cap}); ${findings.length - filed} finding(s) deferred to next run`); break }
    if (await fileFinding(f, existing)) filed++
  }
  if (!findings.length) log('no findings — sentinels stay silent (no "all clear" issue)')

  // ── Route: read the priority queue (build is delegated to the coding agent) ─
  if (!DRY) {
    const queue = await gh(`/repos/${REPO}/issues?state=open&labels=priority&per_page=50`)
    log(`priority queue: ${queue.length} issue(s)`)
    for (const it of queue) {
      const agent = (it.labels || []).map(l => l.name).find(n => n.startsWith('agent:')) || 'agent:unassigned'
      const paused = (it.labels || []).some(l => l.name === 'paused')
      log(`  #${it.number} → ${agent}${paused ? ' (paused, skipped)' : ''} — "${it.title}"`)
    }
    log('build step: delegated to the coding-agent run; the runner never merges (human gate).')
  }
}

main().catch(e => { console.error('[orchestrate] fatal:', e.message); process.exit(1) })
