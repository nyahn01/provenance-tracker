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
- MORNING.md = what shipped (status). INSIGHTS.md = what was learned (knowledge). Both per cycle.

## The self-improving loop (one cycle = one backlog item)

The loop runs unattended (overnight). Each cycle:

1. **Pick** the top unchecked item from `draft/TOMORROW.md` (priority 0 = honest
   unscripted-search path; never skip a P0 to do polish).
2. **Build** — route to the owning agent. One item at a time.
3. **Gate** — agent runs `node scripts/ship.mjs --commit "<msg>"`. Red → fix → re-run.
   For anything touching claims/data, the honesty grep in `verify.mjs` must pass; for
   bigger surface changes, also run `provenance-honesty-review` and obey a BLOCK.
4. **Log** — append a one-line result to `draft/MORNING.md` (see its header for format):
   what shipped, gate verdict, commit hash, or why it's blocked.
5. **Improve the idea, not just the code** — every 3rd cycle, `provenance-strategy`
   spends a SMALL budget (no expensive fan-out research) reflecting on the current
   build + `BUSINESS_CASE.md` and either (a) sharpens the next priorities in
   `TOMORROW.md`, or (b) flags a wrong assumption. Direction self-corrects too.
6. **Improve the team** — if the gate catches the same class of issue twice, tighten
   the offending agent's prompt in `.claude/agents/` and note it in `MORNING.md`.

## What the human checks in the morning

Open `draft/MORNING.md`. It is the single report. For each cycle it shows the gate
verdict and commit. Then: `git log --oneline`, `npm run verify`, and spot-check the
live app. Anything marked **BLOCKED** is where human judgment is needed.

## Honesty is the product

The only real asset is credibility: real, sourced, dated data — honest about gaps.
Every agent defers to `provenance-honesty-review` and to the honesty grep in the gate.
Protecting that matters more than any single demo beat or shipped feature.

## Cost discipline

Token budget goes to **building and verifying**, not open-ended web search. Strategy
reflection in step 5 is deliberately small. No multi-source research fan-out unless a
human explicitly asks for it.
