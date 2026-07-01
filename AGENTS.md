# Provenance Tracker — Agent Team & Self-Improving Loop

Specialists live in `.claude/agents/`. The main session is the orchestrator (the "AI
engineer"): it plans, routes work, and drives the loop. But **no agent — including the
orchestrator — decides for itself that work is done.** A machine does. See "The
ship gate" below. This is the rule that lets agents commit on their own overnight
without a human checking each one.

## The team

**Build / craft**
| Agent | Owns | Model |
|---|---|---|
| `design-director` | Visual language, type system, museum-grade art direction, DESIGN_SYSTEM.md | opus |
| `provenance-globe` | Front-end implementation: globe, panels, search, responsive (builds to the design system) | sonnet |
| `dataviz-engineer` | Information design: provenance timeline, movement arcs/map, gap & conflict viz | sonnet |
| `provenance-data` | Back-end + data: Wikidata/Met/AIC/+new sources, reconciliation, caching, contract | sonnet |

**Domain experts (advisory + review — invoked for direction and critique, not every cycle)**
| Agent | Owns | Model |
|---|---|---|
| `art-historian` | Provenance scholarship, source credibility tiers, meaningfulness of a journey | opus |
| `art-insurance-advisor` | Underwriting reality — what insurers pay for, what's not credible | opus |
| `provenance-strategy` | Business case, market/competitor research, positioning, pivots | opus |

**Narrative & gate**
| Agent | Owns | Model |
|---|---|---|
| `provenance-story` | Demo script, pitch, hero-work selection, judging-criteria fit | opus |
| `provenance-honesty-review` | BLOCKING credibility gate before any commit/record/pitch change | opus |

**Operations**
| Agent | Owns | Model |
|---|---|---|
| `feedback-triage` | Reviews open `feedback`-labeled GitHub issues (from the in-app form), writes valid ones to `feedback/`, opens a PR. On-demand. | sonnet |

## The ship gate — the one rule that makes agents trustworthy

`node scripts/ship.mjs --commit "<conventional message>"`

It runs, in order: **build → start server → `verify.mjs` (live contract + honesty
greps) → commit only if all green.** Exit 1 = BLOCKED, nothing committed.

- Agents **must never `git commit` directly.** Every commit goes through `ship.mjs`,
  so every commit on the branch is provably build-clean, contract-valid, and honest.
- An agent's prose report ("I built X") is a **proposal**, not a result. The gate is
  the result. If `ship.mjs` is red, the work does not exist — the agent fixes and re-runs.
- The contract lives in `src/lib/types.ts`. Agents import shapes from there and never
  invent a shape the other side doesn't implement. (This is what broke before:
  the globe called `?source=&id=` while the route read `?q=` and served fake data.)

**The one sanctioned exception:** `feedback-triage` commits *docs-only* files under
`feedback/` on a PR branch via plain `git` + `gh` — never `src/`, never config. The
human-reviewed PR plus the `honesty-gate.yml` CI run give the same "main stays green"
guarantee `ship.mjs` enforces for code. All product-code commits still go through `ship.mjs`.

## Feedback triage (on-demand)

Run when you want to process incoming feedback: invoke `feedback-triage`. It reads open
GitHub issues labeled `feedback` (filed by visitors via the `/feedback` form → `/api/feedback`),
judges each, writes the genuinely useful ones to `feedback/YYYY-MM-DD-<slug>.md`, and opens a
single PR for you to review and merge. Spam/duplicates/out-of-scope are noted in the PR (not
silently dropped) and their issues left open. Not scheduled — scheduled triage would need an
Anthropic key with credits.

## Routing rules

- Visual language / "make it world-class" / redesign → `design-director` (sets the system),
  then `provenance-globe` (app UI) and `dataviz-engineer` (timeline/map/graph) build to it.
- Data/API/model/new sources → `provenance-data`. Source credibility → `art-historian`.
- "Would an insurer buy this / what do they need" → `art-insurance-advisor`.
- "Is this real / who pays / how to position" → `provenance-strategy`.
- "How do we present it" → `provenance-story`.
- Any feature touching data + UI: `provenance-data` defines/extends `src/lib/types.ts`
  FIRST, then UI agents render it. Never let the UI invent data to look finished.
