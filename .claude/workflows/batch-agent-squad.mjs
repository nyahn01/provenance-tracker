export const meta = {
  name: "batch-agent-squad",
  description: "Batch run: read priority Issues live, spawn agents in parallel by domain, route PRs to honesty gate",
  phases: [
    { title: "Plan", detail: "read priority Issues, extract active priorities by agent" },
    { title: "Build", detail: "spawn agents in parallel per domain" },
    { title: "Verify", detail: "run honesty-gate on each PR" },
  ],
};

// ─── Phase: Plan ─────────────────────────────────────────────────────────────
phase("Plan");

// Sync local main to origin BEFORE building. The queue itself is remote GitHub
// Issues (always current), but agents BRANCH from local main; if local main is
// stale the squad rebuilds already-merged work (happened 2026-06-23: #5 was merged
// as PR #20 on origin but local main lagged, so #5 was duplicated).
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

// Read the priority queue from GitHub Issues — the single source of truth (not a
// markdown file). An agent runs `gh` and returns raw JSON; we parse it here.
// A priority = an open Issue labeled `priority` + an `agent:<domain>` label;
// anything also labeled `paused` is skipped.
const issuesRaw = await agent(
  `In the provenance-tracker project at C:\\Users\\Windows11\\Downloads\\provenance-tracker, run exactly this command:
  gh issue list --label priority --state open --json number,title,body,labels --limit 50
Return ONLY the raw JSON array the command prints — no prose, no code fences.`,
  { label: "read:priority-issues", phase: "Plan" }
);

if (!issuesRaw) {
  log("❌ Could not read priority Issues — aborting.");
  return { error: "Could not read priority Issues" };
}

let issues;
try {
  // Tolerate stray prose / code fences around the JSON the agent returns.
  const start = issuesRaw.indexOf("[");
  const end = issuesRaw.lastIndexOf("]");
  issues = JSON.parse(start >= 0 && end >= 0 ? issuesRaw.slice(start, end + 1) : issuesRaw);
} catch (e) {
  log(`❌ Could not parse Issues JSON: ${String(e).slice(0, 120)}`);
  return { error: "Bad Issues JSON" };
}

// Map Issues → priorities {id, title, agent, fullBlock}. agent comes from the
// `agent:<domain>` label; the Issue body carries the Done-when criteria.
const valid = [];
for (const it of issues) {
  const names = (it.labels || []).map((l) => l.name);
  if (names.includes("paused")) continue;
  const agentLabel = names.find((n) => n.startsWith("agent:"));
  if (!agentLabel) continue; // unrouted — needs an owner label
  valid.push({
    id: String(it.number),
    title: it.title,
    agent: agentLabel.slice("agent:".length),
    fullBlock: it.body || "",
  });
}

if (valid.length === 0) {
  log("✅ No open priority Issues with an agent: label — nothing to do.");
  return { priorities: 0 };
}

// ─── In-flight guard ──────────────────────────────────────────────────────────
// Skip issues that already have an open PR from a prior run (any device, any
// session). Without this, every scheduled run re-spawns agents for in-flight
// work and PRs pile up faster than they can be reviewed.
const openPRsRaw = await agent(
  `In the provenance-tracker project at C:\\Users\\Windows11\\Downloads\\provenance-tracker, run exactly this command:
  gh pr list --state open --json number,title,headRefName --limit 100
Return ONLY the raw JSON array — no prose, no code fences.`,
  { label: "read:open-prs", phase: "Plan" }
);

const inFlightIssues = new Set();
if (openPRsRaw) {
  try {
    const s = openPRsRaw.indexOf("["), e = openPRsRaw.lastIndexOf("]");
    const openPRs = JSON.parse(s >= 0 && e >= 0 ? openPRsRaw.slice(s, e + 1) : openPRsRaw);
    for (const pr of openPRs) {
      const m = (pr.headRefName || "").match(/issue-(\d+)/);
      if (m) inFlightIssues.add(m[1]);
    }
  } catch (_) { /* non-fatal: if we can't parse, proceed without the guard */ }
}

const queue = valid.filter((p) => {
  if (inFlightIssues.has(p.id)) {
    log(`⏭ SKIP #${p.id} "${p.title}" — PR already open, won't duplicate`);
    return false;
  }
  return true;
});

