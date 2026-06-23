#!/bin/bash
# SessionStart hook: keep remote (Claude Code on the web) sessions in sync.
#
#  1. Fast-forward the current branch from origin so a session started on the
#     phone picks up commits pushed from the laptop (and vice versa).
#  2. Install npm dependencies so lint / build / verify work immediately.
#
# Synchronous: the session waits for this to finish, so dependencies are
# guaranteed present before Claude runs anything. Idempotent and non-interactive.
set -euo pipefail

# Only run in the remote web environment; local machines manage their own state.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# --- 1. Sync the branch ---------------------------------------------------
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

# --- 2. Install dependencies ----------------------------------------------
# Prefer 'npm install' over 'npm ci' so the cached container state is reused
# across sessions instead of wiping node_modules every time.
echo "session-start: installing npm dependencies"
npm install --no-audit --no-fund

echo "session-start: done"
