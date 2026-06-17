# Provenance Tracker — Obsidian Vault Setup

This repo is set up as an Obsidian vault for managing project artifacts, progress, and the agent team.

## Opening the vault

**On each laptop:**
1. `git clone https://github.com/nyahn01/provenance-tracker.git`
2. Open Obsidian → Settings → Vault → Open folder as vault
3. Point it at the repo root (not `draft/`)
4. Obsidian will auto-detect the vault

## Important: file exclusions (so Obsidian doesn't bloat indexing)

In Obsidian Settings → Files → Excluded files, add:
```
node_modules/
.next/
.git/
dist/
out/
```

## Edit safety rule

- **Read/navigate freely in Obsidian anytime.**
- **Only hand-edit files agents aren't currently touching.**
- Obsidian watches the filesystem and auto-reloads when Claude Code writes; safe.
- But simultaneous edits (you typing + agent writing the same file) = last-writer-wins.

## Suggested plugins (optional but recommended)

1. **Obsidian Git** — auto-commit/pull on an interval (Settings → Community plugins → Install → `Obsidian Git`).
   - Keeps notes you jot in Obsidian + code Claude writes both in git history.
   - Set Interval to 5–10 min.

2. **Dataview** — query language for Obsidian. Lets you build dashboards.
   - Example query on [[PROGRESS.md]]: show all entries with `Honesty gate caught:` items.

3. **Templates** — quick stubs for new PROGRESS.md entries and memory files.
   - Templates folder: `.obsidian/templates/`

## The graph (where the magic is)

- Open Obsidian's **Graph View** (Ctrl+Shift+G / Cmd+Shift+G).
- You'll see all wikilinks as a live network: [[CLAUDE.md]] connects to [[BUSINESS_CASE.md]], agents link to AGENTS.md, memory files cross-reference each other.
- Search by tag or node name to jump around. The graph *is* your project map.

## Key files and their roles

| File | Role | Edit via |
|---|---|---|
| [CLAUDE.md](CLAUDE.md) | Product spec + agent roster | Claude Code (me) |
| [AGENTS.md](AGENTS.md) | Agent team orchestration + loop | Claude Code + Obsidian (notes on agent performance) |
| [draft/BUSINESS_CASE.md](draft/BUSINESS_CASE.md) | Strategy, market, revenue | provenance-strategy agent |
| [draft/DEMO_SCRIPT.md](draft/DEMO_SCRIPT.md) | Pitch narrative | provenance-story agent |
| [draft/PROGRESS.md](draft/PROGRESS.md) | Session log + retros | Obsidian (append entries, Claude writes the shipped/gate-caught bits) |
| `.claude/agents/` | Agent prompts (their operating manual) | Claude Code (me) — tightened when gate catches repeat issues |
| `memory/` | Knowledge graph (what you want to remember across sessions) | Obsidian + Claude Code |

## Constant-improvement loop (see [[AGENTS.md]])

Every working session:
1. Read in → plan → build → gate → verify → commit → retro → improve-the-team.
2. Append a new PROGRESS.md entry; Obsidian Git auto-syncs it.
3. If you spot an issue or an idea, jot it in an Obsidian note; it becomes tomorrow's work.

## Sharing the vault between laptops

- **Obsidian Git** auto-pulls on open + every N minutes → you're always in sync.
- Commit before you close; pull when you open the vault on the other machine.
- No manual syncing; the git history is the source of truth.

## Questions?

See [AGENTS.md](AGENTS.md) for team structure, [draft/CLAUDE.md](draft/CLAUDE.md) for the spec, or chat with the next agent you route to.
