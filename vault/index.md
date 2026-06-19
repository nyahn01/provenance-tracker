---
title: Provenance Tracker — Research Vault
type: index
---

# Provenance Tracker — Research Vault

This vault is the living knowledge base behind the platform. It has two audiences:

- **Agents** — write findings here after each research session (`vault/agents/findings/`)
- **Art historians / you** — annotate, correct, and extend those findings

Open the **Graph view** (Cmd/Ctrl+G) to see how artworks, sources, and findings connect.

---

## Artworks

```dataview
TABLE artist, date, museum, provenanceScore AS "Score", status
FROM "vault/artworks"
SORT provenanceScore DESC
```

## Recent Agent Findings

```dataview
TABLE artwork, finding, confidence, file.mtime AS "Updated"
FROM "vault/agents/findings"
SORT file.mtime DESC
LIMIT 10
```

## Concepts with Open Questions

```dataview
LIST
FROM "vault/concepts"
WHERE openQuestion = true
```

---

## Structure

| Folder | Purpose |
|--------|---------|
| `vault/artworks/` | One note per tracked artwork — provenance summary, gaps, annotations |
| `vault/sources/` | Source documentation — what each API/dataset covers and its limits |
| `vault/agents/findings/` | Agent-written research notes, auto-dated |
| `vault/research/` | Free-form research — dealer networks, restitution cases, thematic essays |
| `vault/concepts/` | Provenance vocabulary — gap, custody, loan, restitution, Jikji |
| `vault/_templates/` | Templates for new notes |

---

## Key Sources

- [[Getty GPI — Knoedler and Goupil]]
- [[AIC Provenance Records]]
- [[Rijksmuseum Linked Art API]]
- [[Wikidata P276]]

## Key Concepts

- [[Provenance Gap]]
- [[Custody vs Exhibition Loan]]
- [[1933–1945 — The WWII Window]]
- [[Jikji — 직지심체요절]]
