# Batch agent squad — how to run, pause, and control it

The squad spawns specialist agents in parallel on the priority queue, each opens a PR, and
the honesty gate reviews every PR. Agents **never merge** — the human reviews the Vercel
preview and merges.

## The queue = GitHub Issues (not a markdown file)
- A priority is an **open Issue** labeled `priority` + `agent:<domain>` (file one with the
  *Build priority* issue template). Add `paused` to skip it.
- The workflow reads `gh issue list --label priority --state open` and routes each Issue to its
  `agent:<domain>`. An empty queue is a valid no-op.
- An agent PR with `Closes #N` auto-closes the Issue on merge — the queue self-cleans. "What
  shipped" = closed Issues + git history (no PROGRESS.md to maintain).

See the root `CLAUDE.md` → *Work tracking* for the canonical model.

## Run it
- One-off, now: `/workflow batch-agent-squad`
- On a schedule: the `provenance-batch-agents` scheduled task runs it (see
  `~/.claude/scheduled-tasks/provenance-batch-agents/SKILL.md`). Manage with `/schedule --list`,
  `/schedule --cancel`.

## Pause / stop
- Pause one priority: add the `paused` label to its Issue.
- Pause everything: remove the `priority` label from open Issues, or close them, or disable the
  scheduled task (`/schedule --list` → cancel).

## What each agent does
1. Reads its assigned Issue (`gh issue view N`), skips `paused`/already-shipped.
2. Branches `feat/<domain>/issue-<N>`, implements.
3. Runs `npm run build` + `npm run honesty` (fixes all errors).
4. Opens a PR whose body contains `Closes #N`. Does **not** merge.
5. The honesty gate reviews → APPROVE / BLOCK. The human merges approved PRs.

## Guardrails
- `main` is protected by the `protect-main` ruleset (PR + honesty/build checks required).
- GLOBE CONTRACT, design tokens, honesty rules, types-first: all in the root `CLAUDE.md`.
