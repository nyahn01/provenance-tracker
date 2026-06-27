---
issue: 52
date: 2026-06-27
author: nyahn01
category: ux
priority: high
status: triaged
---
## Summary
The globe is hard to read: it's not obvious where in the world each node sits, and it doesn't surface
much insight. Three linked questions — better visual design, more data-driven use of the globe, and
whether the per-artwork data needs cleaning/parsing first.

## Original feedback
> Globe need a better design. It doesn't really show much information nor is it easy to recognize where
> in the world or continent each node lies. Also How would expert data visualization expert utilize the
> globe to show more data insights? Is it first needed that the data per artwork need be better cleaned
> better parsed better organized?

## Assessment
Valid, high-value, and correctly sequenced by the reporter — **data quality is the prerequisite**.

1. **Legibility (design):** the globe currently renders custody/loan/dealer arcs + dots but no
   place labels, graticule, or continent cues, so a node in "Paris" vs "Chicago" isn't recognizable at
   a glance. Candidate fixes: city/country labels on hover and for active nodes, a subtle graticule or
   continent outline emphasis, clearer node legends. **Constraint: the GLOBE CONTRACT** (root
   `CLAUDE.md`) locks the init — no atmosphere, no `scene.traverse`, no disabling zoom. Any change must
   stay inside that contract (`src/components/provenance/GlobeContainer.tsx`, `globe-data.ts`).
2. **More insight (dataviz):** a data-viz lead could use the globe for aggregate views — flow density
   between art-market hubs, time-scrubbing the journey, clustering dealer trails — rather than one
   work's arcs in isolation.
3. **Data quality first:** geocoding and entity parsing
   (`src/lib/geocode.ts`, `deterministicExtract`/`route.ts`) determine whether a node even lands in the
   right city. Dateless/mislabeled entries (cf. #43/#48) show the parse layer needs hardening before
   richer viz pays off.

Related code:
- `src/components/provenance/GlobeContainer.tsx`, `globe-data.ts` (globe render — GLOBE CONTRACT applies)
- `src/lib/geocode.ts`, `src/app/api/provenance/route.ts` (`deterministicExtract`) — node accuracy
- `docs/DESIGN_SYSTEM.md` — visual contract the redesign must honor

## Recommended action
Sequence as `priority` items: (1) `provenance-data` — harden geocoding/parsing so nodes are correct;
(2) `design-director` + `dataviz-engineer` — a legibility pass (labels, continent cues, hover detail)
within the GLOBE CONTRACT; (3) a dataviz exploration of aggregate/insight views. Do NOT touch globe init
outside the contract. Highest-leverage first step: (1), because viz on noisy nodes misleads.
