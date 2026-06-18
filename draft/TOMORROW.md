# Backlog — consumed by the self-improving loop (top item first)

The loop picks the top unchecked `[ ]` item, routes it to the owning agent, and the
agent ships it through `node scripts/ship.mjs --commit "..."`. Never skip a P0 for polish.
Mark `[x]` when shipped (gate green + committed). One item per cycle.

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

## P3 — idea / strategy self-check (small budget, every 3rd cycle)
- [ ] provenance-strategy: re-read BUSINESS_CASE.md against the actual current build and either
      sharpen these priorities or flag a wrong assumption. NO expensive web-search fan-out.
      Append findings to MORNING.md and reorder this backlog if warranted.

## Explicitly NOT building (kills credibility or wastes budget)
- Live cross-museum "on view" status (no API supports it).
- Invented confidence scores / transit-risk numbers from thin data.
- Stripe / PDF export — throwaway, not a build target for now.
