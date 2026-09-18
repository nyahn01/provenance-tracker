# metrics — the Outcome loop's snapshot

`latest.json` is a **single, overwritten** snapshot of featured custody-chain health
(not a dated series — per CLAUDE.md "one fact, one home"). Regenerate with:

```bash
npm run metrics   # node scripts/metrics.mjs
```

It is computed offline from `src/lib/featured-provenance.json` (no network, no API spend),
so it runs in CI. The `retro` agent reads it alongside recently-merged PRs to write lessons
into `docs/INSIGHTS.md` — closing the Act→Outcome loop (see
`docs/decisions/0002-stage3-autonomy-model.md`).

What it measures (and what it deliberately doesn't):
- **Measured here:** featured works, custody entries, dated-start coverage, A-tier entries,
  ungeocoded entries, country-level entries, works with no dated entry (the #43/#48/#52
  data signal), deep chains (≥3 dated entries).
- **Measured elsewhere:** Getty/RKD/exhibition coverage (runtime data) and honesty-gate
  status (`npm run honesty:full`). This snapshot never invents those.

## Two coordinate counts, only one of them a defect

- `ungeocodedEntries` — a place that *should* have resolved but didn't, usually a missing
  gazetteer entry. **Target 0.** CI treats a rise here as a regression.
- `countryLevelEntries` — the prose named only a country, so the entry carries no
  coordinate **on purpose**: pinning a national centroid would assert a location the source
  never gave. Counted, never flagged.

They were one number until #236. Merging them means the count can never honestly reach
zero, which quietly pressures the next fix to invent a coordinate so it does.
