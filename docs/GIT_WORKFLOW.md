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
