/**
 * build-issue — the ACT step: turn a `priority` issue into a PR.
 *
 * HONEST SCOPE. The deterministic, testable parts live here: selecting the next
 * buildable priority issue and assembling the build brief (the exact instructions a
 * coding agent needs). The actual code-writing is delegated to a **bring-your-own
 * coding agent** — a command you configure via `BUILD_AGENT_CMD` (e.g. a headless
 * Claude Code / Agent SDK invocation). We do not bundle or fake that agent, and it
 * is not exercised in CI here.
 *
 * Guardrails (ADR 0002): OFF by default (`decision.auto_build.enabled`); bounded by
 * max_prs_per_run; skips `paused` issues; the agent opens a DRAFT PR that `Closes #N`
 * and **a human always merges**. When no agent command is configured, this posts the
 * brief onto the issue and labels it `ready-to-build` for a human/session to pick up.
 *
 * Usage:
 *   node scripts/build-issue.mjs <issue-number>   # prepare/dispatch one issue
 *   node scripts/build-issue.mjs --next            # pick the next buildable priority issue
 *
 * `selectBuildable` and `buildBrief` are pure so they can be unit-tested.
 */

import { execFileSync } from 'node:child_process'

const REPO = process.env.GITHUB_REPOSITORY || 'nyahn01/provenance-tracker'
const API = 'https://api.github.com'
const DRY = process.argv.includes('--dry-run') || !process.env.GITHUB_TOKEN

const agentOf = (labels = []) =>
  labels.map(l => (typeof l === 'string' ? l : l.name)).find(n => n.startsWith('agent:')) || 'agent:unassigned'

/**
 * Pick buildable priority issues: open, not `paused`, oldest first, capped.
 * @returns {Array<{number:number,title:string,agent:string}>}
 */
export function selectBuildable(issues, cap = 3) {
  return issues
    .filter(it => !(it.labels || []).map(l => (typeof l === 'string' ? l : l.name)).includes('paused'))
    .sort((a, b) => a.number - b.number)
    .slice(0, cap)
    .map(it => ({ number: it.number, title: it.title, agent: agentOf(it.labels) }))
}

/** Assemble the build brief a coding agent receives. Pure string. */
export function buildBrief(issue) {
  const agent = agentOf(issue.labels)
  const slug = (issue.title || 'change').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return [
    `# Build task — issue #${issue.number}: ${issue.title}`,
    ``,
    `You are the \`${agent}\` owner. Implement this as ONE coherent change.`,
    ``,
    `## Issue`,
    (issue.body || '(no description)').trim(),
    ``,
    `## Rules (non-negotiable)`,
    `- Branch: \`feat/${agent.replace('agent:', '')}/${slug}\`.`,
    `- Types-first; obey the honesty contract (every fact sourced, no invented data, custody ≠ loan).`,
    `- Run the gates and make them pass: \`npm run honesty\` && \`npm run build\` && \`npm test\`.`,
    `- Open a **draft** PR that \`Closes #${issue.number}\`. Do NOT merge — a human merges.`,
    `- Conventional commit; one PR per issue.`,
  ].join('\n')
}

async function gh(path, init) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status} ${await res.text()}`)
  return res.json()
}

/** Dispatch one prepared issue: run the configured coding agent, or post the brief. */
export async function dispatch(issue) {
  const brief = buildBrief(issue)
  const cmd = process.env.BUILD_AGENT_CMD
  if (cmd && !DRY) {
    // BYO coding agent: hand it the brief in the checked-out repo. The agent branches,
    // implements, runs gates, and opens the draft PR. Not exercised in CI here.
    console.log(`[build-issue] #${issue.number}: invoking BUILD_AGENT_CMD`)
    execFileSync(cmd, [], { input: brief, stdio: ['pipe', 'inherit', 'inherit'], shell: true })
    return
  }
  if (DRY) { console.log(`[build-issue] #${issue.number} [dry-run] brief:\n${brief}\n`); return }
  // No agent configured → hand the brief to a human/session via the issue.
  await gh(`/repos/${REPO}/issues/${issue.number}/comments`, { method: 'POST', body: JSON.stringify({ body: `**Ready to build.** No \`BUILD_AGENT_CMD\` configured, so here is the build brief for a human or a Claude Code session:\n\n${brief}` }) })
  await gh(`/repos/${REPO}/issues/${issue.number}/labels`, { method: 'POST', body: JSON.stringify({ labels: ['ready-to-build'] }) })
  console.log(`[build-issue] #${issue.number}: posted brief + labeled ready-to-build`)
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || (!args.some(a => /^\d+$/.test(a)) && !args.includes('--next'))) {
    console.log('Usage: node scripts/build-issue.mjs <issue-number> | --next')
    process.exit(args.includes('--help') ? 0 : 1)
  }
  if (DRY && !args.some(a => /^\d+$/.test(a))) {
    console.log('[build-issue] dry-run needs an explicit <issue-number> (no token to query --next)')
    return
  }
  let issue
  const num = args.find(a => /^\d+$/.test(a))
  if (num) {
    issue = DRY ? { number: Number(num), title: `issue ${num}`, body: '(dry-run: body not fetched)', labels: [] } : await gh(`/repos/${REPO}/issues/${num}`)
  } else {
    const prio = await gh(`/repos/${REPO}/issues?state=open&labels=priority&per_page=50`)
    const next = selectBuildable(prio, 1)[0]
    if (!next) { console.log('[build-issue] no buildable priority issues'); return }
    issue = await gh(`/repos/${REPO}/issues/${next.number}`)
  }
  await dispatch(issue)
}

import { fileURLToPath } from 'node:url'
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => { console.error('[build-issue]', e.message); process.exit(1) })
}
