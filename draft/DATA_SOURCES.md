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

## Sources to integrate (status)
- [x] **Wikidata SPARQL** (B) — P276 location chain + date qualifiers + P625 coords. *Live.*
- [x] **Met Museum API** (A) — object detail, image, own location. *Live.*
- [x] **Art Institute of Chicago API** (A) — object detail, provenance_text, exhibition_history. *Live.*
- [ ] **Rijksmuseum API** (A) — key already in env. Dutch Golden Age depth. *Next.*
- [ ] **Europeana API** (B) — 50M+ objects, 3000+ institutions; free instant key. Big coverage win.
- [ ] **Getty Provenance Index + ULAN/AAT** (A) — sales/inventory records 1550–1950; LOD endpoints.
- [ ] **RKD (Netherlands)** (A) — Old Masters provenance research; free API.
- [ ] **Wikimedia Commons** (B) — high-res images + structured data, fills image gaps.
- [ ] **Auction archives** (C) — Christie's/Sotheby's public lot archives (scrape-extract, label C).
- [ ] **Repatriation/looted-art + news** (D) — extract movement events with Claude, label D + date.
- [ ] **Google Arts & Culture** (C) — partner pages; extract exhibition/location mentions, label C.

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
