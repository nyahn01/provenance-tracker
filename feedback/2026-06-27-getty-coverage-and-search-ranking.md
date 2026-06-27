---
issue: 51
date: 2026-06-27
author: nyahn01
category: ux
priority: medium
status: triaged
---
## Summary
Getty GPI provenance is unusually rich; works with strong Getty coverage should surface more often —
either by carrying more of them or by ranking them higher in search.

## Original feedback
> Getty data are so good and rich in provenance quality. There should me far more of these. Or should
> be recommended higher in search.

## Assessment
Valid, and it splits into two levers:
1. **Coverage** — Getty GPI is seeded from the Knoedler + Goupil stock books
   (`scripts/seed-getty.mjs`, `scripts/seed-goupil.mjs` → `public/data/`). "Far more" means either
   ingesting additional GPI datasets or curating more featured works whose chains GPI documents well.
2. **Search ranking** — `src/app/api/search/route.ts` already does relevance scoring with a
   source-quality tie-break, but it does **not** currently boost results by Getty-GPI provenance depth
   (search hits the museum/Wikidata APIs; GPI is matched later at the provenance step, so depth isn't
   known at search time without a lookup).

Honesty note: ranking must not imply GPI covers a work it doesn't — boost only on verified GPI matches,
never a guess.

Related code:
- `src/app/api/search/route.ts` — relevance scoring + source-quality tie-break
- `src/lib/getty.ts`, `scripts/seed-getty.mjs`, `scripts/seed-goupil.mjs` — GPI dataset + ingest
- `src/lib/featured.ts` — curated featured works

## Recommended action
Two separable `priority` items (route to `provenance-data`): (a) a lightweight GPI-coverage signal in
search ranking (e.g. boost artists/works with known GPI records, computed from the seeded index without
a network call); (b) curate 2–3 more featured works with deep Getty chains. Quick win: (b). Larger: (a).
