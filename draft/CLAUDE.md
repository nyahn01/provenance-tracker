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

## APIs
- Metropolitan Museum API (no key): https://collectionapi.metmuseum.org/public/collection/v1
- Art Institute of Chicago API (no key): https://api.artic.edu/api/v1
- Wikidata SPARQL (no key): https://query.wikidata.org/sparql
- Rijksmuseum (NO key — new Linked Art API): https://data.rijksmuseum.nl/search/collection (creator=/title=/type=schilderij) + https://id.rijksmuseum.nl/<id>. Old www.rijksmuseum.nl/api is retired (410).
- Anthropic API (key: ANTHROPIC_API_KEY) — currently OUT OF CREDITS; extraction falls back to deterministic prose mining until funded. Do not call /api/reconcile in the demo.

## Top 10 Museums
```ts
[
  { id: 'louvre', name: 'Louvre', city: 'Paris', country: 'France', lat: 48.8606, lng: 2.3376 },
  { id: 'met', name: 'The Met', city: 'New York', country: 'USA', lat: 40.7794, lng: -73.9632 },
  { id: 'national-gallery', name: 'National Gallery', city: 'London', country: 'UK', lat: 51.5089, lng: -0.1283 },
  { id: 'uffizi', name: 'Uffizi', city: 'Florence', country: 'Italy', lat: 43.7678, lng: 11.2553 },
  { id: 'rijksmuseum', name: 'Rijksmuseum', city: 'Amsterdam', country: 'Netherlands', lat: 52.3600, lng: 4.8852 },
  { id: 'prado', name: 'Prado', city: 'Madrid', country: 'Spain', lat: 40.4138, lng: -3.6922 },
  { id: 'hermitage', name: 'Hermitage', city: 'St Petersburg', country: 'Russia', lat: 59.9398, lng: 30.3146 },
  { id: 'smithsonian', name: 'Smithsonian', city: 'Washington DC', country: 'USA', lat: 38.8913, lng: -77.0261 },
  { id: 'aic', name: 'Art Institute', city: 'Chicago', country: 'USA', lat: 41.8796, lng: -87.6237 },
  { id: 'taipei', name: 'National Palace', city: 'Taipei', country: 'Taiwan', lat: 25.1024, lng: 121.5489 },
]
```

## Coding rules
- TypeScript with strict types
- Never hardcode API keys — always process.env
- Globe.gl must be dynamically imported with ssr: false
- All external API calls go through Next.js API routes (server-side only)
- Cache/pre-warm external API responses; add per-IP rate limiting (we proxy rate-limited free APIs)
- Budget-cap the Anthropic key
- Tailwind for all styling
- Commit after every completed feature, push immediately
- Update [[PROGRESS.md]] after every session
- Read [[TONIGHT.md]] (or [[TOMORROW.md]]) at session start
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
