---
issue: 68
date: 2026-06-27
author: anonymous (via in-app form)
category: bug
priority: high
status: triaged
---
## Summary
The two newest featured works on the front page — Cassatt's *The Child's Bath* and Cézanne's *The Basket of Apples* — render blank/broken thumbnails.

## Original feedback
> latest two addition of front page works Cassatte, Cezanne works don't have their thubmnail  images

## Assessment
Valid, reproducible bug. The two works were added in #66 with **placeholder image assets**. Confirmed on disk: `public/works/childs-bath.jpg` and `public/works/basket-of-apples.jpg` exist but are **2,010-byte stub files**, whereas the other six featured images are 160–370 KB real images — so they display blank. The code itself flags this: `src/lib/featured.ts` carries TODO comments on both entries (`// Image: replace placeholder with Wikimedia Commons file …` and `// imageId: update from AIC API (blocked by Cloudflare in this environment)`), and the `imageId` values on both are placeholders, not real AIC IIIF ids.

This is honest data behind the scenes (the provenance chains are real GPI/AIC) — only the **public-domain hero image** is missing.

## Recommended action
Replace the two stub files with real public-domain images from Wikimedia Commons:
- `Mary_Cassatt_-_The_Child's_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg` → `public/works/childs-bath.jpg`
- `Paul_Cézanne,_The_Basket_of_Apples.jpg` → `public/works/basket-of-apples.jpg`

Keep the AIC public-domain credit in `src/lib/featured.ts`. Optionally update the placeholder `imageId` values once the AIC API is reachable. Candidate for promotion to `priority` + `agent:provenance-data` (asset + featured-data owner).
