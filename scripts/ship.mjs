#!/usr/bin/env node
/**
 * ship.mjs — the single gate every agent must pass to call work "done".
 *
 * This is what lets agents self-commit without a human babysitting git.
 * An agent's report ("I built X") is a PROPOSAL. Shipping is what makes it real,
 * and ONLY this script — not the agent's opinion — decides if it ships.
 *
 *   Stage 1  build       → `next build` must compile (types + lint)
 *   Stage 2  serve        → ensure a dev server is reachable on :3000
 *   Stage 3  verify       → scripts/verify.mjs (live contract + honesty checks)
 *   Stage 4  commit       → only if --commit "<msg>" given AND all above passed
 *
 * Usage:
 *   node scripts/ship.mjs                          # gate only (no commit)
 *   node scripts/ship.mjs --commit "feat: ..."     # gate, then commit if green
 *   node scripts/ship.mjs --commit "..." --push    # also push if green
 *
 * Exit 0 = shipped/green. Exit 1 = BLOCKED (agent must fix and re-run).
 *
 * Rule for agents: never `git commit` directly. Always go through this script so
 * every commit on the branch is provably build-clean + contract-valid + honest.
 */

import { spawn } from 'node:child_process'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const commitIdx = args.indexOf('--commit')
const commitMsg = commitIdx >= 0 ? args[commitIdx + 1] : null
const doPush = args.includes('--push')
const BASE = process.env.BASE || 'http://localhost:3000'

function run(cmd, cmdArgs, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true, ...opts })
    p.on('close', code => resolve(code ?? 1))
  })
}

async function serverUp() {
  // Probe a real API route, not just /, so we don't pass while routes 404.
  try { return (await fetch(`${BASE}/api/search?q=test`)).status === 200 } catch { return false }
}

async function ensureServer() {
  if (await serverUp()) { console.log('  · existing server already serving routes'); return null }
  // Production server on the freshly built output — no per-request compile, no 404 races.
  console.log('  · starting `next start` (production) in background')
  const p = spawn('npm', ['run', 'start'], { stdio: 'ignore', shell: true, detached: true })
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 1500))
    if (await serverUp()) { console.log('  · server is up and serving routes'); return p }
  }
  console.error('  ✗ server never came up'); return p
}

function block(stage) {
  console.error(`\n✗ BLOCKED at stage: ${stage}. Nothing committed. Fix and re-run.\n`)
  process.exit(1)
}

const main = async () => {
  console.log('\n══ ship gate ══\n')

  console.log('Stage 1 — build')
  if (await run('npm', ['run', 'build']) !== 0) block('build')

  console.log('\nStage 2 — serve')
  const started = await ensureServer()
  if (!(await serverUp())) block('serve')

  console.log('\nStage 3 — verify')
  if (await run('node', ['scripts/verify.mjs']) !== 0) {
    if (started) try { process.kill(-started.pid) } catch {}
    block('verify')
  }

  if (commitMsg) {
    console.log('\nStage 4 — commit')
    // shell:false so a multi-word commit message is passed as ONE argv entry,
    // not re-split by the shell.
    const add = spawnSync('git', ['add', '-A'], { stdio: 'inherit', shell: false })
    if (add.status !== 0) block('git add')
    const commit = spawnSync('git', ['commit', '-m', commitMsg], { stdio: 'inherit', shell: false })
    if (commit.status !== 0) block('git commit')
    if (doPush) {
      const push = spawnSync('git', ['push'], { stdio: 'inherit', shell: false })
      if (push.status !== 0) block('git push')
    }
    console.log(`\n✓ SHIPPED — gate green, committed${doPush ? ' + pushed' : ''}.\n`)
  } else {
    console.log('\n✓ GREEN — gate passed (no --commit given, nothing committed).\n')
  }

  if (started) try { process.kill(-started.pid) } catch {}
  process.exit(0)
}

main().catch(err => { console.error('ship.mjs crashed:', err); process.exit(1) })
