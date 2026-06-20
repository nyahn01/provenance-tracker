# Plans

Approved implementation plans live here. Each file documents one sprint that was
aligned with the human before implementation started. Plans are permanent records —
they are not deleted when the sprint ships; update `status` to `shipped` and add
the commit hash.

## Naming convention

```
YYYY-MM-DD-<slug>.md
```

- `YYYY-MM-DD` — the date the plan was **approved** (not when implementation finished).
- `<slug>` — 3–5 words, kebab-case, capturing the sprint goal.

Examples:
```
2026-06-20-public-beta-bmc-framing.md
2026-06-20-github-feedback-loop.md
```

## Frontmatter format

```markdown
---
sprint: "<human-readable title>"
status: approved | in-progress | shipped | abandoned
approved: YYYY-MM-DD
shipped: YYYY-MM-DD        # fill in when the ship gate turns green
commit: <hash>             # the ship.mjs commit that closed the sprint
goals:
  - One-line goal 1
  - One-line goal 2
files_touched:
  - path/to/file.ts (new|modified|deleted)
---
```

`status` values:
- **approved** — human said yes; implementation not yet started.
- **in-progress** — actively being built.
- **shipped** — ship gate passed; commit hash recorded.
- **abandoned** — plan was superseded or dropped; note why in the body.

## How the build loop uses plans

Step 1 of the build loop (AGENTS.md) requires saving the approved plan here
**before** any implementation begins. The plan file is the shared contract between
the orchestrator, the agents, and the human. If implementation drifts from the plan,
update the plan first and confirm the change with the human.
