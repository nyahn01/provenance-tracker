---
issue: 48
date: 2026-06-27
author: nyahn01
category: ux
priority: low
status: triaged
---
## Summary
The timeline shows lines like "+ 16 more exhibition loans not shown". A visitor asked who decides
this and why the rest can't be shown. It reads as data being withheld when it is only a *display*
cap — the data is present, the timeline just renders the first few to stay legible.

## Original feedback
> (#48, part 2) "+ 16 more exhibition loans not shown" or similar additional lines, who determines
> this and why can't it be shown?

## Assessment
Not a data bug — a UX/clarity gap. `buildUnifiedTimeline`
(`src/components/provenance/timeline.ts`) caps rendered exhibitions and Getty dealer records at
the first 4 each (`exhibitions.slice(0, 4)`, `gettyRecords.slice(0, 4)`). `ProvenanceDetail.tsx`
then computes the overflow (`extraExh = max(0, prov.exhibitions.length - 4)`,
`extraGPI = …`) and renders the "+ N more … not shown" copy. The cap keeps the custody chain — the
honest core story — from being buried under a long loan list. Exhibition loans are deliberately
secondary (a loan is not a change of ownership).

Related code:
- `src/components/provenance/timeline.ts` — `.slice(0, 4)` on exhibitions and Getty records
- `src/components/provenance/ProvenanceDetail.tsx` — `extraExh` / `extraGPI` + the "not shown" copy

## Recommended action
Pick one (promote to a `priority` issue when chosen — out of scope for this triage round):
1. Make the overflow expandable (a "show all loans" toggle in a `<details>`), so nothing is hidden.
2. Or reword the copy to state it is a display limit, not missing data
   (e.g. "16 more loans on record — collapsed to keep the custody chain readable").
Option 2 is the lighter, honesty-first fix; option 1 is the fuller answer to the question asked.
