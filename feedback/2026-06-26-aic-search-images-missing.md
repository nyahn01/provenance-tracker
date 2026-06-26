---
issue: 29
date: 2026-06-26
author: nyahn01
category: ux
priority: medium
status: addressed
---
## Summary
AIC search result thumbnails are blank for all non-featured works because the AIC IIIF image host is behind a Cloudflare bot challenge, but the UI shows no explanation to the user.

## Original feedback
> AIC images are not all showing.

## Assessment
Valid UX issue. The underlying technical cause is documented in the codebase and in project
memory (`[[AIC IIIF Cloudflare block]]`): AIC's IIIF endpoint (`www.artic.edu/iiif/2/...`)
returns HTTP 403 with a Cloudflare bot challenge for both cross-origin `<img>` hotlinks and
server-side proxying. The search route intentionally returns `thumbnail: null` for all AIC
search results (see `src/app/api/search/route.ts` lines 107-113, where the workaround is
also commented in code):

```
// AIC's IIIF image host is now behind a Cloudflare bot challenge (HTTP 403,
// CORP:same-origin) that blocks both cross-origin <img> hotlinks and
// server-side proxying. Return null so the UI shows a clean placeholder
// rather than a broken image. (Featured AIC works are self-hosted instead.)
thumbnail: null,
```

The six featured artworks work around this by serving self-hosted copies from `/public/works/`
(see `src/lib/featured.ts` `localSrc` field). But any AIC work discovered via search shows
a blank/placeholder image with no message explaining why. A user who searches for an AIC
work and sees empty image slots has no way to know this is a deliberate infrastructure
workaround rather than a bug or missing data.

The fix is UX-level only (no new infrastructure needed): the placeholder in the search
results card should carry a visible note such as "Image unavailable (AIC IIIF restriction)"
rather than a generic grey box. This is scoped to the UI component that renders search
result thumbnails.

Related code:
- `src/app/api/search/route.ts` lines 100-113 — AIC search, `thumbnail: null` with comment
- `src/lib/featured.ts` lines 28-34 — `localSrc` field comment explains the same blocker
- `src/components/StoriesApp.tsx` — likely renders search result cards (thumbnail display)

## Recommended action
In the search-result card component (likely `src/components/StoriesApp.tsx`), detect when
`source === 'aic'` and `thumbnail === null` and render a labeled placeholder (e.g. "AIC
image unavailable") instead of a generic grey box. This sets honest expectations for the
user and distinguishes a known infrastructure limitation from a data gap.

Longer-term: monitor whether AIC relaxes the Cloudflare restriction or provides an
alternative image delivery path, at which point the `thumbnail: null` override in the
search route can be removed.
