# 0005 — Per-work static landing pages (/work/[slug])

**Status:** accepted · 2026-07-02

## Context
The entire product rendered client-side at `/` — search engines could not read a single
custody chain, so nothing compounded: no page to rank, cite, or share per artwork. The
curated chains already live in committed JSON (`featured-provenance.json`), which makes a
fully static page per work free at runtime.

## Decision
Each featured work gets a statically generated page at `/work/[slug]` built ONLY from
committed data (featured.ts, featured-provenance.json, Getty seed files) and rendered with
the existing `ChainOfCustodyTimeline`, which prerenders to crawlable HTML. Slugs live on
`FeaturedWork` in `src/lib/featured.ts`; chains are read through `src/lib/featured-chains.ts`
(shared with `/api/provenance` — one typed home).

Deliberately excluded: exhibition loans, the map reveal, and anything runtime-fetched.
The page says so in visible copy and links into the interactive explorer instead of
pretending to be the full record.

## Deep-link contract
`/?work=<slug>` opens that featured story in StoriesApp (mount-only effect using
`window.location`, not `useSearchParams`, to avoid a Suspense boundary on the home page).
The static pages are the only intended producers of this parameter.

## Consequences
Each new curated work automatically gains an indexable, citable landing page (slug required
on `FeaturedWork`), the sitemap picks it up from `allWorkSlugs()`, and SEO no longer depends
on the client app. Honesty gate applies to page copy like any other surface.