if (queue.length === 0) {
  log("✅ All priority Issues already have open PRs — nothing new to dispatch.");
  return { priorities: valid.length, skipped: valid.length, dispatched: 0 };
}

log(`📋 Active priorities: ${valid.length} total, ${inFlightIssues.size} in-flight (skipped), ${queue.length} to dispatch`);
for (const p of queue) {
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

## Issue #${topPriority.id}: ${topPriority.title}

${topPriority.fullBlock}

## Hard constraints (read before starting)

1. **GLOBE CONTRACT** — If your task touches StoriesApp.tsx or GlobeContainer.tsx, re-read the GLOBE CONTRACT section in the root CLAUDE.md first. The globe init pattern is locked. Do not deviate.
2. **Types first** — Any new data shape MUST be added to src/lib/types.ts before any other file changes.
3. **Honesty** — Never invent dates, coordinates, or sources. Sparse data shown as a gap, not faked.
4. **Design tokens** — Use ONLY colors/fonts from src/lib/design-tokens.ts (see GLOBE CONTRACT in root CLAUDE.md). No deviations.

## Workflow

1. Read Issue #${topPriority.id} in full: \`gh issue view ${topPriority.id}\` — especially the "Done when" criteria above.
2. Check if the feature already exists — if it does, comment "already shipped" on the Issue and stop.
3. Branch: \`git checkout -b feat/${agentName.toLowerCase().replace(/\s+/g, "-")}/issue-${topPriority.id}\`
4. Implement. Run \`npm run build\` — fix ALL TypeScript errors before continuing.
5. Run \`npm run honesty\` — fix any honesty violations.
6. Commit with semantic messages. Push: \`git push --set-upstream origin HEAD\`
7. Open a GitHub PR:
   - Title: \`feat: ${topPriority.title}\`
   - Body: MUST contain \`Closes #${topPriority.id}\` (auto-closes the Issue on merge) + the "Done when" checklist ticked
8. Report back: PR URL + one-sentence summary of what was built.
9. Do NOT merge. The human reviews the Vercel preview and merges.

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
    // Extract PR URL from the build agent's report so the honesty reviewer can
  // fetch the actual diff — trusting the build agent's self-report alone is not
  // sufficient to catch overclaiming or honesty violations in the code.
  const prUrlMatch = run.result ? String(run.result).match(/https:\/\/github\.com\/\S+\/pull\/\d+/) : null;
  const prUrl = prUrlMatch ? prUrlMatch[0] : null;

  const review = await agent(
      `You are the **provenance-honesty-review** gate for provenance-tracker.

Agent **${run.agent}** just worked on priority #${run.priority}: "${run.title}".

${prUrl
  ? `## Step 1 — Read the actual diff
Run: \`gh pr diff ${prUrl}\`
Read every changed file before making your verdict. Do NOT rely solely on the build agent's self-report.`
  : `## Step 1 — No PR URL found
The build agent did not report a PR URL. Check if they opened one: \`gh pr list --state open --limit 10\` in C:\\Users\\Windows11\\Downloads\\provenance-tracker. If no PR was opened, BLOCK with reason "no PR opened".`}

## Build agent's self-report (for context only — verify against the diff)
${run.result}

## Step 2 — BLOCK or APPROVE

Check for:
1. **Over-claiming?** Any fact shown without a visible source? (Every fact needs "Source: Wikidata / Met / AIC / RKD")
2. **Faked data?** Invented dates, coordinates, or gap-filling? (Never allowed)
3. **Custody vs loans?** Ownership and exhibition loans conflated? (Must be separate)
4. **Globe contract violated?** If StoriesApp.tsx or GlobeContainer.tsx was touched, confirm the locked init pattern is intact.
5. **Types first?** If a new data shape was added, verify src/lib/types.ts was updated first.
6. **Build passing?** Confirm \`npm run build\` and \`npm run honesty\` output was clean (no errors, no warnings suppressed).

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

log(`\n📊 Results: ${approved} approved, ${blocked} blocked (${inFlightIssues.size} skipped as in-flight).`);
if (blocked > 0) log(`   Blocked PRs stay open — agents re-push after fixing.`);
log(`\n🎉 Batch complete. Check GitHub for open PRs.`);

return {
  agents: agentDomains,
  prioritiesTotal: valid.length,
  skipped: inFlightIssues.size,
  dispatched: queue.length,
  approved,
  blocked,
};
