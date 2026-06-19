---
title: Provenance Gap
type: concept
openQuestion: false
tags: [concept, gap, restitution, core]
---

# Provenance Gap

A provenance gap is a period in an artwork's documented history where the chain of title — who owned it, where it was — is unknown or undocumented.

## Why Gaps Matter

**Legally:** In Holocaust-era restitution cases, a gap between 1933 and 1945 is treated as a red flag. If an artwork cannot be accounted for during Nazi occupation of Europe, it may have been looted. The Washington Principles (1998) and subsequent national laws require museums to research and disclose such gaps.

**Commercially:** At auction, an artwork with a continuous chain of title from artist to present commands a significant premium over one with documented gaps. Provenance is a component of value, not just historical interest.

**Intellectually:** Gaps often hide the most interesting history — wartime movement, private collection, estate sale. The absence of a record is itself a historical fact.

## How This Platform Shows Gaps

The platform shows gaps explicitly rather than hiding them. When the custody chain has fewer than 2 mapped locations, or when a date range is unaccounted for, a gap entry appears in the timeline with a note.

```
⚠ Provenance gap — no records for this period.
```

The honesty gate (`scripts/honesty-check.mjs`) blocks any commit that fills gaps with invented data.

## Types of Gaps

| Type | Description | Example |
|------|-------------|---------|
| **Pre-museum** | No records before institutional acquisition | Monet Water Lilies 1906–1922 |
| **WWII window** | Gap spanning 1933–1945 | Legally significant |
| **Estate gap** | Work passes through estate without documentation | Common for 19th-century works |
| **Dealer gap** | Work known to have been with a dealer but no record survives | Pre-GPI era transactions |

## Related

- [[1933–1945 — The WWII Window]]
- [[Custody vs Exhibition Loan]]
- [[monet-water-lilies]] — example of a material pre-museum gap
