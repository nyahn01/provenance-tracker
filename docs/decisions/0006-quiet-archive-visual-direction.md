# 0006 — The "quiet archive": a Min Hee Jin × Tufte visual direction

Status: Proposed
Date: 2026-07-03
Deciders: maintainer (with design-director / dataviz-engineer)
Related: ADR `0004-timeline-led-hero.md`; spec `docs/design/timeline-hero-spec.md`;
`DESIGN_SYSTEM.md`; `src/lib/design-tokens.ts`.

## Context

Two references keep coming up for how this product should *feel*: **Min Hee Jin** (the
creative director behind the NewJeans / f(x) / SHINee visual worlds) and **Edward Tufte**
(the canonical voice on analytical data design). This ADR records what each actually means,
why they converge, and the one build we adopt now to prove the direction.

The important finding: neither is a new coat of paint. This product's **honesty contract**
— *gaps are the most beautiful state, every fact carries a visible source, restraint over
spectacle, custody is never conflated with a loan* — is already the same conviction both
figures preach from opposite ends. Min Hee Jin arrives at it through art direction (mood,
restraint, authenticity); Tufte through analytics (data-ink, no chartjunk, honest axes).
They **converge on the system we already have.** So the direction is a sharpening, not a
pivot.

## 1. The Min Hee Jin aesthetic, defined

Six load-bearing traits (named by their design behavior, not by any one release):

- **Timeless over trendy.** Work built to age well rather than chase the moment. Signals
  permanence and confidence — exactly the register a provenance archive needs.
- **Restraint & negative space.** Subtraction is the primary tool. The subject is given room
  to breathe; nothing competes with it.
- **Analog warmth & naturalness.** Muted, natural tone; a film-like, authentic surface over
  plastic hyper-polish. Trust reads as "real," not "rendered."
- **Cohesive world-building.** Every touchpoint — type, layout, motion, image — belongs to
  one universe. Obsessive typographic and compositional discipline.
- **Mood over spectacle.** Understated, emotional confidence. It never shouts.
- **Craft in the detail.** The close look is rewarded — kerning, materiality, the small
  considered thing. Depth for the viewer who leans in.

## 2. The Tufte principles

Maximize the **data-ink ratio** (every mark earns its place; erase the rest). Erase
**chartjunk** (decoration, moiré, gratuitous dimension). **Small multiples** and
**sparklines** (word-sized, data-dense graphics). **Layering & separation** (quiet
hierarchy; detail that resolves on inspection). **Micro/macro reading** (the whole reads at
a glance; rewards close study). An **honest, proportional axis** — above all, *show the
data*, and *respect the reader's intelligence*.

## 3. The synthesis — "the quiet archive"

This table is the working brief. Left and center are two routes to the same instruction;
right is how it lands here.

| Min Hee Jin | Tufte | This product |
|---|---|---|
| Restraint / subtraction | Maximize data-ink ratio | The chain is the caption, not the spectacle; scrim + auto-rotate retired (ADR 0004, spec §5) |
| Negative space is eloquent | Honest, proportional axis | **A gap drawn to scale — the flagship build below** |
| Naturalness / anti-artifice | No chartjunk; show data honestly | The honesty gate: never fake completeness, never invent a date |
| Cohesive world-building | One visual grammar | One type system (Cormorant + Pretendard); ≤3 data hues; zero charting-library default fonts |
| Craft; close-look reward | Layering; micro/macro | Sourcing calm at rest, richer on inspection (the under-used `SourceCard`) |
| Mood over spectacle | Erase redundant ink | Curatorial motion only — 200–600ms, no bounce/spring/stagger |

**How it improves the product.** Our audience (museums, educators, the art-curious; a future
B2B due-diligence buyer) reads catalogue-raisonné restraint as *credibility*. The quiet
archive is a differentiator: where a generic dashboard shouts, this whispers and is trusted.
The aesthetic and the honesty contract reinforce each other — restraint is not decoration
here, it is the argument.

## Decision

Adopt the **quiet archive** direction, and make its first proof the **to-scale time axis**
on the chain-of-custody hero: the timeline's vertical rhythm becomes proportional to elapsed
years, and a documented gap is drawn to its measured span. This is at once the strongest
Min Hee Jin move (negative space made eloquent — a long silence physically dwarfs a short
hand-off) and the strongest Tufte move (an honest data-ink axis; the graphic *is* the
argument). It closes a live spec↔implementation gap: `timeline-hero-spec.md` §4.1/§4.3
already mandate "drawn to scale," but the built hero used uniform spacing.

**Method disclosure (honesty of presentation).** The axis is *"to scale, softly bounded"*:
`px = clamp(min, years × rate, max)`. A strictly linear axis would let a 250-year span push
the timeline off-screen; the clamp keeps the mapping **monotonic** (a longer interval is
always ≥ a shorter one) and museum-legible. It never invents a date — an event or gap with
no parseable year falls back to a fixed, dignified step, never a guessed interval. Logic
lives, pure and deterministic, in `buildChainScale` (`src/components/provenance/chain-timeline.ts`).

## Consequences

- The hero now reads as a real time axis; gaps are impossible to overlook — the honesty
  point, made structural.
- No new dependency, no hex added; existing `GAL.*` / `motion.*` tokens only. `GlobeContainer`
  init untouched (GLOBE CONTRACT). SSG determinism, the #156 dot-anchoring fix, the "chain
  assembles" animation, reduced-motion, AA, and the keyboard/text equivalent all preserved.
- `docs/design/timeline-hero-spec.md` §4.3 is marked implemented.

## Follow-ups (documented, not built here)

1. **Tufte data-ink pass on `/insights`** — direct-label over legends, thin the frames,
   extend the existing sparkline/small-multiple patterns (`ArtistSpark`, `PriceSparkline`).
2. **Layering via `SourceCard`** — wire the existing-but-unused hover/focus citation card
   into the chain (calm at rest, full attribution on inspection).
3. **Palette-warmth pass (proposal).** A design-reviewed, analog/film-warm color-grade of
   GAL/OBS toward Min Hee Jin's muted-natural register. This is **not** done here:
   `design-tokens.ts` is DEDUPE-ONLY and carries intentional, documented drift — any hex
   change is a separate, design-reviewed task. Tracked as a `proposal` issue for the human
   to promote.
