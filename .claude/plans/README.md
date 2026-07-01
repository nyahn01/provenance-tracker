# Plans (transient scratch — not an archive)

This folder holds the **working plan for an in-flight sprint** — the shared contract
between the human and the agents while something is being built. It is NOT a permanent
record.

**One home for each thing (CLAUDE.md):**
- **What to build / in-flight / done** → GitHub Issues (a shipped plan closes its issue).
- **Decisions** → `docs/decisions/` (ADRs).
- **Lessons** → `docs/INSIGHTS.md`.

So when a plan ships, its record moves to the issue it closed (and, if it changed a
rule, to an ADR / INSIGHTS) — and the dated plan file is **deleted**. Dated files must
not accumulate here (CLAUDE.md: "No dated/dormant files"). The `stale-plans` sentinel
flags any `YYYY-MM-DD-*.md` left behind so it gets promoted-and-removed.

## Lifecycle

```
approved plan  →  .claude/plans/YYYY-MM-DD-<slug>.md   (transient, while building)
      ↓ build → PR (Closes #N) → merge
promote/close  →  the GitHub issue is the durable record; delete the plan file
```

## Naming (while it exists)

```
YYYY-MM-DD-<slug>.md      # date the plan was approved; 3–5 word kebab slug
```

Optional frontmatter (`sprint`, `status: approved|in-progress`, `goals`) is fine, but
`status: shipped` is a smell — a shipped plan should already be a closed issue, not a
file lingering here.
