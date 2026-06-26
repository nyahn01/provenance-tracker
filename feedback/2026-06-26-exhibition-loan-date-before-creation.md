---
issue: 31
date: 2026-06-26
author: nyahn01
category: bug
priority: high
status: addressed
---
## Summary
Exhibition loans can display dates earlier than the artwork's creation year because the date-extraction regex has no lower-bound cross-check against the artwork's own date.

## Original feedback
> how can there be an exhibition loan in 1600 when the painting itself was made 1889?

## Assessment
Valid data-integrity bug. The year-extraction logic in `src/lib/exhibition-loans.ts` uses a
regex (`YEAR_RANGE` / `YEAR_SINGLE`, lines 29-30) that matches any four-digit year in the
range 1500–2029. It has no guard against years that predate the artwork's creation date.

When AIC's `exhibition_history` prose contains incidental four-digit numbers — catalogue
references, inventory codes, gallery room numbers, or building addresses that happen to
look like years (e.g. "Gallery 1600", "Cat. no. 1623") — the extractor silently treats them
as loan dates. The resulting `ExhibitionLoan` entry carries a `startDate` that is centuries
before the work was made, and `buildUnifiedTimeline` in `src/components/provenance/timeline.ts`
sorts and displays it without questioning the value.

The artwork's creation year is available at call time (`meta.date` in the route handler,
`src/app/api/provenance/route.ts` line ~112), so a guard is straightforward to add.

Related code:
- `src/lib/exhibition-loans.ts` lines 29-30 — regex definitions
- `src/lib/exhibition-loans.ts` lines 34-43 — `extractYears()` helper (no floor check)
- `src/lib/exhibition-loans.ts` lines 142-186 — `extractExhibitionHistoryLoans()` (calls extractYears)
- `src/app/api/provenance/route.ts` lines 461-469 — loan extraction call site, where `meta.date` is already in scope
- `src/components/provenance/timeline.ts` lines 107-119 — exhibition events rendered without date validation

## Recommended action
Add a `creationYear` parameter to `extractExhibitionHistoryLoans` and `extractProvenanceLoans`
and filter out any loan whose `startDate` (or `endDate`) is earlier than `creationYear`.
Pass `meta.date` (parsed to a year integer) from the route handler at the call site in
`src/app/api/provenance/route.ts`. Also harden `extractYears()` to reject years below a
sensible floor (e.g. 1200, the earliest plausible Western artwork provenance date) to
catch similar false positives in prose that are not related to the creation-date guard.
