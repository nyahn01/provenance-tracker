# Alibi — Business Case

> One line: **A cross-institution provenance & exhibition-movement graph for the world's art — public-facing globe as the funnel, a provenance data API as the product.**

## 1. The honest problem

Provenance and exhibition-movement data for artworks is **real, valuable, and fragmented**:
- Museum sites each hold only their own collection and their own exhibition history.
- Wikidata has location (`P276`) on only ~5.5% of art objects, usually a single current value, rarely a dated chain.
- Auction, loan, and repatriation records live in PDFs, press releases, and closed databases.

Nobody offers a **single, queryable, cross-institution "where has this work been" graph** with confidence/coverage flags. That gap is the wedge.

## 2. What we are NOT claiming (kills credibility if we do)

- ❌ "Live tracking of where every artwork is on view right now." No public API supports cross-museum loan status.
- ❌ A precise "transit risk score" from 5%-coverage data. Underwriters will not trust it as-is.
- ❌ €3 PDF of public facts as a real business. It's a novelty, not a model.

## 3. What we ARE building

A provenance/exhibition-history explorer backed by a reconciled data layer:
- **Documented** journey from Wikidata `P276` (with `P580`/`P582` date qualifiers) + museum exhibition-history endpoints (AIC exposes every exhibition since 1879).
- **Honest coverage**: when history is thin, show a **"Provenance gap — help complete it"** state. Missing data becomes the roadmap and the contribution wedge.
- **Claude's real job**: reconcile conflicting provenance fragments from multiple sources into one clean timeline and flag the gaps — a task only an LLM does well.

## 4. Customers & revenue (in order of realism)

| Segment | Pain | What they buy | Sale type |
|---|---|---|---|
| **Fine-art insurers / underwriters** | Transit is the *largest* priced risk; they need movement exposure | Provenance/movement **data API** → transit-exposure signal | Slow B2B, high value |
| **Auction houses / dealers** | Due diligence, looted/disputed-work red flags | Provenance lookup + gap/red-flag report | B2B, recurring |
| **Museum registrars** | Loan-history tracking across institutions | Registrar SaaS on the same data layer | B2B SaaS |
| **Curious public / curators** | "Where has this work been?" | The globe; optional passport export | Top-of-funnel, low ARPU |

Market signal: fine-art insurance is large and growing (AXA Art, Chubb, Allianz, Hiscox, Lloyd's, AIG); transit frequency/distance is an explicit pricing input.

## 5. The "alibi" angle (positioning)

*Alibi* = a defense against accusation. Lean into **provenance integrity, authenticity, theft, looting, Nazi-era / repatriation** — a fundable, topical area — rather than tourist convenience. This also aligns the name with the more defensible product.

## 6. Moat & sustainability

- Raw Wikidata/Met/AIC data is **not** a moat — anyone can hit the same APIs.
- The moat is the **reconciled, gap-filled, cross-institution graph** plus user-contributed corrections — a compounding asset.
- Front-end is swappable; **invest in the data model** so the same core powers the globe, the API, and the registrar SaaS.

## 7. Competitive map

- **Single-collection management:** Artwork Archive, ArtVault Pro, CatalogIt — manage *your own* records, not cross-institution.
- **Blockchain certificates:** Verisart, Artory, Arcual — authenticity certs, not a movement graph.
- **Structured provenance tooling:** Art Tracks (Carnegie) — open-source provenance-as-data, museum-internal.
- **Gap we own:** cross-institution movement graph + map + coverage honesty + insurer-facing API.

## 8. Pivot tree (if the consumer globe stalls)

1. Provenance **data API** for insurers & auction houses.
2. Due-diligence / **red-flag tool** for looted-or-disputed works (the "alibi" angle).
3. **Museum registrar SaaS** for cross-institution loan history.

All three reuse the same data layer — build it well once.

## 9. Security & operating notes

- All external + LLM calls server-side via API routes; keys in `process.env`, never client-side.
- Per-IP rate limiting on our routes; we proxy free APIs that rate-limit — cache aggressively, pre-warm scripted demo queries.
- Budget-cap the Anthropic key.
