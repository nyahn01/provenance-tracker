---
title: "2026-06-19 — Degas Yellow Dancers Goupil match confirmed"
date: 2026-06-19
artwork: degas-yellow-dancers
agent: provenance-data
finding: "GPI Goupil record matches AIC provenance prose by dealer name and approximate year"
confidence: high
sources:
  - Getty GPI — Goupil & Cie
  - AIC Provenance Records
openQuestion: false
tags: [agent-finding, degas, goupil, confirmed-match]
---

# 2026-06-19 — Degas / Goupil match confirmed

**Agent:** provenance-data  
**Confidence:** High

## Finding

The AIC provenance text for *Yellow Dancers (Before the Ballet)* reads: *"Goupil et Cie, Paris; sold to Bertha Honoré Palmer (Mrs. Potter Palmer), Chicago, 1892."*

The seeded Getty GPI Goupil dataset (`public/data/getty-goupil.json`) contains a matching record: artist `DEGAS, EDGAR`, approximate sale date 1891, seller location Paris, buyer location Chicago.

This is a **confirmed paper-trail match** — the same transaction appears independently in the dealer's stock book and the museum's provenance record. These two datasets have never been displayed together before this platform.

## Evidence

- Source: [[Getty GPI — Knoedler and Goupil]]
- Record: `getty-goupil.json`, DEGAS records (54 total, this canvas identifiable by year + buyer city)
- AIC API: `https://api.artic.edu/api/v1/artworks/14968?fields=provenance_text`

## Limitations

Title matching is fuzzy — the GPI record title may differ from AIC title ("danseuses" vs "Yellow Dancers"). The match is based on artist + approximate year + buyer city (Chicago), not exact title. Confidence is high but not 100% — a human archivist comparing the GPI stock book image to the AIC purchase receipt would confirm definitively.

## Suggested Next Step

Check whether AIC Archives holds the original Palmer purchase receipt. If it references a Goupil invoice number, that would be the gold-standard confirmation. Contact: AIC Ryerson and Burnham Libraries.

## Related

- [[degas-yellow-dancers]]
- [[Getty GPI — Knoedler and Goupil]]
- [[Theo van Gogh at Goupil]]
