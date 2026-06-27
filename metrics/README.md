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
  null-coordinate entries, works with a trailing dateless custody entry (the #43/#48/#52
  data signal), deep chains (≥3 dated entries).
- **Measured elsewhere:** Getty/RKD/exhibition coverage (runtime data) and honesty-gate
  status (`npm run honesty:full`). This snapshot never invents those.
