---
title: "Jikji — 직지심체요절"
type: concept
openQuestion: true
tags: [concept, korean-heritage, jikji, cultural-restitution, bnf]
---

# Jikji — 직지심체요절

**직지심체요절** (Jikji Simche Yojeol) — "Anthology of Great Buddhist Priests' Zen Teachings"

Printed in **1377** at Heungdeok Temple, Cheongju, Korea.  
World's oldest known book printed with **movable metal type** — 78 years before Gutenberg's Bible.

## Where It Is Now

**Bibliothèque nationale de France (BnF), Paris.**  
Donated by Victor Collin de Plancy, a French diplomat who served in Korea in the 1880s. Korea has formally requested its return. France has declined, citing French law prohibiting deaccession of national collection items.

## The Provenance Problem

The Jikji's journey from Cheongju (1377) to Paris (held since ~1911) is imperfectly documented:

| Period | Known | Gap |
|--------|-------|-----|
| 1377 | Printed at Heungdeok Temple | — |
| 1377–1880s | Temple / monastery circulation | **Largely undocumented** |
| 1880s | Collin de Plancy acquires it | Circumstances unclear |
| 1911 | Donated to BnF | BnF catalog record exists |
| 1972 | Identified as world's oldest metal-type print | By Park Byeong-seon, Korean bibliographer at BnF |

## Why It Belongs in This Platform

The platform currently covers Western Impressionist works through Western institutional APIs. The Jikji represents:

1. **A provenance gap at civilizational scale** — not a 16-year dealer gap but a colonial-era displacement
2. **The limit of "free museum APIs"** — BnF has catalog records but no Linked Art endpoint
3. **The bigger question** — can provenance tracking help document cultural heritage restitution claims, not just Western art market transactions?

## What an Integration Would Look Like

```
BnF catalog record → manual seed (public/data/jikji.json)
Provenance text → colonial acquisition → restitution request timeline
Globe arc → Cheongju 1377 → Paris 1911
Gap annotation → "Whereabouts 1377–1880s: undocumented"
```

The BnF catalog entry (ark:/12148/cb37351696n) is publicly accessible.

## Open Questions

- [ ] Is there a Korean-language provenance API? National Museum of Korea (nmk.go.kr) has a collection API.
- [ ] What's the legal status of France's law prohibiting deaccession? Has it been challenged?
- [ ] Can the Washington Principles framework (designed for WWII-era looting) apply to colonial-era displacement?
- [ ] Who would the primary users be — Korean government, diaspora, academics?

## Related

- [[Provenance Gap]]
- [[1933–1945 — The WWII Window]]
- [[vault/index|Research Vault Index]]
