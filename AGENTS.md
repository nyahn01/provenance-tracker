# Provenance Tracker — Agent Team & Constant-Improvement Loop

Five specialists live in `.claude/agents/`. You (the main session) are the orchestrator:
you plan, route work to the right agent, and run the review gate. Spawn agents with the Agent
tool by `subagent_type`; continue an existing one with SendMessage so it keeps its context.

## The team

| Agent | Owns | Model |
|---|---|---|
| `provenance-globe` | Globe.gl visuals, pins/arcs, panels, responsive, design-token fidelity | sonnet |
| `provenance-data` | Wikidata/Met/AIC integration, reconciliation, caching, rate limits, Claude route | sonnet |
| `provenance-strategy` | Business case, market/competitor research, positioning, pivots | opus |
| `provenance-story` | Demo script, pitch, hero-work selection, judging-criteria fit | opus |
| `provenance-honesty-review` | BLOCKING credibility gate before any commit/record/pitch change | opus |

## Routing rules

- UI/visual task → `provenance-globe`. Data/API/model task → `provenance-data`.
- "Is this real / who pays / how to position" → `provenance-strategy`.
- "How do we present it" → `provenance-story`.
- Before ANY commit, demo recording, or pitch edit → `provenance-honesty-review` (it can BLOCK).
- A feature touching both data and UI: `provenance-data` defines the data shape first, then `provenance-globe`
  renders it. Never let the UI invent data to look finished.

## The constant-improvement loop (run every working session)

1. **Read in:** CLAUDE.md → TONIGHT.md/TOMORROW.md → MEMORY.md → BUSINESS_CASE.md → PROGRESS.md.
2. **Plan:** pick the next item from TOMORROW.md priority order (priority 0 = honest unscripted path).
3. **Build:** route to the owning agent. One feature at a time.
4. **Gate:** run `provenance-honesty-review` on the diff + running app. If BLOCK, fix before commit.
5. **Verify:** `npm run build` clean; exercise the unscripted-search path live.
6. **Commit & push** per feature (small commits).
7. **Retro:** append to PROGRESS.md — what shipped, what broke, what the honesty gate caught,
   one improvement to the *process or an agent prompt* itself.
8. **Improve the team:** if the gate caught the same class of issue twice, tighten the relevant
   agent's prompt in `.claude/agents/`. The team gets sharper over time, not just the app.

## Honesty is the product

The only real asset is credibility: "real, sourced, dated data — and honest about gaps." Every agent
defers to `provenance-honesty-review`. Protecting that is more important than any single demo beat.

## Note on /batch
This repo is now git-initialized, so `/batch` works: it spawns these agents in isolated worktrees
and opens a PR per task. Good for parallel, independent features (e.g. globe polish + a new data
source) reviewed separately. Use the honesty gate on each resulting PR.
