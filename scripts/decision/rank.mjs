/**
 * decision head — the "what to do next" step of the loop.
 *
 * Ranks open `proposal` issues by transparent heuristics and recommends the next
 * one to promote to `priority`. It does NOT promote or merge anything — a human
 * still decides. The orchestrator publishes the ranking into a single, in-place
 * "Decision digest" issue each run.
 *
 * `scoreProposal` / `rankProposals` are pure so they can be unit-tested.
 */

// Domain weight from the sentinel/source that produced the proposal. Security and
// honesty rank highest (they protect the moat); hygiene/docs lowest.
const KIND_WEIGHT = [
  { re: /^\[sentinel\]\s*security/i, kind: 'security', weight: 50 },
  { re: /^\[sentinel\]\s*honesty/i, kind: 'honesty', weight: 45 },
  { re: /^\[sentinel\]\s*data-quality/i, kind: 'data-quality', weight: 30 },
  { re: /^\[feedback\]/i, kind: 'feedback', weight: 25 },
  { re: /^\[sentinel\]\s*docs-drift/i, kind: 'docs', weight: 15 },
  { re: /^\[sentinel\]\s*repo-hygiene/i, kind: 'hygiene', weight: 10 },
]

function kindOf(title) {
  for (const k of KIND_WEIGHT) if (k.re.test(title || '')) return k
  return { kind: 'other', weight: 20 }
}

/**
 * Score one proposal. Transparent + deterministic:
 *   base kind weight + engagement (comments + reactions, capped) + mild age nudge.
 * @param {{title:string, comments?:number, reactions?:number, ageDays?:number}} issue
 */
export function scoreProposal(issue) {
  const { weight, kind } = kindOf(issue.title)
  const engagement = Math.min(20, (issue.comments || 0) * 3 + (issue.reactions || 0) * 2)
  const age = Math.min(10, Math.floor((issue.ageDays || 0) / 7)) // +1 per week stale, capped
  return { score: weight + engagement + age, kind }
}

/**
 * Rank proposals highest-first. `nowMs` is passed in (scripts can't call Date.now
 * deterministically in tests); each issue may carry createdAtMs for the age nudge.
 * @returns {Array<{number:number,title:string,score:number,kind:string}>}
 */
export function rankProposals(issues, nowMs = 0) {
  return issues
    .map(it => {
      const ageDays = nowMs && it.createdAtMs ? (nowMs - it.createdAtMs) / 86_400_000 : 0
      const comments = it.comments || 0
      const reactions = it.reactions?.total_count ?? it.reactions ?? 0
      const { score, kind } = scoreProposal({ title: it.title, comments, reactions, ageDays })
      return { number: it.number, title: it.title, score, kind }
    })
    .sort((a, b) => b.score - a.score)
}

/** Render the ranking as a Markdown digest body (idempotent content). */
export function renderDigest(ranked) {
  if (!ranked.length) return 'No open `proposal` issues. The queue is clear. 🎉\n\n<!-- decision-digest -->'
  const top = ranked[0]
  const rows = ranked.slice(0, 15).map((r, i) =>
    `${i + 1}. #${r.number} — ${r.title}  \n   _${r.kind}, score ${r.score}_`).join('\n')
  return [
    `## 🧭 Decision digest`,
    ``,
    `**Recommended next → promote #${top.number}** (\`${top.kind}\`, score ${top.score}) to \`priority\`.`,
    ``,
    `Ranked open proposals (a human promotes; nothing here is automatic):`,
    ``,
    rows,
    ``,
    `_Scored by: source kind (security/honesty highest) + engagement + staleness. Regenerated each orchestrator run._`,
    ``,
    `<!-- decision-digest -->`,
  ].join('\n')
}
