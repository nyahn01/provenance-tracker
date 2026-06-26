# Project Status — what's implemented

_Last updated 2026-06-26. A factual inventory of what exists and works today. For vision and rules see [CLAUDE.md](CLAUDE.md); for the live work queue see the GitHub Issues `priority` label / Projects board._

## Stack

- **Next.js 16** (App Router) · **React 18** · **TypeScript** (strict) · **Vercel Speed Insights**
- **globe.gl 2.46** (Three.js) for the 3D globe
- **Tailwind 3.4** + CSS custom properties; JS color tokens in [src/lib/design-tokens.ts](src/lib/design-tokens.ts)
- **@anthropic-ai/sdk** for Claude Haiku prose extraction (deterministic fallback when API is unavailable)

## Pages

| Route | Purpose |
|---|---|
| `/` | Main app — globe + curated gallery + search + provenance detail panel |
| `/demo` | Origin-story / pitch page (scroll-reveal) |
| `/demo/source` | Structured source document (for NotebookLM ingestion) |
| `/learn` | Provenance glossary |
| `/pricing` | Three-tier pricing |
| `/team` | How the platform + agent team are built |
| `/feedback` | In-app feedback form |

## API routes

| Endpoint | What it does | Sources |
|---|---|---|
| `GET /api/search` | Parallel multi-museum search | Met · AIC · Rijksmuseum · Europeana |
| `GET /api/provenance` | Core: custody chain + exhibitions + gaps + WWII flag | AIC/Met/Rijks prose → Claude or deterministic extract; Wikidata P276/P580/P582; Getty GPI; RKD |
| `POST /api/reconcile` | Claude-Haiku timeline merge (optional) | Anthropic API |
| `GET /api/getty` | Knoedler/Goupil dealer records | Getty GPI (seeded CC0 datasets) |
| `GET /api/rkd` | Dutch/Flemish provenance | RKD Netherlands |
| `GET /api/cache` · `GET /api/cache/invalidate` | Cache stats / purge by source | in-memory cache |
| `POST /api/feedback` | Files a labeled GitHub issue (email fallback) | GitHub API |

## Features (all working)

- **3D globe** — three arc tiers (custody gold / exhibition-loan sage / dealer-trail amber) + city dots, auto-rotate, auto-framing on selection. Init is locked by the **GLOBE CONTRACT** (see [CLAUDE.md](CLAUDE.md)). Lives in [src/components/provenance/GlobeContainer.tsx](src/components/provenance/GlobeContainer.tsx).
- **Unified timeline** — merges custody / exhibition-loan / Getty-dealer events, sorted, with source-tier badges and high/medium/low confidence dots. Logic in [src/components/provenance/timeline.ts](src/components/provenance/timeline.ts).
- **Honest gaps** — thin/missing custody shown as explicit gap panels, never faked; unmapped cities kept off the globe.
- **WWII-era detection** — flags undocumented custody overlapping 1933–1945 (Washington Principles note).
- **Provenance Intelligence card** — deterministic FLAG/REVIEW/CLEAR risk tier + Getty price sparkline.
- **Per-source TTL cache + per-IP rate limiting** ([src/lib/cache.ts](src/lib/cache.ts)).
- **Feedback → GitHub issue** with email fallback ([src/components/FeedbackForm.tsx](src/components/FeedbackForm.tsx)).
- **6 curated featured works** (public-domain, deep Tier-A provenance) in [src/lib/featured.ts](src/lib/featured.ts). Custody chains pre-parsed and committed to [src/lib/featured-provenance.json](src/lib/featured-provenance.json) — zero Claude runtime cost for featured works.
- **Prose extraction cache** — disk-backed ([src/lib/prose-cache.ts](src/lib/prose-cache.ts)) so each user-searched artwork is parsed by Claude at most once per server instance.

## Component architecture (post-refactor)

`StoriesApp.tsx` is a ~220-line orchestrator (state + layout + composition). The UI lives in [src/components/provenance/](src/components/provenance/):

- `GlobeContainer.tsx` — the globe + its two effects (GLOBE CONTRACT)
- `ProvenanceDetail.tsx` — the warm detail sidebar (timeline, RKD, intelligence card)
- `SourceBadge.tsx` · `ConfidenceDot.tsx` · `PriceSparkline.tsx` — leaf components
- `globe-data.ts` — geocoding + arc builders · `timeline.ts` — timeline logic + styles

## Honesty contract (the moat)

Every fact carries a source. Custody ≠ exhibition loans (separate arrays + UI). Gaps are shown, never invented. Confidence is explicit. Images shown only for public-domain works, credited. Enforced by the `provenance-honesty-review` agent + `scripts/honesty-check.mjs` + `scripts/verify.mjs`.

## Build & ship

- `npm run dev` · `npm run build`
- `node scripts/ship.mjs [--commit "…"] [--push]` — build → serve → verify gate (agents never commit raw)
- `npm run honesty` — over-claim / invented-data grep on the diff
- `npm run preparse` — re-run Claude Haiku over the 6 featured works; commit the output to lock in results

## Known constraints

- In-memory cache is single-node (swap for Redis if multi-instance).
- Met public API exposes no provenance prose (metadata only).
- City geocoding is a static gazetteer; unmapped places stay off the globe (honest).
- Disk prose cache (`cache/prose-cache.json`) is gitignored — warm per-instance, not shared across Vercel deployments. Featured works are exempt (pre-committed JSON).
