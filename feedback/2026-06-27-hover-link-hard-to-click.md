---
issue: 65
date: 2026-06-27
author: anonymous (via in-app form)
category: ux
priority: medium
status: triaged
---
## Summary
A hover-revealed link is hard to click — it disappears unless the cursor moves very fast, a classic "hover gap" between the trigger and the revealed target.

## Original feedback
> hover over link is really difficult to click. it keeps disappearing unless I move my cursor very fast

## Assessment
Valid UX bug. The symptom — an element that appears on hover but vanishes before the pointer can reach it — is the standard *hover-intent / hover-bridge* problem: the hover trigger and the revealed link don't occupy one contiguous hover region (or a `transition`/`mouseleave` closes it immediately), so moving the cursor across the gap drops the `:hover` state and the link is gone.

The reporter didn't say which link, so the exact component needs to be pinned during the fix. Likely candidates are hover-reveal affordances in the globe/sidebar UI under `src/components/provenance/` (and any `:hover`-gated controls in `StoriesApp.tsx`).

## Recommended action
Reproduce on the live preview, identify the hover-reveal element, then either (a) make the trigger and the revealed link share one contiguous hover container, (b) add a small close-delay / hover-intent buffer, or (c) make the affordance click-toggle rather than hover-only. Candidate for promotion to `priority` + `agent:provenance-globe`. Verify keyboard/focus parity so the fix doesn't regress accessibility.
