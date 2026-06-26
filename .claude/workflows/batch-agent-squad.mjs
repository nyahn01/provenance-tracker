export const meta = {
  name: "batch-agent-squad",
  description: "Batch run: read TOMORROW.md live, spawn agents in parallel by domain, route PRs to honesty gate",
  phases: [
    { title: "Plan", detail: "read TOMORROW.md, extract active priorities by agent" },
    { title: "Build", detail: "spawn agents in parallel per domain" },
    { title: "Verify", detail: "run honesty-gate on each PR" },
  ],
};

// ─── Phase: Plan ─────────────────────────────────────────────────────────────
phase("Plan");

// Sync local main to origin BEFORE reading the queue. The workflow reads the
// local working-tree TOMORROW.md and agents branch from local main; if local is
// stale the squad rebuilds already-merged priorities (happened 2026-06-23: #5
// was merged as PR #20 on origin but local main lagged, so #5 was duplicated).
const syncResult = await agent(
  `In the provenance-tracker project at C:\\Users\\Windows11\\Downloads\\provenance-tracker, sync local main to origin so the batch run reads the true remote state.

Run these git commands in order and report the outcome:
1. \`git stash --include-untracked\` ONLY if there are uncommitted changes (check \`git status --porcelain\` first; skip stash if clean).
2. \`git fetch origin --prune\`
3. \`git checkout main\`
4. \`git merge --ff-only origin/main\`  — if this fails because local main has diverged, do NOT force; stop and report "main diverged — manual reconciliation needed".
5. If you stashed in step 1, \`git stash pop\` (report any conflicts; do not force-resolve).

Report: the commit hash main is now at, whether a fast-forward happened, and any blocker. Do NOT push, merge PRs, or modify files other than via the git operations above.`,
  { label: "sync:local-main-to-origin", phase: "Plan" }
);
log(`🔄 main sync: ${syncResult ? String(syncResult).split("\n")[0].slice(0, 160) : "no result"}`);

// Read TOMORROW.md as source of truth (not a hardcoded queue)
const tomorrowRaw = await agent(
  `Read the file draft/TOMORROW.md in the provenance-tracker project at C:\\Users\\Windows11\\Downloads\\provenance-tracker and return its full text contents. Return ONLY the raw file contents, nothing else.`,
  { label: "read:TOMORROW.md", phase: "Plan" }
);

if (!tomorrowRaw) {
  log("❌ Could not read TOMORROW.md — aborting.");
  return { error: "Could not read TOMORROW.md" };
}

// Parse priorities from the raw markdown
// Extract: ### N. Title, **Agent:** name, **Done when:** ..., full block up to next ###
const PRIORITY_QUEUE = [];
const lines = tomorrowRaw.split("\n");

let current = null;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Match active priority headings (skip [PAUSED])
  const headingMatch = line.match(/^### (?!\[PAUSED\])(\d+)\. (.+)/);
  if (headingMatch) {
    if (current) PRIORITY_QUEUE.push(current);
    current = {
      id: headingMatch[1],
      title: headingMatch[2].trim(),
      agent: null,
      fullBlock: line + "\n",
    };
    continue;
  }

  // Match **Agent:** line
  if (current) {
    const agentMatch = line.match(/^\*\*Agent:\*\*\s+(.+)/);
    if (agentMatch) {
      current.agent = agentMatch[1].trim();
    }
    // Stop at next section heading or horizontal rule
    if (line.startsWith("## ") || line.startsWith("---")) {
      if (current) { PRIORITY_QUEUE.push(current); current = null; }
    } else {
      current.fullBlock += line + "\n";
    }
  }
}
if (current) PRIORITY_QUEUE.push(current);

// Filter out entries without an agent (malformed or section headers)
const valid = PRIORITY_QUEUE.filter(p => p.agent);

if (valid.length === 0) {
  log("✅ No active priorities in TOMORROW.md — nothing to do.");
  return { priorities: 0 };
}

log(`📋 Active priorities: ${valid.length}`);
for (const p of valid) {
  log(`   #${p.id} [${p.agent}]: ${p.title}`);
}

// Group by agent — each agent gets their top priority this run
const byAgent = {};
for (const p of valid) {
  if (!byAgent[p.agent]) byAgent[p.agent] = [];
  byAgent[p.agent].push(p);
}

const agentDomains = Object.keys(byAgent);
log(`👥 Domains this run: ${agentDomains.join(", ")}`);

// ─── Phase: Build ─────────────────────────────────────────────────────────────
phase("Build");

