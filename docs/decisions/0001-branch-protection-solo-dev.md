# 0001 — Branch protection for a solo maintainer with AI agents

- Status: accepted
- Date: 2026-06-26

## Context
`main` auto-deploys to Vercel production, and AI agents open PRs under the maintainer's
own GitHub account. We want a hard guard so nothing unreviewed or red reaches `main`,
without locking out the (single) human maintainer. The repo uses a GitHub **ruleset**
named `protect-main` (status: **Active**).

A naive "require N approvals" rule is a trap for a solo repo: GitHub forbids approving
your own PR and there is no second reviewer, so the maintainer could be unable to merge
anything — including agent PRs.

## Decision
The `protect-main` ruleset enforces, on `main`:
- Require a pull request before merging (blocks direct pushes — agents must PR).
- Require status checks: **Provenance honesty check** + **Build check**.
- Block force pushes; restrict deletions.
- **Do NOT require PR approvals / code-owner review** (would lock out the solo maintainer).
- Maintainer (Repository admin role) is on the bypass list.

The human gate is **reviewing the Vercel preview and clicking Merge** once CI is green —
not a formal approval. Agents are instructed never to merge.

## Consequences
- `.github/CODEOWNERS` is dormant while approvals are off (code-owner review only triggers
  when approvals are required). Kept for the day a reviewer/bot is added.
- To move to a strict "require approval" model later, give agents a **separate bot identity**
  to author PRs so the human can approve them (no longer self-authored). Revisit then.
- "Evaluate" enforcement is an org/Enterprise dry-run feature and is not used here.
