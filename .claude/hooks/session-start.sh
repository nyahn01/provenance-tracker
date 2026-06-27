#!/bin/bash
# SessionStart hook.
#
# Remote (Claude Code on the web): fast-forward the current branch from origin and
# install deps, so a session started on the phone picks up laptop commits and can
# build/lint/verify immediately. Synchronous, idempotent, non-interactive.
#
# Local machines: do NOT touch the tree (you manage your own state) — instead print
# a one-shot health warning so you never start work on a stale/dirty checkout on a
# second device (the cross-device "lost progress" failure mode). Read-only.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# ── Remote web environment: sync + install ──────────────────────────────────
if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; then
  # The container clones fresh at startup, so the working tree is clean here.
  # Fast-forward only: never create a merge commit or clobber pushed work.
  branch="$(git rev-parse --abbrev-ref HEAD || echo HEAD)"
  if [ "$branch" != "HEAD" ]; then
    echo "session-start: syncing $branch from origin"
    if git fetch origin "$branch" 2>/dev/null; then
      git merge --ff-only "origin/$branch" 2>/dev/null \
        && echo "session-start: branch is up to date with origin/$branch" \
        || echo "session-start: could not fast-forward (local commits ahead or diverged) — skipping"
    else
      echo "session-start: fetch failed (network or new branch) — skipping sync"
    fi
  fi
  # Prefer 'npm install' over 'npm ci' so cached container state is reused.
  echo "session-start: installing npm dependencies"
  npm install --no-audit --no-fund
  echo "session-start: done"
  exit 0
fi

# ── Local machine: non-destructive working-tree health warning ──────────────
# Never modifies anything. Helps avoid starting on a stale/dirty tree across devices.
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo HEAD)"
dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ' || echo 0)"
stashes="$(git stash list 2>/dev/null | wc -l | tr -d ' ' || echo 0)"
behind=0; ahead=0
if [ "$branch" != "HEAD" ] && git fetch --quiet origin "$branch" 2>/dev/null; then
  behind="$(git rev-list --count "HEAD..origin/$branch" 2>/dev/null || echo 0)"
  ahead="$(git rev-list --count "origin/$branch..HEAD" 2>/dev/null || echo 0)"
fi

warn=""
if [ "$dirty"   != "0" ]; then warn="$warn\n  • $dirty uncommitted change(s) — commit or stash before switching devices"; fi
if [ "$stashes" != "0" ]; then warn="$warn\n  • $stashes stash(es) present — possible left-behind work"; fi
if [ "$behind"  != "0" ]; then warn="$warn\n  • behind origin/$branch by $behind — 'git pull' before working"; fi
if [ "$ahead"   != "0" ]; then warn="$warn\n  • $ahead unpushed commit(s) — 'git push' so other devices see them"; fi

if [ -n "$warn" ]; then
  echo "session-start: ⚠ working-tree health on '$branch':"
  printf "%b\n" "$warn"
else
  echo "session-start: ✓ '$branch' clean and in sync with origin"
fi

# Warn if too many open agent PRs have accumulated (batch ran more than it was reviewed).
OPEN_AGENT_PRS=$(gh pr list --state open --json headRefName \
  --jq '[.[] | select(.headRefName | startswith("feat/"))] | length' 2>/dev/null || echo 0)
if [ "${OPEN_AGENT_PRS:-0}" -gt 3 ]; then
  echo "session-start: ⚠ $OPEN_AGENT_PRS open agent PRs — review or run triage-stale-prs before next batch"
fi

exit 0
