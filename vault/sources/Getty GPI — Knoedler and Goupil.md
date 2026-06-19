---
title: Getty GPI — Knoedler and Goupil
type: source
coverage: 1846–1970
records: 4388
license: CC0 1.0
url: https://www.getty.edu/research/tools/provenance/
tags: [source, dealer-records, primary]
---

# Getty Provenance Index — Knoedler & Goupil

Published by the Getty Research Institute. CC0 — fully open for research and reuse.

## What It Contains

| Dataset | Period | Records in platform |
|---------|--------|-------------------|
| Knoedler Stock Books | 1872–1970 | 2,628 |
| Goupil & Cie Livres de Stock | 1846–1919 | 1,760 |
| **Total** | | **4,388** |

## What Each Record Tells You

- **Artist** (last name, inverted format: `MONET, CLAUDE`)
- **Title** (often partial, French spelling)
- **Sale date** — when the dealer sold the work
- **Seller / buyer** — who the dealer bought from and sold to
- **Seller/buyer location** — city where each party was based
- **Price** — in francs, dollars, or pounds depending on era
- **Stock book reference** — the original physical page

## What It Does NOT Tell You

- Physical location of the canvas during the transaction
- Whether the seller/buyer location = where the painting traveled
- Attribution certainty (records often say "attributed to" or give partial titles)

## How the Platform Uses It

`searchGetty(artist, title)` loads both datasets from `public/data/` and matches by artist last name + title keywords. Returns up to 20 records per artwork. Displayed in the sidebar as GPI (purple badge) and as amber dealer-trail arcs on the globe (seller → buyer city).

## The Goupil Connection

Goupil & Cie (Paris) was the dominant Impressionist dealer from 1860–1900. Key staff:
- **Theo van Gogh** — managed Paris branch until his death in 1891
- **Paul Durand-Ruel** — Goupil competitor who split off and championed Monet

The GPI Goupil dataset captures the moment Impressionism crossed from Paris studios to American collectors (Palmer, Havemeyer, Ryerson).

## Seed Script

```bash
node scripts/seed-goupil.mjs   # Downloads and filters Goupil CSV
node scripts/seed-getty.mjs    # Downloads and filters Knoedler CSV
```

## Related

- [[AIC Provenance Records]] — often cites Goupil/Knoedler by name
- [[degas-yellow-dancers]] — best confirmed Goupil match in the collection
- [[Theo van Gogh at Goupil]]
