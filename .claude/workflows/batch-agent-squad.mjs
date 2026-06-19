export const meta = {
  name: "batch-agent-squad",
  description: "Daily 6am batch: read TOMORROW.md, spawn agents in parallel by domain, route PRs to honesty gate",
  phases: [
    { title: "Plan", detail: "parse TOMORROW.md, group by agent" },
    { title: "Build", detail: "spawn agents in parallel per domain" },
    { title: "Verify", detail: "run honesty-gate on each PR" },
  ],
};

// Parse TOMORROW.md in memory (no FS available in workflows)
// For now, manually define the priority queue from TOMORROW.md
const PRIORITY_QUEUE = [
  {
    id: "1",
    title: "Reconciliation reconciliation: fix the uncertainty display",
    agent: "provenance-data",
    task: `Priority #1 from TOMORROW.md:

Title: Reconciliation reconciliation: fix the uncertainty display

What: Add \`confidence: "high" | "medium" | "low"\` to provenance timeline shape. Wikidata P276 = medium, exhibition catalogs = high, web extraction = low.

Done when: provenance-timeline returns typed confidence; panel renders a "confidence badge" next to each event.

Branch: feat/provenance-data/confidence-levels
Test: Query Starry Night, verify confidence shows in timeline.
PR checklist: confidence shape in types.ts, integration test passes, demo script updated.`,
  },
  {
    id: "2",
    title: "Museum exhibition-loan extraction from prose",
    agent: "provenance-data",
    task: `Priority #2 from TOMORROW.md:

Title: Museum exhibition-loan extraction from prose

What: Parse museum collection pages for "on loan" / "loaned" / "borrowed" markers. Return typed \`ExhibitionLoan\` shape. Test with Starry Night @ MOMA.

Done when: Query returns structured loans with dates; PR passes honesty checklist.

Branch: feat/provenance-data/exhibition-loans
Test: Starry Night should show loans at MOMA, Louvre, etc. with dates.
PR checklist: ExhibitionLoan type defined, parsing logic added, test case passes.`,
  },
  {
    id: "3",
    title: "Polish globe empty-state (unscripted search, thin data)",
    agent: "provenance-globe",
    task: `Priority #3 from TOMORROW.md:

Title: Polish globe empty-state (unscripted search, thin data)

What: When data is sparse (< 3 locations), show a "Provenance gap — help improve this record" panel. Link to a form stub (no submission needed yet).

Done when: Empty search degrades to intentional-looking UI, not broken. Screenshot in PR.

Branch: feat/provenance-globe/empty-state-ux
Test: Search for a non-curated painting, verify graceful degradation.
PR checklist: Empty state UI rendered, design tokens matched, responsive on mobile.`,
  },
  {
    id: "4",
    title: "Refresh Met/AIC API caching (TTL tuning)",
    agent: "provenance-data",
    task: `Priority #4 from TOMORROW.md:

Title: Refresh Met/AIC API caching (TTL tuning)

What: Implement cache-invalidation route (\`/api/cache/invalidate?source=met\`). Add per-API TTL config (Met: 7d, AIC: 7d, Wikidata: 1d). Document in PR.

Done when: Cache hits/misses logged; invalidation works; no 429s during demo.

Branch: feat/provenance-data/cache-tuning
Test: Query Met 5 times, verify second+ hits cache; invalidate, verify refresh.
PR checklist: Cache config added, logging works, no rate-limit errors.`,
  },
];

phase("Plan");
log(`📅 Batch orchestration: ${new Date().toISOString()}`);
log(`📋 TOMORROW.md priorities: ${PRIORITY_QUEUE.length} active`);

// Group by agent
const byAgent = {};
for (const p of PRIORITY_QUEUE) {
  if (!byAgent[p.agent]) byAgent[p.agent] = [];
  byAgent[p.agent].push(p);
}

const agentKeys = Object.keys(byAgent);
log(
  `👥 Agent domains: ${agentKeys.join(", ")}`
);

phase("Build");

