# Batch Agent Orchestration — Setup & Control

Hybrid model: Daily scheduled batch (6am UTC) + Max for urgent hot-fixes. **Fully pauseable.**

---

## ✅ What You Just Got

- **TOMORROW.md** — Priority queue (10 items across 4 tiers). Agents read this and pick work.
- **batch-agent-squad.mjs** — The workflow that spawns agents in parallel.
- **PROGRESS.md** — Tracks completed features and lessons learned.
- **This guide** — How to start, pause, stop, and monitor.

---

## 🚀 Start Daily Batch Runs

### Option A: Use `/schedule` (Recommended)

From Claude Code terminal:

```bash
/schedule --interval "0 6 * * *" --workflow batch-agent-squad
```

This runs the workflow **every day at 6am UTC**. The workflow will:
1. Read TOMORROW.md
2. Spawn agents in parallel (one per domain: provenance-data, provenance-globe, etc.)
3. Each agent picks their top priority and opens a PR
4. Honesty gate reviews each PR (blocks or approves)
5. Report results in the main session

### Option B: Manual Test Run (Try It First)

```bash
/workflow batch-agent-squad
```

This runs it **once, right now**. Good for testing before scheduling. The workflow will report what agents spawned and what PRs were opened.

---

## ⏸️ Pause / Stop / Resume

### Pause ALL agents (stop tomorrow's batch)

```bash
/schedule --list
# Output: "batch-agent-squad" job ID: wf_abc123

/schedule --cancel wf_abc123
```

Agents will NOT run tomorrow. To restart:

```bash
/schedule --interval "0 6 * * *" --workflow batch-agent-squad
```

### Pause ONE agent (selective)

Edit `draft/TOMORROW.md`. Find the priority and prepend `[PAUSED]`:

```markdown
### [PAUSED] 1. Reconciliation reconciliation: fix the uncertainty display
```

Next batch run, that agent skips this priority and moves to #2. When ready to resume, remove `[PAUSED]`:

```markdown
### 1. Reconciliation reconciliation: fix the uncertainty display
```

### Emergency stop (kill everything)

```bash
/schedule --list
/schedule --cancel <all job IDs>
```

All batch runs stop immediately. Existing PRs stay open; no merges happen until you restart.

---

## 📊 Monitor Runs

### See all scheduled workflows

```bash
/schedule --list
```

Shows: job ID, interval, next run time, last run status.

### View last batch results

In Claude Code, look for a message like:

```
🤖 Batch orchestration complete
✅ Agent runs: 4/5 agents spawned PRs
📊 Honesty gate: 3 approved, 1 blocked
🎉 Results logged in draft/PROGRESS.md
```

### Check PROGRESS.md

After each batch run, main session updates [draft/PROGRESS.md](draft/PROGRESS.md) with:
- What shipped (merged features)
- What honesty-gate blocked (and why)
- Lessons learned
- Next-run improvements

---

## 🔄 How Agents Work (The Loop)

### 1. Batch runs at 6am UTC

The workflow reads `TOMORROW.md`, groups priorities by agent domain, spawns agents in parallel.

### 2. Each agent:

- Reads their priority from TOMORROW.md
- Creates branch: `feat/[domain]/priority-[id]`
- Codes, tests, runs `npm run verify`
- Commits with semantic messages
- Opens PR with:
  - Title: `feat: [priority title]`
  - Description: Link to TOMORROW.md priority #[id]
  - Checklist: Acceptance criteria ("Done when")
  - Self-check: Honesty items pre-ticked

### 3. Honesty gate reviews each PR

**Can APPROVE:**
- All facts sourced and visible
- Data shape extends types.ts correctly
- No invented dates/locations
- Custody ≠ loans

**Can BLOCK:**
- Over-claiming ("Met Museum collection" when it's just search results)
- Missing source lines
- Sparse data shown as fake completion
- Mixed custody and exhibition

### 4. Main session merges approved PRs

Blocked PRs go back to agent for fixes. Agent commits again, honesty gate re-reviews.

### 5. PROGRESS.md updated

Completed feature moves to PROGRESS.md + lessons learned.

---

## 🎯 Customize Priority Order

Edit `draft/TOMORROW.md`:

- **Reorder** priorities within a tier (top = next to run)
- **Add new priorities** following the template (title, agent, criteria)
- **Delete stale items** when no longer relevant
- **Pause** with `[PAUSED]` prefix

The next batch run will pick up changes automatically.

---

## 🔐 Honesty Gate Fail-Safes

The honesty gate is BLOCKING — no PR merges without approval.

### If gate blocks a priority:

1. Agent reads the feedback (comment in PR)
2. Agent fixes the issue (e.g., adds source line, fixes type shape)
3. Agent commits again and pushes to the same PR
4. Honesty gate re-reviews automatically
5. When approved, main session merges

### If agent can't fix it:

Agent comments in PR:
```markdown
## Blocker: [reason]
Unable to proceed because [detail].
@main-session: [question or decision needed]
```

Main session reads PR comment, responds in thread, agent continues. This is NOT a failed batch — it's escalation.

---

## 📝 Common Edits

### Change run time (not 6am)

```bash
/schedule --cancel <old-job-id>
/schedule --interval "0 22 * * *" --workflow batch-agent-squad  # 10pm UTC instead
```

### Add a new priority

1. Edit `draft/TOMORROW.md`
2. Add a new `### N. Title` section under the right tier
3. Fill in: Agent, Why, What, Done when, Blocks
4. Next batch run will pick it up

### Remove a priority

Delete the section from `draft/TOMORROW.md`. Agents skip it next run.

### Max integration (future)

To add continuous agent work (webhook-triggered hotfixes):

```bash
/schedule --max true --workflow batch-agent-squad
```

This keeps agents running 24/7, responding to issues and PRs. You can still pause individual items with `[PAUSED]`.

---

## 🆘 Troubleshooting

### "Workflow didn't run at 6am"

Check:
```bash
/schedule --list
# Is the job there? Is "next run" in the future?
# If not listed, re-schedule:
/schedule --interval "0 6 * * *" --workflow batch-agent-squad
```

### "PR opened but honesty gate is stuck"

Honesty gate has its own execution window (main session must be active to run it). Check back in 5 minutes. If still stuck:
```bash
/schedule --cancel <honesty-gate-job>
# Manually run honesty-review agent on the PR in your session
```

### "Agent opened a PR on wrong branch"

Agent made a typo (happens). In Claude Code:
```bash
git branch -d <wrong-branch>
git push origin --delete <wrong-branch>
```

Agent will re-run and use the correct branch next time.

---

## 📞 Contact / Escalate

If batch orchestration breaks or you want to redesign the workflow:

1. Note the issue (what happened, when, which agent)
2. Pause the batch: `/schedule --cancel <job-id>`
3. Fix the issue (edit TOMORROW.md, patch the workflow script, etc.)
4. Re-schedule: `/schedule --interval "0 6 * * *" --workflow batch-agent-squad`

All PRs that opened stay open until you decide to merge/close them.

---

## 🎉 Next Steps

1. **Test the workflow:** `/workflow batch-agent-squad` (run once)
2. **Schedule it:** `/schedule --interval "0 6 * * *" --workflow batch-agent-squad` (every day)
3. **Monitor:** Check PROGRESS.md after first run
4. **Iterate:** Reorder TOMORROW.md priorities based on what you see
5. **Scale up:** Add Max integration when daily batch is smooth

Good luck! 🚀
