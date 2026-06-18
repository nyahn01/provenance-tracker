# Backlog — consumed by the self-improving loop (top item first)

The loop picks the top unchecked `[ ]` item, routes it to the owning agent, and the
agent ships it through `node scripts/ship.mjs --commit "..."`. Never skip a P0 for polish.
Mark `[x]` when shipped (gate green + committed). One item per cycle.

## P0 — world-class redesign (the demo is currently "hideous")
- [ ] `design-director`: author `draft/DESIGN_SYSTEM.md` — type system (display serif + UI
      grotesque), elevated archival palette, spacing grid, motion, component specs. Gallery/museum bar.
- [ ] `design-director`: produce the redesign direction for the hero + provenance detail view
      (a visual the user can react to) BEFORE mass implementation.
- [ ] `provenance-globe`: rebuild the app UI to DESIGN_SYSTEM.md — landing/globe, search,
      provenance detail. The artwork is the hero; gaps are beautiful, not errors.
- [ ] `dataviz-engineer`: redesign the provenance timeline + movement arcs to the system,
      encoding confirmed/uncertain/gap honestly. verify.mjs stays green.

## P0 — honest core must be bulletproof
- [ ] Improve artwork→Wikidata matching: exact-label match misses works with em-dashes /
      alt titles (e.g. "A Sunday on La Grande Jatte — 1884"). Add fallback: strip
      punctuation/date suffixes, try `skos:altLabel`, and match on artist+title. Owner: provenance-data.
      Done = verify.mjs still green AND La Grande Jatte returns ≥1 located entry OR an honest gap.
- [ ] Wire the reconcile route into the UI: after provenance loads, call /api/reconcile and
      render the Claude timeline with confidence dots in the right panel. Owner: provenance-globe.
      Done = clicking a result shows a reconciled, source-tagged timeline; gap state still honest.
- [ ] verify.mjs: add a check that /api/reconcile returns the TimelineEntry contract for a
      known input, and that no entry invents a date absent from the input. Owner: provenance-data.

## P1 — make the documented journey visible & beautiful
- [ ] Animate arcs along the dated P276 chain in chronological order; degrade to a single
      pulsing dot (not a fake arc) when only one location exists. Owner: provenance-globe.
- [ ] Right-panel timeline: vertical, dated, each entry with a visible source badge
      (Wikidata / Met / AIC) and a clay/sage/gap confidence dot. Owner: provenance-globe.
- [ ] "Provenance gap — help complete it" state must be visually first-class (dashed, inviting),
      not an error. This is a feature. Owner: provenance-globe.

## P2 — widen real data coverage (cheap, no paid sources)
- [ ] Add Wikidata P625 lookup for location entities returned without coords, so more arcs map.
      Owner: provenance-data.
- [ ] Evaluate adding one more open source behind the SAME contract (Europeana API, key is free /
      instant). Spike only — must fit src/lib/types.ts, no shape drift. Owner: provenance-data.
- [ ] Integrate Rijksmuseum API (key already in env) for Dutch Golden Age depth. Owner: provenance-data.
- [ ] Add credibility-tier labeling to every source per draft/DATA_SOURCES.md; surface the tier
      in the UI on each fact. Owner: provenance-data + dataviz-engineer.
- [ ] Spike Getty Provenance Index / RKD access (tier A scholarly). Owner: art-historian → provenance-data.

## P3 — idea / strategy self-check (small budget, every 3rd cycle)
- [ ] provenance-strategy: re-read BUSINESS_CASE.md against the actual current build and either
      sharpen these priorities or flag a wrong assumption. NO expensive web-search fan-out.
      Append findings to MORNING.md and reorder this backlog if warranted.

## Explicitly NOT building (kills credibility or wastes budget)
- Live cross-museum "on view" status (no API supports it).
- Invented confidence scores / transit-risk numbers from thin data.
- Stripe / PDF export — throwaway, not a build target for now.
