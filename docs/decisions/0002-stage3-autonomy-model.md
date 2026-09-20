# 0002 — Stage-3 autonomy model (self-sustaining, human-gated)

- Status: proposed
- Date: 2026-06-27

## Context
The platform runs in two stages today (see `/about`):
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

## Update — Stage-3 build loop wired (event-driven Act) + cheaper curation
Two changes turn the ACT loop from brief-only into a real, still-human-gated builder, and cut
recurring cost:
- **`.github/workflows/build-agent.yml` (new).** The `ready-to-build` label the runner already
  emits now triggers the official Claude Code Action (`anthropics/claude-code-action@v1`) to
  implement the issue on a branch and open a **draft** PR. This replaces the synchronous
  `BUILD_AGENT_CMD` child-process hook with a decoupled, properly-permissioned workflow (that hook
  remains as a self-hosted alternative). The workflow reads the **same one dial**: it is **inert
  unless `mode` = `event-driven`**, `paused` = false, `auto_build.enabled` = true, and an
  `ANTHROPIC_API_KEY` secret exists — so merging it changes nothing at today's `scheduled` mode.
  **Activation is one deliberate line** (`mode` → `event-driven`), reversible the same way. The
  blocking honesty + build + test gates still stand between a draft PR and merge, and **a human
  always merges** — the moat is unchanged. Note: for the gates to auto-run on the agent's PR, the
  Claude GitHub App should author it (`/install-github-app`); otherwise `protect-main` holds the PR
  unmergeable until the checks run — it fails **safe**.
- **Curation cost.** `CURATE_MODEL` now defaults to `claude-haiku-4-5` (was `claude-sonnet-5`):
  prose→chain is structured extraction and every draft is human-reviewed before promotion, so the
  cheapest tier carries the first pass; bump to Sonnet/Opus via the env var for a hard audited case.
  The autonomous *builder* stays on a capable tier (Sonnet, via `BUILD_MODEL`) — cheap extraction,
  capable coding.

Cost note (unchanged principle): the Sense/Decide/Feedback/metrics loop is deterministic and free;
the only metered spend is interactive sessions (Max plan) and — once Stage 3 is activated — the
per-issue build runs (Anthropic API credits, bounded by `max_prs_per_run` × the model's `--max-turns`).

## Update — simplified to sense-only (2026-09-18 review)

The loop was reviewed after 86 scheduled runs. It ran green every single time and produced
**zero pull requests**. What it did produce was ~228 duplicate comments across three issues
(#112: 77, #115: 76, #149: 75). Four defects, in order of damage:

1. **No idempotency on the Act step.** `dispatch()` in `scripts/build-issue.mjs` posted its
   build brief unconditionally, while the Sense step guarded every filing with a
   `<!-- sentinel:id -->` marker. One comment per issue per run, forever.
2. **The loop consumed its own output.** The Decision digest (#112) is generated by the
   orchestrator. Once it carried `priority`, the orchestrator dispatched it back to a build
   agent as a feature request, on a branch named `feat/unassigned/decision-digest-next-up`.
3. **Head-of-queue starvation.** `selectBuildable` sorted ascending by issue number and took
   three. Three permanently-open issues held all three slots for 77 consecutive runs, so
   #202 (two high dependency vulnerabilities) and #228 (a real user data-correction report)
   were never once dispatched.
4. **Config describing code that did not exist.** `autonomy.*` (the `auto-on-green` tiers),
   `outcome.retro_enabled`, `outcome.metrics_cron` and `cadence.max_token_budget_per_run`
   were read by no code path. The file documented a system nobody had built.

Defects 1-3 are now fixed (marker-guarded brief, `ready-to-build` removed from the queue,
covered by `tests/build-issue.test.ts`). Defect 4 is fixed by deletion: every remaining key in
`.claude/orchestration.json` is read by code, and merge policy lives in ADR 0001 plus the
`protect-main` ruleset, which is where it is actually enforced.

### The decision
`decision.auto_build.enabled` → **false**. Cron daily → **weekly**. The loop is now
**Sense + Decide only**: six deterministic, read-only, free sentinels scan `main`, file
idempotent issues, auto-promote security and honesty findings, and refresh one digest. It
stays silent otherwise. Act stays with a human opening a session, which is where every
merged PR has come from.

### The lesson worth keeping
The Act step was wired last and stubbed, so the only output it could physically emit was a
comment. Nothing closed the issues it commented on, so it emitted the same comment forever.
Underneath that, the queue held no issue a coding agent could finish: "the globe design need
improvement, from scratch" (#115) is a design direction, and #112 is a generated report.
**An autonomy loop is capped by the quality of its queue, not by the capability of its
builder.** Re-enable `auto_build` only alongside a real builder AND a queue of well-formed,
single-PR issues. Reverting this simplification is the same one-line flip it always was.

## Update — routing moved to intake, hand-applied queue labels removed

A follow-up to the review above, from the same question: why did #228 sit for days?

It had not sat unrouted. The form filed it, the cron labelled it `agent:provenance-data`
about an hour later, and a human added `priority` two days after that. It was never picked
up because of the head-of-queue starvation in defect 3, not because of any label.

But tracing it exposed the real cost of the label ceremony. Seven labels were in the flow
(`feedback`, `agent:<domain>`, `triage-queued`, `priority`, `ready-to-build`, `proposal`,
`paused`) and **their only consumer was the auto-builder, which is now off**. The maintainer
was hand-applying `priority` for a reader that no longer exists.

Two changes:

**Routing happens at intake.** `classifyDomain` moved into `src/lib/feedback-routing.ts`
and is called by `/api/feedback`, so a submission is *born* carrying `feedback` +
`agent:<domain>`. The wait on a cron interval is gone, and so is the scheduled step: the
scripts-side router it came from, and the orchestrator's feedback block, were both deleted
rather than kept as a duplicate backstop. One consumer, one home. An Issue filed directly
on GitHub gets no `agent:` label, which is fine — it is a hint, not a gate.

**No queue label is applied by hand.** `triage-queued` is gone with the step that wrote it.
`priority` survives only as the security/honesty sentinels' own escalation marker, which they
apply themselves. Nothing is left for the maintainer to label.

The queue is now the open Issues list, ordered on the Projects board. What starts work is a
human opening a session and naming an Issue number — which is what actually started every
merged PR in this repo's history. The label vocabulary on `/about` was corrected to match.

### The lesson
The ceremony was not overhead *around* the loop; it was the loop's input format, left behind
when the loop stopped reading it. **When you switch a consumer off, delete what fed it, or the
producer keeps paying.** That producer was a person.
