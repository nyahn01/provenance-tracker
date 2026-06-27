---
issue: 50
date: 2026-06-27
author: nyahn01
category: ux
priority: medium
status: triaged
---
## Summary
The timeline shows "+ 16 more dealer records in Getty GPI (artist-level)" but those extra records
are not viewable. Getty GPI is the richest provenance source we carry, so hiding them reads as
wasted data unless the reason is explicit.

## Original feedback
> „+ 16 more dealer records in Getty GPI (artist-level)" should be available in scrollable list or
> in someway. It is a waste of good data unless there is a clear reason why it was exempted.

## Assessment
Valid UX gap — same family as the exhibition-loan truncation cap (#48 part 2). `buildUnifiedTimeline`
(`src/components/provenance/timeline.ts`) renders only `gettyRecords.slice(0, 4)`;
`ProvenanceDetail.tsx` then shows the "+ N more dealer record(s) in Getty GPI (artist-level)" overflow
line. The cap keeps the custody chain — the honest core story — readable, and these GPI records are
**artist-level** (dealer transactions for the artist, not provenance of this exact work), which is why
they are summarized rather than promoted into the custody timeline. That distinction is real and worth
keeping, but the data should still be reachable.

Related code:
- `src/components/provenance/timeline.ts` — `gettyRecords.slice(0, 4)`
- `src/components/provenance/ProvenanceDetail.tsx` — `extraGPI` + the "+ N more … (artist-level)" copy;
  the GPI ledger deep-link already exists in the Provenance Intelligence card

## Recommended action
Make the extra GPI records reachable without burying the custody chain: a `<details>`/scrollable
panel ("Show all N Getty dealer records") that lists them with their archival scan links, clearly
labeled **artist-level** (not custody of this work). Pair with #48 part 2 (exhibition-loan cap) — one
consistent "show all" pattern for both. Promote to a `priority` issue for `dataviz-engineer` when
chosen.
