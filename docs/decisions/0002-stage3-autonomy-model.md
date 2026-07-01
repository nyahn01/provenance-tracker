# 0002 — Stage-3 autonomy model (self-sustaining, human-gated)

- Status: proposed
- Date: 2026-06-27

## Context
The platform runs in two stages today (see `/team`):
- **Stage 1 · Active** — agents invoked per session in Claude Code.
- **Stage 2 · Scheduled** — the batch workflow reads the GitHub-Issues queue
  (`priority` + `agent:<domain>`), routes to specialists, opens PRs; a human merges.

"Stage 3 · Vision" is a fully event-driven, self-sustaining, *improving* system. The risk
is that "autonomous" erodes the one thing the product sells — credibility. So this ADR fixes
the model **before** the wiring, so autonomy can be turned up without ever turning the
honesty contract down.

**Principle: autonomy is a dial, and the thing it turns up is _initiation_, never _veto_.**
Today a human initiates (opens a session, promotes an issue, clicks merge). Stage 3 removes
the human as *initiator* while keeping them as the *gate*.

## Decision

### 1. Three loops must close
The system today has **Act**. Stage 3 adds **Sense** and a real **Outcome** signal:
- **Sense** — work originates without a human typing it: feedback auto-triage, plus
  scheduled **self-audit sentinels** that file issues themselves (`data-quality-sentinel`,
  `honesty-regression-sentinel` — `.claude/agents/`).
- **Decide** — a generativity source (the deferred `product-visionary` + `vision-critic`
  from `docs/VISION.md`) emits `proposal` issues; a human promotes to `priority`.
- **Act + Outcome** — the loop must not end at merge. **Wired (first cut):** `npm run metrics`
  (`scripts/metrics.mjs`) computes an offline custody-chain health snapshot to
  `metrics/latest.json`; the `retro` agent (`.claude/agents/retro.md`) turns merged-PR outcomes
  + that snapshot into `docs/INSIGHTS.md` lessons. Still to add: runtime/product signals
  (Vercel Speed Insights is already in — extend with error monitoring, search-success rate,
  honesty-gate pass rate, feedback volume). Without an outcome signal the system can *change*
  but not *improve*.

### 2. Cooperation model — "editor-in-chief + autonomous newsroom"
| Humans own | Agents own |
|---|---|
| Vision / north-star (`docs/VISION.md`) | Sensing, triage, proposing |
| **Promotion** (`proposal → priority`) | Building, reviewing (honesty gate) |
| **Merge** to `main` | Measuring outcomes, writing lessons |
| Closing `feedback` issues | Everything up to an irreversible/outward boundary |

**Invariant:** agents may do anything *except* cross an irreversible or outward-facing line —
merge to `main`, close a user's issue, publish — without a human. This is **supervised
autonomy**: continuous operation, human as gate not initiator. The `protect-main` ruleset
(ADR 0001) and the blocking honesty gate enforce it mechanically.

### 3. Graduated autonomy by risk tier
The human merge-gate **narrows** as trust grows, per `.claude/orchestration.json → autonomy`:
- `auto-on-green` tiers (e.g. `docs`, `deps`) may auto-merge when **every** gate passes.
- `human` tiers (anything touching `provenance_data`, `honesty_surface`, the `globe`) stay
  human-merged **forever** — that is the credibility moat, never spent for convenience.

### 4. One dial for the mode — `.claude/orchestration.json`
A single config switches Stage 1/2/3 with no code change:
- `mode`: `manual` (Stage 1, session-only) · `scheduled` (Stage 2, cron) · `event-driven`
  (Stage 3, issue/webhook-triggered).
- `paused`: global kill-switch (the per-item `paused` *label* already exists for one issue).
- `cadence`: cron + hard `max_token_budget_per_run` / `max_prs_per_run` caps.
- `.github/workflows/orchestrate.yml` reads this file and is **inert unless** `mode` is
  `scheduled`/`event-driven` and `paused` is false. Flip the value → switch modes, reversibly.

### 5. Guardrails (non-negotiable)
- Honesty gate stays **blocking** on every PR, and a sentinel re-checks it off-cycle.
- Hard token/$ budget + PR-count caps per run (cost is real — see Consequences).
- `paused` kill-switch and per-item `paused` label.
- Sentinels and the visionary layer are **read-only on product code** and file issues only;
  they never build or merge.

## Consequences
- **Cost ceiling is real.** The Max plan covers *interactive* Claude Code, not headless CI
  agent runs. Anthropic API credits were restored 2026-06-27, so funding is no longer the
  blocker — but the Stage 2/3 orchestration runner (`.github/workflows/orchestrate.yml`) still
  stays a STUB and `mode` stays `manual` **by choice** until we decide to run it. The dial exists
  so flipping it later is a one-line change, not a rebuild.
- **Strict-approval path.** To let a human *approve* (not just merge) auto-tier PRs, give
  agents a separate bot identity (ADR 0001 already notes this) so PRs aren't self-authored.
- The scaffold added here (`orchestration.json`, the workflow skeleton, the two sentinel
  specs) is wiring + design only — no agent is executed, no secret is used, nothing is merged
  autonomously yet. Promotion to Stage 2/3 is a deliberate, human, reversible flip.

## Update — Stage-2 Sense loop activated (#91)
The dial was flipped: `mode` → `scheduled`, both sentinels `enabled: true`. The runner
(`scripts/orchestrate.mjs`) replaces the stub — the read-only sentinels
(`scripts/sentinels/*.mjs`) scan `main` on the daily cron and file idempotent issues
(data-quality → `proposal`, honesty-regression → `priority`), capped by `max_prs_per_run`.
The sentinels are deterministic (no Claude spend) and never edit code, merge, or close.
Reverting is the same one-line flip (`mode` → `manual`, or `paused: true`).

## Update — full loop wired (#104–#109, #107)
The loop now runs **Sense → Feedback → Auto-promote → Decide → Act** on the cron:
- **Sense** — six read-only sentinels (data-quality, honesty-regression, security, docs-drift,
  repo-hygiene, stale-plans) file idempotent, capped issues.
- **Feedback** — raw `feedback` issues get an `agent:<domain>` owner + `triage-queued`.
- **Auto-promote** — `security`/`honesty` proposals auto-promote to `priority`
  (`decision.auto_promote`); every other domain stays the human's button.
- **Decide** — open proposals are ranked into a single "Decision digest" recommending the next
  promotion.
- **Act** — `decision.auto_build` (**OFF by default**) dispatches buildable `priority` issues to a
  bring-your-own coding agent (`BUILD_AGENT_CMD`) that opens a **draft** PR; with no agent configured
  it posts the build brief + `ready-to-build`. **A human always merges** — the moat is unchanged.
All autonomy is opt-in per flag and reversible in one line. The coding agent itself is BYO and not
bundled/verified in CI.
