# Provenance Tracker — Obsidian Vault Index

This repo doubles as an Obsidian vault. Open the **repo root** as a vault (Settings → Open
folder as vault). Exclude `node_modules/`, `.next/`, `.git/` under Settings → Files → Excluded.

## Map of the project (start here)
| File | What it is |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Operating contract — vision, honesty rules, design tokens, GLOBE CONTRACT, tech, APIs |
| [docs/BUSINESS_CASE.md](docs/BUSINESS_CASE.md) | Positioning — curated provenance stories; what we do/don't claim |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Type, color, spacing, motion — the visual contract |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Tiered sourcing strategy + credibility tiers |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | The ~3-min demo flow |
| [docs/INSIGHTS.md](docs/INSIGHTS.md) | Running knowledge log — findings, decisions, dead-ends |
| [AGENTS.md](AGENTS.md) | Agent team + build loop + the ship gate |
| `.claude/plans/` | Approved implementation plans |
| `memory/` | Cross-session facts (also surfaced to Claude) |

## How this stays meaningful
- Insights and decisions go in `docs/INSIGHTS.md` the moment they happen (chat is volatile).
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
