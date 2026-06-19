# Provenance Tracker — Positioning

> One line: **A curated, rigorously-sourced provenance-storytelling app — "the hidden journeys of masterpieces" — that shows a famous painting's documented chain of custody, every fact sourced and every gap shown honestly.**

## 1. The honest problem
A painting's ownership history is real, fascinating, and fragmented — scattered across museum
records, catalogues, auction archives, and Wikidata. The public almost never sees a work's
documented journey, and provenance transparency matters more than ever (restitution and
looted-art debates). Nobody offers a beautiful, honest, *sourced* way to read these journeys.

## 2. What we are NOT claiming (this is what protects credibility)
- ❌ Insurance-grade data or a transit-risk API. Coverage is too thin and uneven — underwriters
  would not trust it. (Earlier pivot away from this was correct.)
- ❌ Live "where is it now" tracking. No public API supports cross-museum status.
- ❌ Exhaustive coverage of all art. We are **curated, not comprehensive** — and we say so.

## 3. What we ARE
A curated set of famous, **public-domain** works, each with:
- a **documented, dated chain of custody** (owners/locations over time), every entry sourced;
- **exhibition loans kept separate** from ownership (a loan is not a change of custody);
- **honest gaps** shown as a feature, not hidden;
- a cinematic map auto-framed to that work's actual journey.
Method: multi-source reconciliation across Met, Art Institute of Chicago, Rijksmuseum, and
Wikidata (Claude-assisted when funded; deterministic prose-mining otherwise).

## 4. Who it's for (in order of realism)
| Segment                          | Why it matters                                                             | What they get                                                           |
| -------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Museums / educators**          | Engaging, transparent provenance storytelling; restitution-era credibility | Embeddable, sourced provenance stories                                  |
| **Art-curious public / press**   | "Where has this masterpiece been?"                                         | The public gallery (top of funnel)                                      |
| **(Later) due-diligence buyers** | Dealers/researchers want sourced ownership trails                          | Same data layer as a method proof-of-concept — not pitched as insurance |
|                                  |                                                                            |                                                                         |

## 5. Why it's credible (the only real asset)
Every fact is sourced and dated; gaps are shown, never invented; images appear only for
public-domain works with attribution. Credibility — not coverage — is the moat. The reconciled,
gap-aware, custody-vs-loan dataset compounds as we add works and sources.

## 6. Honest limitations (today)
- Coverage is narrow (a curated set, mostly Art Institute of Chicago + Rijksmuseum depth).
- The Met API exposes no provenance prose; Wikidata gives ~1 (sometimes wrong) location.
- Deterministic extraction is rougher than Claude (which is currently unfunded).
- Some iconic works (Picasso, Hopper) are in copyright — data is fine, images are not ours to show.

## 7. If pursued further
1. Expand the curated set; add tier-A sources (Getty Provenance Index, RKD, Europeana).
2. Restore Claude reconciliation for conflict-flagging and cleaner custody chains.
3. Explore a B2B "provenance method" demo for dealers/researchers — never over-claiming coverage.

## 8. Security & operating notes
- All external + LLM calls server-side via API routes; keys in `process.env`, never client-side.
- Per-IP rate limiting on our routes; cache aggressively (we proxy free APIs).
- Public-domain image gating + attribution + a visible "Data & rights" note (legal).
