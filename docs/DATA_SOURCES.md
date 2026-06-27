# Data Sources — tiered sourcing strategy

The product's credibility depends on labeling every fact with where it came from and how
much to trust it. Coverage is thin by default; the answer is **more sources + honest tiers**,
never invented data. Each `LocationEntry.source` / timeline entry must name its tier.

## Credibility tiers (highest → lowest)
| Tier | Meaning | Examples |
|---|---|---|
| **A — Scholarly/institutional** | Museum-published, peer-reviewed, catalogue raisonné | Met/AIC/Rijksmuseum object records, Getty Provenance Index, RKD, museum exhibition histories |
| **B — Structured open** | Crowd/linked open data, generally reliable, verifiable | Wikidata (P276/P580/P582/P625), Europeana, Wikimedia Commons |
| **C — Semi-structured web** | Auction/dealer archives, exhibition catalogs, gallery pages | auction house archives, Google Arts & Culture pages |
| **D — Reportage** | News on repatriation, theft, loans, sales | press, museum press releases |
| **E — Social/last-resort** | Institutional posts when nothing else exists | museum/artist official social, clearly labeled |

Rule: a fact may use any tier, but the tier must be visible to the user. Never launder D/E into A.

## Sources (status as of 2026-06-27)
- [x] **Met Museum API** (A) — object detail, image, own location. *Live.*
- [x] **Art Institute of Chicago API** (A) — object detail, provenance_text, exhibition_history. *Live.*
- [x] **Rijksmuseum Linked Art API** (A) — keyless; `data.rijksmuseum.nl` + `id.rijksmuseum.nl`; Dutch Golden Age provenance prose (AAT `300444174`). *Live.*
- [x] **Europeana API** (B) — 50M+ objects, 3000+ institutions; `src/lib/europeana.ts`. *Live.*
- [x] **Wikidata SPARQL / Search API** (B) — P276 location chain + date qualifiers + P625 coords; `wbsearchentities` for entity lookup. *Live.*
- [x] **Cleveland Museum of Art API** (A) — open-access, dated structured provenance, images; `openaccess.clevelandart.org`. *Live.*
- [x] **Getty Provenance Index** (A) — Knoedler (4,388 dealer records) + Goupil & Cie seeded via `scripts/seed-goupil.mjs`; art market transactions 1820–1970. *Live.*
- [x] **RKD Netherlands Art Institute** (A) — Old Masters provenance research; `src/lib/rkd.ts`; teal badge in sidebar. *Live.*
- [ ] **Auction archives** (C) — Christie's/Sotheby's public lot archives (scrape-extract, label C). *Future.*
- [ ] **Repatriation/looted-art + news** (D) — extract movement events with Claude, label D + date. *Future.*
- [ ] **Google Arts & Culture** (C) — partner pages; extract exhibition/location mentions, label C. *Future.*

## How to add a source (the only correct way)
1. art-historian assigns its credibility tier; art-insurance-advisor confirms it matters.
2. provenance-data extends `src/lib/types.ts` if a new field is needed (contract first, no drift).
3. Implement server-side route, cache, rate-limit; every fact tagged with tier in `source`.
4. `verify.mjs` must stay green; add a check for the new source's contract shape.
5. Ship through `scripts/ship.mjs`.

## What we will NOT do
- No cross-museum live "on view" status (no API supports it).
- No invented dates, coordinates, or confidence/risk numbers from thin data.
- No presenting tier D/E as if it were tier A.
