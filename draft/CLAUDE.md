# Alibi — Painting Location Tracker

## Vision
An interactive 3D globe showing where the world's greatest art **has been** — a
cross-institution provenance & exhibition-movement explorer.
Visual reference: war-tracker.com — dark, alive, cinematic — but for art.
Design reference: Open Design warm palette applied over dark background.
Positioning: provenance integrity / authenticity / theft & repatriation (the "alibi" angle),
not tourist convenience. Globe = funnel; provenance data API = product (see BUSINESS_CASE.md).

## What Alibi does
- Shows the world's top 10 museums as glowing pins on a 3D globe
- Users search any painting or artist
- Shows the painting's **documented** movement history as animated arcs (Wikidata P276 +
  museum exhibition-history endpoints), with every claim sourced and dated
- When the record is thin, shows an honest "Provenance gap — help complete it" state
- Uses Claude to reconcile conflicting provenance fragments into one timeline and flag gaps

## Honesty rules (non-negotiable — these protect credibility)
- NEVER claim live cross-museum "currently on view" status — no public API supports it.
  `is_on_view` describes ONLY that museum's own collection.
- Every on-screen fact must carry a visible source (Wikidata / Met / AIC).
- Sparse data is shown as a gap, never faked. No invented "risk scores" from thin data.
- The unscripted-search path must degrade gracefully and honestly before any polish.

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
- Rijksmuseum API (key: RIJKSMUSEUM_KEY): https://www.rijksmuseum.nl/api/en/collection
- Anthropic API (key: ANTHROPIC_API_KEY)

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
- Update PROGRESS.md after every session
- Read TONIGHT.md (or TOMORROW.md) at session start
- Read MEMORY.md and BUSINESS_CASE.md for all context

## The agent team (see .claude/agents/)
- alibi-globe — globe visuals & design-token fidelity
- alibi-data — Wikidata/Met/AIC integration, reconciliation, honest empty states
- alibi-strategy — business case, market/competitor research, positioning
- alibi-story — demo script & narrative, keeps it cinematic
- alibi-honesty-review — BLOCKING gate: catches overclaiming, missing source lines, faked data
Orchestration & the constant-improvement loop: see AGENTS.md.

## Deployment
Vercel auto-deploys on push to main.
Always run npm run build and fix TypeScript errors before pushing.
