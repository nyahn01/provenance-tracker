# Agent Orchestration with Max — Setup & Control

**You have Max.** Continuous 24/7 agent work with instant fallback to daily batch mode.

---

## ✅ What You Just Got

- **TOMORROW.md** — Unified priority queue (10 items across 4 tiers). Agents read this regardless of mode.
- **batch-agent-squad.mjs** — The workflow that spawns agents in parallel (works in both Max and batch mode).
- **PROGRESS.md** — Tracks completed features and lessons learned.
- **This guide** — How to start Max, pause anytime, or switch to batch mode.

---

## 🚀 Launch Max Now

You have Max. Agents work 24/7, respond instantly to TOMORROW.md priorities and GitHub issues.

### Start Max Continuous

```bash
/schedule --max true --workflow batch-agent-squad
```

Agents will:
- Wake every 2 hours and spawn new workers on top TOMORROW.md priorities
- Respond to GitHub issues/PRs (if webhook configured)
- Work in background (no Claude Code session needed)
- Read TOMORROW.md live; priorities can be paused anytime with `[PAUSED]`

### Test Run First (Optional)

Before scheduling, try a test run:

```bash
/workflow batch-agent-squad
```

This runs once **in your session right now**. You'll see what agents spawn and what PRs would open. Good for validation before Max takes over.

---

## ⏸️ Pause Max Anytime

### Kill All Max Agents (Complete Stop)

```bash
/schedule --list
# Note the Max job ID (e.g., wf_abc123)

/schedule --cancel wf_abc123
```

All agent work stops immediately. Existing PRs stay open; no more agents spawn until you restart.

### Pause One Priority (But Keep Max Running)

Edit `draft/TOMORROW.md`:

```markdown
### [PAUSED] 1. Reconciliation reconciliation: fix the uncertainty display
```

Max will skip this priority next round and work on #2. Remove `[PAUSED]` to resume.

### Pause One Agent Domain (But Keep Others)

Edit the specific priorities for that agent in TOMORROW.md:

```markdown
### [PAUSED] 2. Museum exhibition-loan extraction from prose
**Agent:** provenance-data
```

This pauses that specific provenance-data priority; other provenance-data priorities will still run.

---

## 🔄 Fallback to Daily Batch (Anytime)

**If Max is too aggressive, dial it back to daily batch runs:**

```bash
/schedule --list
# Note the Max job ID

/schedule --cancel wf_abc123

# Now start daily batch instead
/schedule --interval "0 6 * * *" --workflow batch-agent-squad
```

Agents now run **once per day at 6am UTC** instead of continuously. Easier to monitor and control.

**To go back to Max:**

```bash
/schedule --cancel <daily-job-id>
/schedule --max true --workflow batch-agent-squad
```

---

## 📋 Max vs Batch Comparison

| Feature | Max (Continuous) | Batch (Daily) |
|---------|---|---|
| **Frequency** | Every 2 hours + webhooks | Once per day (6am UTC) |
| **Wall-clock Speed** | Fast (agents always working) | Slower (wait until 6am) |
| **Cost** | Higher (continuous compute) | Lower (daily bursts) |
| **Control** | Harder (always running) | Easier (scheduled windows) |
| **Pause** | `/schedule --cancel` | `/schedule --cancel` |
| **Switch** | `--cancel` + restart with `--interval` | `--cancel` + restart with `--max` |

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
