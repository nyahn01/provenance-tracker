# Provenance Tracker

The hidden journeys of masterpieces — a curated provenance research tool that traces documented chains of custody for famous paintings using institutional records, art market data, and structured open data.

**Live demo:** [provenance-tracker.vercel.app](https://provenance-tracker.vercel.app)

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in optional keys
npm run dev
```

## Environment Variables

| Variable | Required | Source |
|----------|----------|--------|
| `ANTHROPIC_API_KEY` | Optional | [console.anthropic.com](https://console.anthropic.com) — enables Claude prose extraction; deterministic fallback is active when absent |
| `EUROPEANA_API_KEY` | Optional | [apis.europeana.eu/api/apikey](https://apis.europeana.eu/api/apikey) — free, instant; enables Europeana search across 50M+ objects |
| `GITHUB_TOKEN` | Optional | Fine-grained PAT (Issues: Read & write) — powers the in-app feedback form; absent → form falls back to email |

All sources except Anthropic and Europeana are keyless public APIs. The app runs fully without any keys (with deterministic provenance extraction and no Europeana results).

## Data Sources

Every fact on screen carries visible source attribution. Sources are ranked by credibility tier:

| Tier | Source | Coverage |
|------|--------|----------|
| A | Art Institute of Chicago API | Provenance prose + exhibition history |
| A | Metropolitan Museum API | Object metadata |
| A | Rijksmuseum Linked Art API | Dutch/Flemish works |
| A | Getty Provenance Index (GPI) | Knoedler (1872–1970) + Goupil (1846–1919) dealer records, CC0 1.0 |
| A | RKD Netherlands Art Institute | Dutch/Flemish specialist records |
| B | Wikidata P276 | Structured location statements with P580/P582 dates |
| B | Europeana | 50M+ European objects from 3,000+ institutions |

## Feedback

Visitors submit feedback through the in-app form at `/feedback`, which files a
labeled GitHub issue via `/api/feedback` (no GitHub account needed; email fallback
when the service is offline). The `feedback-triage` agent is then run on demand to
review open `feedback`-labeled issues, write the useful ones to `feedback/` as
structured files, and open a PR for review. See [feedback/README.md](feedback/README.md).

One-time setup to enable the form:

1. Create a fine-grained PAT scoped to this repo with **Issues: Read & write**; set it
   as `GITHUB_TOKEN` locally and in the deployment env.
2. Create the label once: `gh label create feedback --color FFDD00 --description "User feedback via in-app form"`.

## Honesty Rules

- Provenance gaps are shown honestly — never faked or invented
- Custody (ownership) is never conflated with exhibition loans
- Images shown only for public-domain works, credited to their institution
- Every LocationEntry carries a `source` field; no facts are unsourced

## Architecture

```
src/
├── app/
│   ├── api/          provenance, search, getty, rkd, reconcile routes
│   ├── demo/         marketing explainer page
│   ├── learn/        provenance glossary
│   ├── pricing/      pricing tiers
│   └── team/         agent team + build pipeline
├── components/
│   └── StoriesApp.tsx  globe + sidebar experience (client component)
└── lib/
    ├── types.ts       shared data contracts
    ├── geocode.ts     city → coordinates lookup
    ├── getty.ts       GPI in-memory search
    ├── europeana.ts   Europeana API client
    ├── rijksmuseum.ts Rijksmuseum Linked Art client
    ├── rkd.ts         RKD API client
    └── cache.ts       TTL cache + rate limiter
```

## Scripts

```bash
npm run dev          # local dev server
npm run build        # production build + type check
npm run ship         # build → verify → honesty check → commit gate
npm run honesty      # static honesty check on git diff
npm run honesty:full # honesty check across all source files
```

## License

Copyright © 2026 Nayoung Ahn. All rights reserved. See [LICENSE](LICENSE).
