export const meta = {
  name: "triage-stale-prs",
  description: "Close duplicate open agent PRs — keep only the newest per issue, comment on closed ones",
  phases: [
    { title: "Scan", detail: "list open agent PRs, group by issue number" },
    { title: "Close", detail: "close superseded PRs with a comment" },
  ],
};

// ─── Phase: Scan ─────────────────────────────────────────────────────────────
phase("Scan");

const prsRaw = await agent(
  `In the provenance-tracker project at C:\\Users\\Windows11\\Downloads\\provenance-tracker, run exactly this command:
  gh pr list --state open --json number,title,headRefName,createdAt --limit 100
Return ONLY the raw JSON array — no prose, no code fences.`,
  { label: "scan:open-prs", phase: "Scan" }
);

if (!prsRaw) {
  log("❌ Could not read open PRs — aborting.");
  return { error: "Could not read open PRs" };
}

let prs;
try {
  const s = prsRaw.indexOf("["), e = prsRaw.lastIndexOf("]");
  prs = JSON.parse(s >= 0 && e >= 0 ? prsRaw.slice(s, e + 1) : prsRaw);
} catch (err) {
  log(`❌ Could not parse PR JSON: ${String(err).slice(0, 120)}`);
  return { error: "Bad PR JSON" };
}

// Only care about agent-opened branches (feat/*/issue-*)
const agentPRs = prs.filter((pr) => /^feat\/.+\/issue-\d+/.test(pr.headRefName || ""));
log(`Found ${agentPRs.length} open agent PR(s) out of ${prs.length} total open PRs.`);

if (agentPRs.length === 0) {
  log("✅ No open agent PRs — nothing to triage.");
  return { closed: 0, kept: 0 };
}

// Group by issue number, sort each group newest-first
const byIssue = {};
for (const pr of agentPRs) {
  const m = (pr.headRefName || "").match(/issue-(\d+)/);
  if (!m) continue;
  const issueNum = m[1];
  if (!byIssue[issueNum]) byIssue[issueNum] = [];
  byIssue[issueNum].push(pr);
}
for (const issueNum of Object.keys(byIssue)) {
  byIssue[issueNum].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

const duplicateGroups = Object.entries(byIssue).filter(([, group]) => group.length > 1);
const singleGroups = Object.entries(byIssue).filter(([, group]) => group.length === 1);

log(`\nIssues with exactly 1 open PR (keep as-is): ${singleGroups.length}`);
for (const [issueNum, [pr]] of singleGroups) {
  log(`   Issue #${issueNum} → PR #${pr.number}: ${pr.title}`);
}

log(`\nIssues with duplicate PRs (will close older ones): ${duplicateGroups.length}`);
for (const [issueNum, group] of duplicateGroups) {
  log(`   Issue #${issueNum}: ${group.length} open PRs`);
  log(`     KEEP   → PR #${group[0].number} (${group[0].createdAt.slice(0, 10)}): ${group[0].title}`);
  for (const pr of group.slice(1)) {
    log(`     CLOSE  → PR #${pr.number} (${pr.createdAt.slice(0, 10)}): ${pr.title}`);
  }
}

if (duplicateGroups.length === 0) {
  log("\n✅ No duplicate PRs — each issue has at most one open PR.");
  return { closed: 0, kept: agentPRs.length };
}

// ─── Phase: Close ─────────────────────────────────────────────────────────────
phase("Close");

const toClose = duplicateGroups.flatMap(([, group]) =>
  group.slice(1).map((pr) => ({ pr, supersededBy: group[0] }))
);

log(`Closing ${toClose.length} superseded PR(s)...`);

const closeResults = await parallel(
  toClose.map(({ pr, supersededBy }) => async () => {
    const result = await agent(
      `In the provenance-tracker project at C:\\Users\\Windows11\\Downloads\\provenance-tracker, close a superseded PR.

PR to close: #${pr.number} (branch: ${pr.headRefName})
Superseded by: #${supersededBy.number} (branch: ${supersededBy.headRefName}, opened ${supersededBy.createdAt.slice(0, 10)})

Run these two commands in order:
1. \`gh pr comment ${pr.number} --body "Superseded by #${supersededBy.number} from a later batch run. Closing to keep the queue clean."\`
2. \`gh pr close ${pr.number}\`

Report: confirm both commands succeeded, or describe any error.`,
      { label: `close:pr-${pr.number}`, phase: "Close" }
    );
    return { prNumber: pr.number, supersededBy: supersededBy.number, result };
  })
);

const closed = closeResults.filter(Boolean).length;
const kept = singleGroups.length + duplicateGroups.length;

log(`\n📊 Triage complete: ${closed} PR(s) closed, ${kept} PR(s) kept (one per issue).`);

return { closed, kept, toClose: toClose.length };