// Spawn agents in parallel (one per domain, working on their top priority)
const agentRuns = await parallel(
  agentKeys.map((agentName) => async () => {
    const topPriority = byAgent[agentName][0];

    const result = await agent(
      `You are the **${agentName}** specialist.

## Priority #${topPriority.id}: ${topPriority.title}

${topPriority.task}

## Workflow

1. **Read** the priority details above.
2. **Branch:** \`git checkout -b feat/${agentName.toLowerCase().replace(/\\s+/g, "-")}/priority-${topPriority.id}\`
3. **Code:** Implement the feature. Run \`npm run verify\` to check types and tests.
4. **Commit:** Semantic messages, one feature per commit.
5. **Push:** \`git push --set-upstream origin\`
6. **Open PR** with:
   - Title: \`feat: ${topPriority.title}\`
   - Description: Link to TOMORROW.md priority #${topPriority.id}
   - Checklist: Mark off "Done when" criteria
   - Self-check: Run \`npm run verify\` (types + tests must pass)

7. **Do NOT merge.** Main session runs honesty-gate before merge.

## If you hit a blocker

Comment in the PR with details. Do NOT force-push or give up. Examples of blockers:
- API rate limit? Ask main: cache more? stub test data?
- Unsure about design? Attach screenshot, let main session decide.
- Data conflict (multi-source)? Flag it with \`[HONESTY]\` label for review.

## Success metrics

- PR opens with correct branch name and description
- \`npm run verify\` passes (no TS errors, tests green)
- Self-check honesty items ticked
- If data-heavy: test with live API (not mocks)

Start now. Report when PR is open.`,
      {
        label: `${agentName}:priority-${topPriority.id}`,
        phase: "Build",
      }
    );

    return {
      agent: agentName,
      priority: topPriority.id,
      result: result,
    };
  })
);

log(`✅ Agent runs complete. ${agentRuns.filter(Boolean).length}/${agentKeys.length} agents spawned PRs.`);

phase("Verify");

// Collect PR links and run honesty gate on each
const prResults = agentRuns.filter(Boolean);
if (prResults.length > 0) {
  log(`🚨 Running honesty-gate on ${prResults.length} PR(s)...`);

  const honestyReviews = await parallel(
    prResults.map((run) => async () => {
      const review = await agent(
        `You are the **provenance-honesty-review** gate.

Agent **${run.agent}** just opened a PR for priority #${run.priority}.

Their PR report:
${run.result}

## Your job

BLOCK or APPROVE based on:
1. **Over-claiming?** Do the facts match the sources shown? (Especially for Wikidata/Met/AIC data)
2. **Missing source lines?** Every on-screen fact needs attribution.
3. **Faked data?** Are they inventing dates/locations to fill gaps? (Never!)
4. **Custody vs loans?** Are ownership and exhibitions kept separate?
5. **Data shape?** Does the PR extend src/lib/types.ts BEFORE changing behavior?

## Decision

Reply with:
- **BLOCK** if any rule is violated. List specific issues. Agent fixes and pushes again.
- **APPROVE** if clean. Indicate: "Ready to merge." Main session will git merge and tag.

(Note: You're reviewing the AGENT'S report, not reading git directly. Work with what they tell you.)`,
        {
          label: `honesty-gate:${run.agent}:priority-${run.priority}`,
          phase: "Verify",
        }
      );

      return {
        agent: run.agent,
        priority: run.priority,
        verdict: review,
      };
    })
  );

  const approved = honestyReviews.filter(
    (r) => r && r.verdict && r.verdict.includes("APPROVE")
  ).length;
  const blocked = honestyReviews.filter(
    (r) => r && r.verdict && r.verdict.includes("BLOCK")
  ).length;

  log(
    `📊 Honesty gate: ${approved} approved, ${blocked} blocked. (Blocked features go back to agent for fixes.)`
  );
}

log(
  `\n🎉 Batch complete. Approved PRs ready to merge. Blocked PRs back to agents for fixes.`
);
log(`📅 Next run: tomorrow at 6am UTC`);

return {
  agents: agentKeys,
  priorities: PRIORITY_QUEUE.length,
  timestamp: new Date().toISOString(),
};
