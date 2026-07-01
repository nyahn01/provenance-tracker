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
import { SENTINELS } from './sentinels/index.mjs'
import { planFeedbackRouting } from './feedback/route.mjs'
import { rankProposals, renderDigest } from './decision/rank.mjs'
import { autoPromoteTarget } from './decision/promote.mjs'
import { selectBuildable, dispatch } from './build-issue.mjs'

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

  // ── Sense: run every enabled, registered sentinel ─────────────────────────
  const findings = []
  for (const [key, scan] of Object.entries(SENTINELS)) {
    if (!cfg.sentinels?.[key]?.enabled) continue
    try {
      const f = scan()
      log(`${key}: ${f.length} finding(s)`)
      findings.push(...f)
    } catch (err) {
      log(`${key}: scan errored (skipped) — ${err.message}`)
    }
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

  // ── Feedback: route raw website feedback to a domain owner + triage queue ───
  // Lightweight routing only — deep validity triage (verbatim files) is the LLM
  // feedback-triage agent's job. This never judges validity, promotes, or closes.
  if (cfg.feedback?.route?.enabled) {
    if (DRY) {
      log('feedback routing: [dry-run] would GET open feedback issues and assign agent:<domain> + triage-queued')
    } else {
      const fb = await gh(`/repos/${REPO}/issues?state=open&labels=feedback&per_page=50`)
      const plan = planFeedbackRouting(fb).slice(0, cap)
      log(`feedback routing: ${plan.length} untriaged issue(s)`)
      for (const p of plan) {
        await gh(`/repos/${REPO}/issues/${p.number}/labels`, {
          method: 'POST', body: JSON.stringify({ labels: [p.label, 'triage-queued'] }),
        })
        await gh(`/repos/${REPO}/issues/${p.number}/comments`, {
          method: 'POST',
          body: JSON.stringify({ body: `Routed to **${p.label}** and queued for triage by the orchestrator. Deep triage (validity + verbatim record) is done by the \`feedback-triage\` agent; a human promotes to \`priority\`.\n\n<!-- feedback-routed -->` }),
        })
        log(`  #${p.number} → ${p.label} (triage-queued)`)
      }
    }
  }

  // ── Auto-promote: high-stakes sentinels (security/honesty) → priority ───────
  // Approved graduated autonomy. Never merges — a human always merges.
  if (cfg.decision?.auto_promote?.enabled) {
    const kinds = cfg.decision.auto_promote.kinds ?? ['security', 'honesty']
    if (DRY) {
      log(`auto-promote: [dry-run] would promote open security/honesty proposals (${kinds.join(', ')}) → priority`)
    } else {
      const proposals = await gh(`/repos/${REPO}/issues?state=open&labels=proposal&per_page=100`)
      let promoted = 0
      for (const p of proposals) {
        if (promoted >= cap) break
        const labels = (p.labels || []).map(l => l.name)
        if (labels.includes('priority')) continue
        const target = autoPromoteTarget(p.title, kinds)
        if (!target) continue
        await gh(`/repos/${REPO}/issues/${p.number}/labels`, { method: 'POST', body: JSON.stringify({ labels: ['priority', `agent:${target.agent}`] }) })
        await gh(`/repos/${REPO}/issues/${p.number}/labels/proposal`, { method: 'DELETE' }).catch(() => {})
        await gh(`/repos/${REPO}/issues/${p.number}/comments`, { method: 'POST', body: JSON.stringify({ body: `Auto-promoted \`proposal\` → \`priority\` (${target.kind} is high-stakes/low-ambiguity). Routed to \`agent:${target.agent}\`. A human still merges the resulting PR.` }) })
        log(`  auto-promoted #${p.number} (${target.kind}) → priority`)
        promoted++
      }
      if (!promoted) log('auto-promote: no eligible security/honesty proposals')
    }
  }

  // ── Decide: rank open proposals into a single in-place Decision digest ──────
  // Recommends the next proposal to promote; never promotes/merges (human decides).
  if (cfg.decision?.digest?.enabled) {
    if (DRY) {
      log('decision digest: [dry-run] would rank open proposals and upsert the "Decision digest" issue')
    } else {
      const proposals = await gh(`/repos/${REPO}/issues?state=open&labels=proposal&per_page=100`)
      const enriched = proposals
        .filter(p => !(p.body || '').includes('<!-- decision-digest -->')) // don't rank the digest itself
        .map(p => ({ number: p.number, title: p.title, comments: p.comments, reactions: p.reactions }))
      const ranked = rankProposals(enriched)
      const body = renderDigest(ranked)
      // Upsert: find an open issue carrying the digest marker.
      const all = await gh(`/repos/${REPO}/issues?state=open&per_page=100`)
      const existing = all.find(i => (i.body || '').includes('<!-- decision-digest -->'))
      if (existing) {
        await gh(`/repos/${REPO}/issues/${existing.number}`, { method: 'PATCH', body: JSON.stringify({ body }) })
        log(`decision digest: refreshed #${existing.number} (${ranked.length} proposal(s))`)
      } else {
        const created = await gh(`/repos/${REPO}/issues`, { method: 'POST', body: JSON.stringify({ title: '🧭 Decision digest — next up', body }) })
        log(`decision digest: created #${created.number} (${ranked.length} proposal(s))`)
      }
    }
  }

  // ── Act: build the priority queue (OFF by default; human always merges) ─────
  if (!DRY) {
    const queue = await gh(`/repos/${REPO}/issues?state=open&labels=priority&per_page=50`)
    log(`priority queue: ${queue.length} issue(s)`)
    for (const it of queue) {
      const paused = (it.labels || []).some(l => l.name === 'paused')
      log(`  #${it.number} → ${agentOf(it.labels)}${paused ? ' (paused, skipped)' : ''} — "${it.title}"`)
    }
    if (cfg.decision?.auto_build?.enabled) {
      const buildable = selectBuildable(queue, cap)
      log(`auto-build: ${buildable.length} issue(s) to dispatch (${process.env.BUILD_AGENT_CMD ? 'BUILD_AGENT_CMD set' : 'no agent cmd → brief-only'})`)
      for (const b of buildable) {
        const full = await gh(`/repos/${REPO}/issues/${b.number}`)
        await dispatch(full) // BYO coding agent or posts the brief; never merges
      }
    } else {
      log('auto-build: disabled — priority issues built by a human/session; the runner never merges (human gate).')
    }
  }
}

const agentOf = (labels = []) =>
  labels.map(l => (typeof l === 'string' ? l : l.name)).find(n => n.startsWith('agent:')) || 'agent:unassigned'

main().catch(e => { console.error('[orchestrate] fatal:', e.message); process.exit(1) })
