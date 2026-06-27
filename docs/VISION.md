# Vision — north star

The shared north star every agent reads before deciding what to build. It encodes
*why* this project exists and *where it must not go*. For the binding mechanical rules
see `CLAUDE.md` (honesty gate, design tokens, globe contract); this file is the intent
behind them — one fact, one home, so this never restates a rule that lives there.

## Mission

Make the hidden journeys of famous artworks **visible, dated, and fully sourced** — a
chain of custody you can trust because every link names where it came from. Provenance
research is normally locked in scattered museum prose, dealer ledgers, and structured
open data; this project reconciles those into one honest, legible story per work.

Honesty is the moat. Anyone can draw arcs on a globe; the value is that a curator,
educator, or due-diligence analyst can believe what they see because gaps are shown,
not filled, and ownership is never confused with a loan.

## Who it's for

- **Museums & educators** — a credible teaching object for how provenance actually works.
- **The art-curious** — the story of where a masterpiece has been, told beautifully.
- **Future B2B due-diligence** — a method proof-of-concept for the work underwriters,
  registrars, and auction houses pay for. Not built yet; the architecture leaves room.

## Non-goals (the guardrails)

- **No live "where is it now."** No public API supports real-time cross-museum display
  status, so we never claim it. Facts are dated and attributed, or shown as a gap.
- **Not insurance-grade.** No risk scores, no invented coordinates or dates, no
  exhaustive coverage. A proof of method, not a system of record.
- **No faked completeness.** Sparse data reads as a gap with a note — never smoothed over.

## How we build (so the team shares the vision)

A small team of specialized agents proposes and builds against these rules; a human
gates every merge. The honesty check (`npm run honesty`, CI on every PR) enforces the
non-goals mechanically so credibility can't erode by accident.

### Proposing new direction — `proposal → priority`

Ideation is separated from execution so the system can suggest a *better* direction
without running away with it:

- A forward-looking idea is filed as an **open GitHub Issue labeled `proposal`** (not
  `priority`). It is a suggestion, not queued work.
- The **human promotes** an idea by relabeling it `priority` + `agent:<domain>`. Only
  then does the batch workflow pick it up (see `CLAUDE.md` → *Work tracking*).
- Agents open PRs; the human merges. The promotion gate and the merge gate are the two
  human checkpoints that keep the agent team a teammate, not an autopilot.

This reuses today's GitHub-Issues queue — no separate proposal file, no automation that
can build unreviewed work.
