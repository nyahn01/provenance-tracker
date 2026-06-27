---
issue: 61
date: 2026-06-27
author: Johannes (via in-app form)
category: general
priority: low
status: triaged
---
## Summary
The `/pricing` page implies commercial intent the project doesn't actually have; suggestion is to replace it with an `/about` page framing free + research usage.

## Original feedback
> The website has a pricing page which suggests that it aims for monetization. This may require an imperium which currently does not exist.
>
> Since this is a hobby project to my understanding, I suggest to change the pricing page to an about page that explains the free and research usage.

## Assessment
Valid positioning feedback, and it touches credibility — not just taste. `src/app/pricing/page.tsx` presents three tiers, which reads as a live commercial offering. Per `docs/BUSINESS_CASE.md` the product is explicitly a curated, honest-provenance demo and a *method proof-of-concept* for future B2B due-diligence — **not** a service taking payment today. A pricing page on a non-commercial research tool can therefore over-claim maturity, which sits awkwardly next to the project's honesty contract.

This is a **direction call**, not a mechanical bug: the pricing page may be intentional as a "where this could go" artifact for the pitch. It is therefore NOT auto-promoted — it's flagged for a human decision (with `provenance-strategy` input).

## Recommended action
Decide positioning first (human + `provenance-strategy`): keep `/pricing` as an explicitly-labelled "future model" page, or replace it with an `/about` page describing free/research use. If the latter, that becomes a `priority` + `agent:provenance-strategy` (copy) / `agent:provenance-globe` (page) work item. No build action until the direction is chosen.
