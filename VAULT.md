# Provenance Tracker — Obsidian Vault Index

This repo doubles as an Obsidian vault. Open the **repo root** as a vault (Settings → Open
folder as vault). Exclude `node_modules/`, `.next/`, `.git/` under Settings → Files → Excluded.

## Map of the project (start here)
| File | What it is |
|---|---|
| [draft/CLAUDE.md](draft/CLAUDE.md) | Product spec — what it is, honesty rules, design tokens, tech, APIs |
| [draft/BUSINESS_CASE.md](draft/BUSINESS_CASE.md) | Positioning — curated provenance stories; what we do/don't claim |
| [draft/DESIGN_SYSTEM.md](draft/DESIGN_SYSTEM.md) | Type, color, spacing, motion — the visual contract |
| [draft/DATA_SOURCES.md](draft/DATA_SOURCES.md) | Tiered sourcing strategy + credibility tiers |
| [draft/DEMO_SCRIPT.md](draft/DEMO_SCRIPT.md) | The ~3-min demo flow |
| [draft/INSIGHTS.md](draft/INSIGHTS.md) | Running knowledge log — findings, decisions, dead-ends |
| [AGENTS.md](AGENTS.md) | Agent team + build loop + the ship gate |
| `.claude/plans/` | Approved implementation plans |
| `memory/` | Cross-session facts (also surfaced to Claude) |

## How this stays meaningful
- Insights and decisions go in `draft/INSIGHTS.md` the moment they happen (chat is volatile).
- Specs (`CLAUDE`/`BUSINESS_CASE`/`DESIGN_SYSTEM`/`DATA_SOURCES`) are the source of truth; update
  them when a decision changes the product. Use `[[wikilinks]]` so the graph view connects them.
- Every code change ships through `node scripts/ship.mjs --push` (build + live verify + honesty grep),
  so `git log` is a trustworthy history.

## Note on Obsidian Git
Timed auto-commit is **disabled** on purpose (it polluted history with "vault backup" commits and
collided with verified commits). Commit intentionally, or via the ship gate. Use Obsidian Git only
for manual pull/sync across machines if you want it.

## The graph
Open Graph View (Ctrl/Cmd+Shift+G) to see the docs and memory cross-linked. The graph *is* the map.
