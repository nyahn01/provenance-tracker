# PROGRESS — Completed Features

Batch agents move priorities here when merged.

---

## Shipped to main (as of 2026-06-19)

### Data layer
- **Goupil & Cie seeding** — `scripts/seed-goupil.mjs`; 1,760 Goupil records merged with Knoedler to 4,388 total GPI dealer records. CC0. Honesty-gate: sourceLabel required on every record.
- **RKD Netherlands Art Institute** — `src/lib/rkd.ts`; 4th parallel API fetch; teal badge in sidebar; collapsible section in story view.
- **Confidence levels** — `LocationEntry.confidence: 'high' | 'medium' | 'low'`; ConfidenceDot component in timeline; high=green (AIC/Met direct), medium=amber (Wikidata P276), low=muted (inferred from prose).

### Globe & front end
- **Globe canvas fix** — ocean colour via 2×2 canvas `toDataURL()`; `showAtmosphere(false)`; zoom enabled. Replaced two prior broken attempts (scene.traverse caused z-fighting; atmosphere caused orange glow).
- **3-tier arc system** — gold (custody 0.18 alt), sage (exhibition loan 0.30 alt), amber GPI dealer trail (0.12 alt); city dots per tier; auto-frame on artwork select.
- **Sidebar unified timeline** — `buildUnifiedTimeline()` merges `locations` + `exhibitions` + `gettyRecords` into one `ProvenanceEvent[]`; EV_STYLES per event type; RKD collapsible.
- **Sidebar empty-state** — "░ Provenance gap" styled card with `/learn#provenance-gap` link when `prov.locations.length < 2 || prov.hasGap`.
- **Provenance Intelligence card** — deterministic insight generator (no Claude API needed); toggled by ✦ button; analyses custody depth, GPI records, gaps.

### Pages
- **`/learn`** — 6-section provenance glossary: what is provenance, custody vs loan, provenance gap (legal weight, Washington Principles), Getty GPI (Knoedler + Goupil), WWII era (1933–1945), Korean cultural heritage (Jikji).
- **`/pricing`** — 3-tier cards (Explorer free / Researcher €99/mo / Institution €999/mo); "Coming soon" CTAs; nav links sitewide.
- **`/team`** — 7 agent profiles, animated build pipeline SVG, ship gate callout, Stage 2 active.
- **`/demo`** — 5-section scrollytelling (IntersectionObserver, no animation libraries); arc legend; data-flow SVG; corrected facts; sourced claims.
- **`/demo/source`** — 12-section NotebookLM source doc (overview, origin, product, data sources + engineering layer, key numbers, agent team, business model, Jikji, honesty principles, tech stack, Q&A prep, key quotes).

### Infrastructure
- **Honesty gate CI** — `scripts/honesty-check.mjs` + `.github/workflows/honesty-gate.yml`; blocks commits with uncredited claims or custody/loan conflation.
- **Obsidian research vault** — `vault/` with 13 notes; agent writing instructions.
- **Pricing research memo** — `draft/RESEARCH_MEMO.md`; restitution-first positioning; 3-tier rationale.

---

## Lessons learned

- **Globe contract** — agents broke globe init twice (atmosphere + scene.traverse). Fix: canvas data URL + `showAtmosphere(false)`. Locked in TOMORROW.md with explicit prohibition list.
- **Batch agent regressions** — provenance-globe agent stripped unified timeline on one run. Prevention: explicit GLOBE_CONTRACT in batch workflow prompt; full feature branch kept as reference.
- **Honesty gate value** — gate caught custody/loan conflations in 2 of 3 batch runs before they reached main.
- **NotebookLM source format** — structured prose with numbered sections and clear headings ingests better than bullet-only content.
