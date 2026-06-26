# Provenance Tracker — The Hidden Journeys of Masterpieces

## Vision
A curated, rigorously-sourced provenance-storytelling web app. A small set of famous
paintings, each shown with a documented, dated **chain of custody** — every fact sourced,
every gap shown honestly, exhibition loans kept separate from ownership.
Audience: museums, educators, and the art-curious. Doubles as a method proof-of-concept
for any future B2B due-diligence/data product. See [[BUSINESS_CASE.md]].
Honestly NOT: an insurance-grade API, live "where is it now" tracking, or exhaustive coverage.

## What it does
- **Landing** = an editorial gallery of curated public-domain masterpieces (lead with the art).
- **Story view** = artwork hero + dated chain-of-custody timeline (every entry sourced) + a
  cinematic map auto-framed to that work's journey + a separate exhibition-loan list + credit.
- When the record is thin, shows an honest "Provenance gap — help complete it" state.
- "Explore beyond the collection" search spans Met / AIC / Rijksmuseum with a truthful empty state.
- Reconciles multi-source fragments into one custody timeline (Claude when funded; deterministic
  extraction from museum prose otherwise).

## Honesty rules (non-negotiable — these protect credibility)
- NEVER claim live cross-museum "currently on view" status — no public API supports it.
- Every on-screen fact carries a visible source (Met / AIC / Rijksmuseum / Wikidata).
- Sparse data is shown as a gap, never faked. No invented dates, coordinates, or risk scores.
- Custody (ownership) is never conflated with exhibition loans (a loan is not a move).
- Images shown ONLY for public-domain works, credited to the institution.
- The unscripted-search path degrades gracefully and honestly.

## Design tokens (follow exactly, never deviate)
```
Background:      #0a0908
Globe ocean:     #111010
Globe land:      #1c1612
Globe border:    #2a2218
Accent clay:     #c87855
Accent sage:     #6f8d7d
Pin glow:        #d4a853
Text warm:       #f6f1e8
Text muted:      #9a8f85
Panel bg:        rgba(10, 9, 8, 0.85)
Font:            Pretendard
```

## Tech stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Globe.gl for 3D globe (npm install globe.gl)
- Pretendard font (CDN: cdn.jsdelivr.net/gh/orioncactus/pretendard)
- Anthropic SDK (claude-sonnet-4-6)
- Vercel deployment

## APIs (all keyless unless noted)
- Met Museum API: https://collectionapi.metmuseum.org/public/collection/v1
- Art Institute of Chicago API: https://api.artic.edu/api/v1
- Rijksmuseum Linked Art API (NO key): https://data.rijksmuseum.nl/search/collection + https://id.rijksmuseum.nl/<id>. Old www.rijksmuseum.nl/api is retired (410).
- Europeana API: https://api.europeana.eu/record/v2/search.json — key: EUROPEANA_API_KEY
- Wikidata SPARQL: https://query.wikidata.org/sparql (entity search: `wbsearchentities`)
- Cleveland Museum of Art API (no key): https://openaccess.clevelandart.org/api/artworks
- Getty Provenance Index (GPI): Knoedler + Goupil seeded locally via `scripts/seed-goupil.mjs`
- RKD (Netherlands Art Institute): `src/lib/rkd.ts` (keyless)
- Anthropic API (key: ANTHROPIC_API_KEY) — currently OUT OF CREDITS; extraction falls back to deterministic prose mining until funded. Do not call /api/reconcile in the demo.

## Coding rules
- TypeScript with strict types
- Never hardcode API keys — always process.env
- Globe.gl must be dynamically imported with ssr: false
- All external API calls go through Next.js API routes (server-side only)
- Cache/pre-warm external API responses; add per-IP rate limiting (we proxy rate-limited free APIs)
- Tailwind for all styling
- Commit after every completed feature, push immediately
- Read [[MEMORY.md]] and [[BUSINESS_CASE.md]] for all context

## The agent team (see .claude/agents/)
- provenance-globe — globe visuals & design-token fidelity
- provenance-data — Wikidata/Met/AIC integration, reconciliation, honest empty states
- provenance-strategy — business case, market/competitor research, positioning
- provenance-story — demo script & narrative, keeps it cinematic
- provenance-honesty-review — BLOCKING gate: catches overclaiming, missing source lines, faked data
Orchestration & the constant-improvement loop: see AGENTS.md.

## Deployment
Vercel auto-deploys on push to main.
Always run npm run build and fix TypeScript errors before pushing.
