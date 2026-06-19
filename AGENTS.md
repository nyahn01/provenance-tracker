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
  `draft/DESIGN_SYSTEM.md`. If it's not in the system, ask `design-director` to add it.

## Knowledge capture (never lose an insight)

- Every agent appends findings/decisions/dead-ends to `draft/INSIGHTS.md` the moment they
  occur — chat is volatile, files are the record. Durable facts also go to `memory/`.
- Decisions that change the spec also update the owning doc (CLAUDE.md, BUSINESS_CASE.md,
  DESIGN_SYSTEM.md, DATA_SOURCES.md). Wikilink with `[[...]]` so the Obsidian graph connects them.
- `draft/INSIGHTS.md` is the running knowledge log (what was learned/decided/dead-ended).

## The build loop (one task at a time)

1. **Plan** the next change (the approved plan lives in `.claude/plans/`).
2. **Build** — route to the owning agent. One coherent change at a time.
3. **Gate** — ship via `node scripts/ship.mjs --push --commit "<msg>"`. Red → fix → re-run.
   For anything touching claims/data, the honesty grep in `verify.mjs` must pass; for bigger
   surface changes, also run `provenance-honesty-review` and obey a BLOCK.
4. **Log** — append findings/decisions to `draft/INSIGHTS.md`; update the owning spec doc if the
   change alters it; durable facts → `memory/`.

## What the human checks

`git log --oneline` (every commit is gate-verified), `npm run verify` (live gate), and a
spot-check of the app. `draft/INSIGHTS.md` is the knowledge trail.

## Honesty is the product

The only real asset is credibility: real, sourced, dated data — honest about gaps.
Every agent defers to `provenance-honesty-review` and to the honesty grep in the gate.
Protecting that matters more than any single demo beat or shipped feature.

## Cost discipline

Token budget goes to **building and verifying**, not open-ended web search. Strategy
reflection in step 5 is deliberately small. No multi-source research fan-out unless a
human explicitly asks for it.
