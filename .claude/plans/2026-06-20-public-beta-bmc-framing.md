---
sprint: "Public Beta framing + BMC widget + monetization milestones"
status: shipped
approved: 2026-06-20
shipped: 2026-06-20
commit: c11cf20
goals:
  - Add "Early Access · Public Beta" banner to /pricing with clear WIP framing
  - Embed official BMC floating button widget on all pages via next/script
  - Correct BMC URL from /nyahn01 → /nyahn across all three occurrences
  - Document monetization milestones in BUSINESS_CASE.md before activating Stripe
files_touched:
  - src/app/pricing/page.tsx (modified — public beta banner + BMC/feedback CTAs)
  - src/app/layout.tsx (modified — BMC floating widget via next/script afterInteractive)
  - src/components/StoriesApp.tsx (modified — BMC URL fix /nyahn01 → /nyahn)
  - draft/BUSINESS_CASE.md (modified — Section 9: monetization milestones)
---

## Context

The user asked how to frame the product professionally as a WIP / public beta
while accepting donations via BMC, and when it would be appropriate to start
monetizing. The user is based in Europe with an international audience; BMC
handles merchant-of-record / EU VAT without additional engineering overhead.

## Key decisions

**Public Beta banner on /pricing** — a visible, honest framing that the product
is in active development, donations and feedback are welcome now, paid tiers come
later. Banner links to BMC and to the new `/feedback` page (this plan was
implemented first; the feedback page came in the next sprint).

**Official BMC widget** — the user provided the CDN script tag directly. Implemented
via `next/script` with `strategy="afterInteractive"` so it loads after Next.js
hydration without blocking the globe render. The floating yellow button appears on
every page.

**BMC URL fix** — the user reported the link was broken. Correct handle is `nyahn`,
not `nyahn01`. Fixed with `replace_all` across three files.

**Monetization milestones** — four gates before activating Stripe:
1. Data quality gate (≥10 works with full A-tier chain)
2. User validation gate (real feedback from 5+ non-technical users)
3. Product completeness gate (timeline viz, search, mobile-responsive)
4. Operational gate (error monitoring, legal pages, privacy policy)
BMC stays as tip jar even after Stripe activates — no overhead, "human building this"
trust signal, handles EU VAT automatically.

## Commits

- `adbb584` fix: correct BMC URL to buymeacoffee.com/nyahn (was /nyahn01)
- `c07261e` feat: add official BMC button widget to all pages
- `c11cf20` feat(pricing): public beta banner + business plan monetization milestones
