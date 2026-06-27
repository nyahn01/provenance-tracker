---
issue: 43
related: [48]
date: 2026-06-27
author: nyahn01
category: bug
priority: high
status: addressed
---
## Summary
Undated AIC custody entries whose holder is the artwork's own artist were sorted to the **end**
of the timeline (after later, dated owners) and shown with a "?" year — e.g. a Van Gogh or Degas
piece ending with "custody / ? / Vincent van Gogh / Paris / AIC". The artist is the *origin* and
belongs at the top. Reported for multiple AIC works, so it is systemic, not one-off.

## Original feedback
> (#43) why is Edgar Degas mentioned at the end of the timeline as custody with no time (year)?
> it seems to be a recurring bug for AIC custody records for more artworks.

> (#48, part 1) why does the provenance story always end with the artist? Why is such remnant
> custody without a year from AIC shown at the end of the timeline? e.g. ⌂ custody ? Vincent
> van Gogh Paris AIC

## Assessment
Valid ordering/presentation bug — confirmed in code.

`buildUnifiedTimeline` (`src/components/provenance/timeline.ts`) sets each custody event's
`sortKey = extractYear(loc.startDate)`. `extractYear(null)` returns **9999**
(`timeline.ts` ~104-108), so any **dateless** custody entry sorts to the chronological end. The
holder string (`who`) is the entry's `institution` when present (`timeline.ts` ~170), and the
deterministic AIC extractor (`src/app/api/provenance/route.ts` ~327-361) promotes the first
comma-delimited segment of a prose clause to `institution` — frequently the **artist's name** for
the origin clause (e.g. "Vincent van Gogh, Paris" with no explicit year). Net result: the
artist-origin entry, which is logically the *first* owner, dangles at the *bottom* with "?".

No invented data is involved — the source genuinely has no year for that clause; the bug is purely
ordering + the artist showing as a trailing "remnant".

Related code:
- `src/components/provenance/timeline.ts` — `extractYear` (9999 default) + `buildUnifiedTimeline` custody mapping/sort
- `src/app/api/provenance/route.ts` ~327-361 — `deterministicExtract` (artist promoted to `institution`)

## Recommended action (done this round)
In `buildUnifiedTimeline`, detect an undated custody entry whose holder matches the artwork's
artist and treat it as the **origin**: order it first (sort key = creation year if known, else
ahead of all dated entries) instead of bucketing it to 9999. Invent no date — the year stays "?"
unless the creation year is known (the artist held the work from the moment it was made). The
artist + creation year are threaded in from `ProvenanceDetail.tsx` (`prov.artwork.artist` /
`prov.artwork.date`). Fixed in branch `fix/aic-timeline-feedback-2026-06-27`.