const agentRuns = await parallel(
  agentDomains.map((agentName) => async () => {
    const topPriority = byAgent[agentName][0];

    const result = await agent(
      `You are the **${agentName}** specialist for the provenance-tracker project.

Working directory: C:\\Users\\Windows11\\Downloads\\provenance-tracker

## Priority #${topPriority.id}: ${topPriority.title}

${topPriority.fullBlock}

## Hard constraints (read before starting)

1. **GLOBE CONTRACT** — If your task touches StoriesApp.tsx, re-read the GLOBE CONTRACT section in draft/TOMORROW.md first. The globe init pattern is locked. Do not deviate.
2. **Types first** — Any new data shape MUST be added to src/lib/types.ts before any other file changes.
3. **Honesty** — Never invent dates, coordinates, or sources. Sparse data shown as a gap, not faked.
4. **Design tokens** — Use ONLY colors/fonts from draft/CLAUDE.md. No deviations.

## Workflow

1. Read draft/TOMORROW.md priority #${topPriority.id} in full (especially "Done when" criteria).
2. Check if the feature already exists — if it does, close this task with "already shipped" and stop.
3. Branch: \`git checkout -b feat/${agentName.toLowerCase().replace(/\s+/g, "-")}/priority-${topPriority.id}\`
4. Implement. Run \`npm run build\` — fix ALL TypeScript errors before continuing.
5. Run \`npm run honesty\` — fix any honesty violations.
6. Commit with semantic messages. Push: \`git push --set-upstream origin HEAD\`
7. Open a GitHub PR:
   - Title: \`feat: ${topPriority.title}\`
   - Body: Link to TOMORROW.md priority #${topPriority.id} + "Done when" checklist ticked
8. Report back: PR URL + one-sentence summary of what was built.
9. Do NOT merge. Main session runs honesty gate before merge.

## Blockers

If you hit a blocker, comment in the PR:
\`\`\`
## Blocker
[reason]
@main-session: [decision needed]
\`\`\`
Then stop. Do NOT guess or force past it.`,
      {
        label: `${agentName}:priority-${topPriority.id}`,
        phase: "Build",
      }
    );

    return { agent: agentName, priority: topPriority.id, title: topPriority.title, result };
  })
);

const ran = agentRuns.filter(Boolean);
log(`✅ Build complete: ${ran.length}/${agentDomains.length} agents reported.`);

// ─── Phase: Verify ─────────────────────────────────────────────────────────────
phase("Verify");

if (ran.length === 0) {
  log("No PRs to review.");
  return { agents: agentDomains, priorities: valid.length };
}

log(`🚨 Running honesty gate on ${ran.length} PR(s)...`);

const honestyReviews = await parallel(
  ran.map((run) => async () => {
    const review = await agent(
      `You are the **provenance-honesty-review** gate for provenance-tracker.

Agent **${run.agent}** just worked on priority #${run.priority}: "${run.title}".

Their report:
${run.result}

## Your job: BLOCK or APPROVE

Check for:
1. **Over-claiming?** Any fact shown without a visible source? (Every fact needs "Source: Wikidata / Met / AIC / RKD")
2. **Faked data?** Invented dates, coordinates, or gap-filling? (Never allowed)
3. **Custody vs loans?** Ownership and exhibition loans conflated? (Must be separate)
4. **Globe contract violated?** If StoriesApp.tsx was touched, does the PR confirm the locked init pattern was preserved?
5. **Types first?** If a new data shape was added, was src/lib/types.ts updated first?
6. **Build passing?** Did they confirm \`npm run build\` and \`npm run honesty\` passed?

Reply with:
- **BLOCK: [reason]** if any rule was violated. Be specific — agent will fix and re-push.
- **APPROVE** if clean. Main session will merge.`,
      {
        label: `honesty-gate:${run.agent}:priority-${run.priority}`,
        phase: "Verify",
      }
    );

    const verdict = review && review.includes("APPROVE") ? "APPROVED" : "BLOCKED";
    log(`  ${verdict}: ${run.agent} #${run.priority} — ${run.title}`);
    return { agent: run.agent, priority: run.priority, verdict, review };
  })
);

const approved = honestyReviews.filter(r => r && r.verdict === "APPROVED").length;
const blocked = honestyReviews.filter(r => r && r.verdict === "BLOCKED").length;

log(`\n📊 Results: ${approved} approved, ${blocked} blocked.`);
if (blocked > 0) log(`   Blocked PRs stay open — agents re-push after fixing.`);
log(`\n🎉 Batch complete. Check GitHub for open PRs.`);

return {
  agents: agentDomains,
  priorities: valid.length,
  approved,
  blocked,
};
