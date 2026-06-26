# Agent Team Orchestration Guide

Five specialists live here. The main session (orchestrator) routes tasks, receives PRs, and runs the credibility gate.

## Spawning an Agent

```bash
# In main session, spawn an agent with a detailed task
runSubagent "provenance-data" "Add Wikidata P276 location history query + caching layer for Starry Night test case"
```

The agent receives:
- Your task description (what to build)
- The assigned GitHub Issue (`#N`, labeled `priority`)
- Reference to existing code (git state)
- Instruction: "Open a PR when done; main session will run honesty gate"

## What Each Agent Owns

| Agent | Domain | Start with |
|---|---|---|
| `provenance-globe` | 3D globe UI, pins, arcs, animations, panels, responsive | [provenance-globe.md](provenance-globe.md) |
| `provenance-data` | APIs (Wikidata SPARQL, Met, AIC), reconciliation, caching | [provenance-data.md](provenance-data.md) |
| `provenance-strategy` | Business case, positioning, customer research | [provenance-strategy.md](provenance-strategy.md) |
| `provenance-story` | Demo script, narrative, hero-work selection | [provenance-story.md](provenance-story.md) |
| `provenance-honesty-review` | BLOCKING gate: fact-check, source lines, no faking | [provenance-honesty-review.md](provenance-honesty-review.md) |

## Agent Workflow (per task)

### Phase 1: Receive & Plan (agent)
- Read task from main session
- Check the assigned Issue (`gh issue view N`) and CLAUDE.md constraints
- Read existing code state (git log, file structure)
- Ask clarifying questions if needed (e.g., "Should we cache Wikidata queries?")

### Phase 2: Build (agent)
- Work in isolated branch: `feat/[agent-name]/[feature]`
- Write code, commit frequently (small commits)
- Test locally: does it match design tokens? Does data round-trip correctly?
- Self-check: "Would honesty gate flag this?"

### Phase 3: Open PR (agent)
- Push to branch
- Open PR with template (see [PR_TEMPLATE.md](#))
- PR body contains `Closes #N` (auto-closes the Issue on merge)
- Checklist: honesty gate requirements pre-filled

### Phase 4: Honesty Review (main session)
- Main session runs `provenance-honesty-review` agent on the PR
- Gate reviews: over-claiming? Missing sources? Faked data?
- Can **BLOCK** (request changes) or **APPROVE** (merge)

### Phase 5: Merge & Retro (main session)
- Merge PR (the merge auto-closes the Issue)
- Tag commit if feature-complete
- The closed Issue + git history record what shipped; durable lessons go in docs/INSIGHTS.md

## Pause Points for Agents

**Stop and ask main session if:**
- You need to decide between two designs (e.g., "Should pins glow or pulse?")
- A feature touches both data AND UI (data agent builds shape first, UI agent renders)
- You hit a blocker: API rate limit? Sourcing gap?
- You're unsure if something counts as "honest" (ask honesty-review agent, don't guess)

**Never pause for:**
- Local test fixes, code cleanup, variable renames
- Choosing between equivalent implementations
- Tweaking design tokens (follow exactly what CLAUDE.md says)

## Parallel Work (Batch Mode)

When the queue (priority Issues) has independent features (e.g., "Add Wikidata SPARQL" + "Polish globe animations"):

```bash
# Main session runs /batch to spawn isolated worktrees
/batch feat/provenance-data/wikidata-sparql
/batch feat/provenance-globe/pin-animations
```

Each agent:
- Gets its own branch + worktree
- Opens PR independently
- Can be reviewed + merged separately
- Both can run in parallel (honesty gate reviews both)

## State Handoff: Main → Agent

When spawning, pass:
```markdown
## Task
Add real Met Museum search to painting detail panel.

## Priority
GitHub Issue #N (labeled `priority`)

## Constraints
- Use Met API (no auth needed): collectionapi.metmuseum.org/public/collection/v1
- Show only painting objects: departmentId=11
- Max 5 results per search
- Degrade gracefully if no results (show "No paintings found")

## Git state
- Branch: `main` (you'll create `feat/provenance-data/met-search`)
- Latest commit: d3e4f5a "Add museum pins to globe"
- Relevant files: src/lib/met-api.ts, src/components/PaintingPanel.tsx

## Definition of done
- Search returns Met paintings
- Detail panel shows: title, artist, date, image
- Honesty checklist passed (visible source line)
- PR ready for review
```

## Escalation

Agent cannot unblock? Log in PR:
```markdown
## Blocker
Met API rate-limited at 2000 req/hour. Search feature adds ~300/hour in demo.
Need: either caching layer or test data stub.

@main-session: Which should I build?
```

Main session responds in PR comment, agent continues.

---

## See Also
- [CLAUDE.md](../../CLAUDE.md) — operating contract: vision, honesty rules, design tokens, GLOBE CONTRACT
- Priority queue & what shipped — **GitHub Issues + Projects** (`gh issue list --label priority`), not markdown
