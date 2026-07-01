# 0004 — Timeline-led hero, superseding the arc-globe (and the GLOBE CONTRACT)

Status: Proposed
Date: 2026-07-01
Deciders: maintainer (design direction by design-director; structural concept by dataviz-engineer)
Supersedes: the ⚠️ GLOBE CONTRACT hero role in `CLAUDE.md`; the arc-globe hero in
`src/components/StoriesApp.tsx` + `src/components/provenance/GlobeContainer.tsx`.
Related: feedback #115; concept proposal #128; `docs/design/timeline-hero-spec.md` (the buildable spec).

## Context

The hero has been a full-screen, auto-rotating Globe.gl scene with animated dashed arcs,
dimmed ~72% behind the landing scrim. Feedback #115 ("From scratch… not useful beyond
just looking at some arcs… visually appealing yet data-insight-wise meaningful") is
accurate, and the failure is **structural, not cosmetic**:

- **Provenance is temporal.** The core question is *who held the work, in what order, with
  what gaps*. A globe privileges geography and distance — the dimension that matters least.
  Two owners in one city produce no arc; a cross-town sale and a transatlantic sale look
  equally dramatic. The encoding fights the story.
- **Arcs paper over gaps.** A glowing line between two points reads "it moved here" and
  visually bridges exactly the undocumented spans the project exists to expose. This is in
  direct tension with the honesty contract, where *a gap must be shown as a gap and custody
  must never be conflated with a loan*.
- **Motion was ambient, not curatorial.** Auto-rotate communicates nothing about the work.
- **Audience fit.** Our audience (museums, educators, the art-curious) reads catalogue-
  raisonné timelines fluently; a rotating globe signals "tech demo," the opposite of a
  credibility-first method proof-of-concept.

The GLOBE CONTRACT in `CLAUDE.md` was written to protect a fragile Globe.gl init that had
broken twice. It correctly protected the *implementation*, but it also locked the globe
into the *hero role*. The maintainer has explicitly lifted the contract for this redesign.

## Decision

1. **Retire the globe as the hero.** The new hero is a **chronological chain-of-custody
   timeline** — the only form where a provenance **gap is a first-class citizen** (drawn to
   scale, labeled, honored) and where **custody vs. loan** is legible (an unbroken custody
   spine vs. a loan branch that returns without advancing it). Data maps directly to the
   existing contract: `locations` → custody spine, `exhibitions` → loan tier, `gaps` → the
   gap state, `gettyRecords` → dealer marks, `confidence` → the event confidence dot.
2. **Demote the globe/map to a supporting, on-demand reveal.** Geography is offered as a
   "See this journey on a map" reveal triggered from a *selected event*, for the genuinely
   distance-driven stories. It is second chair, never the landing hero.
3. **Reserve a dealer-network graph as a later opt-in lens** (Knoedler/Goupil branching
   custody), not part of this hero.
4. **Supersede the GLOBE CONTRACT's hero clause.** The contract's *init-safety* lessons
   (no atmosphere, no `scene.traverse`, no `material.shininess`, keep zoom enabled, solid
   ocean canvas) remain valid **if and only if** Globe.gl is reused as the second-chair map
   (a dependency choice left open in `docs/design/timeline-hero-spec.md` §4.5; design leans
   flat-map).
5. **The full art direction is `docs/design/timeline-hero-spec.md`** — the binding spec for
   build agents (type ramp, color roles, the proposed `OBS.gapWeave` gap token, motion
   tokens, component specs, honesty checklist). On implementation it folds into
   `docs/DESIGN_SYSTEM.md` (§0 Philosophy + §6 components).

## Consequences

- **`CLAUDE.md` will be updated by the implementing PR**, not by this ADR. Until the new
  hero lands, the ⚠️ GLOBE CONTRACT **still governs the current globe** — no one may relax
  the locked init before the replacement ships. The implementing PR rewrites that section
  to (a) record that the globe is no longer the hero and (b) either delete the contract (if
  Globe.gl is dropped) or scope it to the second-chair map reveal.
- **`docs/DESIGN_SYSTEM.md` is updated by the implementing PR too** — the timeline-hero spec
  folds into its §0 and §6, replacing the Observatory/globe-hero sections. Until then,
  `DESIGN_SYSTEM.md` v1.0 remains the accurate description of the live product.
- **A new design token is introduced** (`OBS.gapWeave` / `accent.gap`) in
  `src/lib/design-tokens.ts` under design review — the honest, dignified gap treatment.
  Tokens remain the single source of truth; no hex enters markdown.
- **`StoriesApp.tsx` / `GlobeContainer.tsx` are substantially reworked or replaced.** The
  landing scrim and full-screen globe are removed; the timeline becomes the hero.
- **The honesty gate (`npm run honesty`) and its checks continue to apply** — the new hero
  must pass the acceptance checklist in `docs/design/timeline-hero-spec.md` §7 (no bridged
  gaps, custody ≠ loan, sourcing visible, PD-only images, no live-tracking copy).
- **Accessibility is preserved and extended:** the "full chain as text" aria pattern
  survives; the chain gains keyboard step-through; reduced-motion and AA are required.
- **Risk:** reusing Globe.gl for the map reveal could let the demoted arc metaphor creep
  back. Mitigation: the spec §4.5 recommends a flat map and constrains the reveal to the
  honesty guardrails regardless of renderer.
- **Reversibility:** the globe code and its init lessons are retained in history and (if
  Option A is chosen) in the map reveal, so the decision is not destructive.

## Rejected alternatives

- **Evolve the globe into an instrument ("Ledger Globe", Concept A of #128).** Preserves
  the cinematic brand, but keeps geography over-privileged and carries higher technical
  risk (globe.gl deep-customization, camera/animation perf). The `dataviz-engineer`
  favored it; the maintainer chose the timeline for honesty- and audience-fit.
- **Provenance graph as the hero (Concept C).** Reads "network analytics tool" to a
  museum/educator audience; retained instead as a later opt-in deep-dive lens.
