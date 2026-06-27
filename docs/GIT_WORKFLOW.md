# Git workflow — Provenance Tracker

Short-lived feature branches → PR → honesty/build checks → human merge. `main` is protected by
the `protect-main` ruleset (see `docs/decisions/0001-branch-protection-solo-dev.md`).

## Branches
- One branch per Issue: `feat/<domain>/issue-<N>` (e.g. `feat/provenance-data/issue-33`).
- Chores/docs: `chore/<slug>`. Hotfixes: `hotfix/<slug>`.
- Delete-on-merge is on — branches clean themselves up. Keep only `main` long-lived.

## Commits
- Conventional commits: `feat(scope): …`, `fix: …`, `chore: …`.
- Agents commit through the **ship gate** (`node scripts/ship.mjs --commit "<msg>" --push`), which
  runs build → serve → `verify.mjs` and commits only if green. Agents never `git commit` raw
  (one sanctioned exception: `feedback-triage` commits docs-only `feedback/` files via plain git).
- End the body with `Closes #N` so merging auto-closes the priority Issue.
- **Feedback issues are exempt from closing keywords.** A commit/PR that fixes a `feedback`-labeled
  issue must reference it with a NON-closing keyword (`Addresses #N` / `Refs #N`), never
  `Closes`/`Fixes`/`Resolves` — those auto-close on merge and skip the human's verification. Closing
  keywords are only for `priority` issues; the human closes feedback issues after confirming the fix.
  (A merged commit using `Closes #` on a feedback issue is exactly how #29/#31 were silently closed
  before they were verified.)

## PR → merge
1. Push the branch; open a PR (`gh pr create`). Body must contain `Closes #N` + the honesty checklist.
2. CI runs `honesty` + `build`; `vercel[bot]` posts a preview. The honesty gate
   (`provenance-honesty-review`) reviews and APPROVES/BLOCKS.
3. **The human reviews the Vercel preview and merges.** Agents never merge.

## Staying current
- Before working on a second device, the SessionStart hook ff-syncs and warns on a dirty/stale tree.
- If `main` advanced under a feature branch: `git fetch origin` then `git rebase origin/main`
  (push with `--force-with-lease` only after a rebase you own). Never force-push shared branches.

## Reverting
`git checkout -b hotfix/<slug> main` → `git revert <hash> --no-edit` → PR → gate → merge.