- Design freelancing is banned: `provenance-globe`/`dataviz-engineer` style only from
  `docs/DESIGN_SYSTEM.md`. If it's not in the system, ask `design-director` to add it.

## Knowledge capture (never lose an insight)

- Every agent appends findings/decisions/dead-ends to `docs/INSIGHTS.md` the moment they
  occur — chat is volatile, files are the record. Durable facts also go to `memory/`.
- Decisions that change the spec also update the owning doc (CLAUDE.md, BUSINESS_CASE.md,
  DESIGN_SYSTEM.md, DATA_SOURCES.md). Wikilink with `[[...]]` so the Obsidian graph connects them.
- `docs/INSIGHTS.md` is the running knowledge log (what was learned/decided/dead-ended).
- **Capture recommendations as issues.** In-session ideas are ephemeral — the moment a plan or
  recommendation is agreed, file it as an open `proposal` issue (with `agent:<domain>`) so it is not
  lost. Use `npm run plan-to-issue <file.md>` or the GitHub API directly. A human promotes to
  `priority`.
- **Graduated auto-promotion.** The orchestrator auto-promotes the high-stakes/low-ambiguity
  sentinels' proposals (`security`, `honesty`) to `priority`; every other domain stays the human's
  button, guided by the daily Decision digest. Auto-promotion never merges — a human always merges
  (`.claude/orchestration.json → decision.auto_promote`).

## The build loop (one task at a time)

1. **Plan** the next change — write the approved plan to `.claude/plans/YYYY-MM-DD-<slug>.md`
   (see `.claude/plans/README.md`) **before** implementation starts. The plan file is transient
   scratch — the shared contract while building; if implementation drifts, update the plan and
   re-confirm with the human first. When the sprint ships, the durable record is the closed issue
   (and an ADR/INSIGHTS if a rule changed) — **delete the dated plan file** (the `stale-plans`
   sentinel flags any left behind).
2. **Build** — route to the owning agent. One coherent change at a time.
3. **Gate** — ship via `node scripts/ship.mjs --push --commit "<msg>"`. Red → fix → re-run.
   For anything touching claims/data, the honesty grep in `verify.mjs` must pass; for bigger
   surface changes, also run `provenance-honesty-review` and obey a BLOCK.
4. **Log** — append findings/decisions to `docs/INSIGHTS.md`; update the owning spec doc if the
   change alters it; durable facts → `memory/`.

## What the human checks

`git log --oneline` (every commit is gate-verified), `npm run verify` (live gate), and a
spot-check of the app. `docs/INSIGHTS.md` is the knowledge trail.

## Honesty is the product

The only real asset is credibility: real, sourced, dated data — honest about gaps.
Every agent defers to `provenance-honesty-review` and to the honesty grep in the gate.
Protecting that matters more than any single demo beat or shipped feature.

## Cost discipline

Token budget goes to **building and verifying**, not open-ended web search. Strategy
reflection in step 5 is deliberately small. No multi-source research fan-out unless a
human explicitly asks for it.

## Running the batch squad

The squad spawns one agent per domain from the priority Issues, in parallel.
- **Queue = GitHub Issues** labeled `priority` + `agent:<domain>` (`paused` to skip). Not a file.
- **Run:** `/workflow batch-agent-squad` (one-off), or the `provenance-batch-agents` scheduled task
  (`~/.claude/scheduled-tasks/…`). The workflow reads `gh issue list --label priority`.
- **Each agent:** reads its Issue → branches `feat/<domain>/issue-<N>` → ships via `ship.mjs` →
  opens a PR with `Closes #N`. The honesty gate reviews; the human merges. An empty queue is a no-op.
- **Pause:** add the `paused` label to an Issue, or disable the scheduled task.
- Run concurrent file-mutating agents in separate git worktrees so they don't collide.

## Pause & escalation

Agents stop and ask the orchestrator (comment on the PR/Issue) when: a decision needs a human
(two viable designs), a change spans data + UI (data defines the type first), a real blocker
appears (rate limit, sourcing gap), or honesty is genuinely ambiguous (ask
`provenance-honesty-review`, don't guess). Never pause for local test fixes, equivalent-
implementation choices, or token tweaks.

## Git & branches

Branch naming, the ship gate, PR→merge, rebase, and revert conventions live in
`docs/GIT_WORKFLOW.md`.
