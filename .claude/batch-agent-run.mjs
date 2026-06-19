#!/usr/bin/env node
/**
 * Scheduled batch agent orchestrator
 * Runs daily (6am UTC): reads TOMORROW.md, spawns agents in parallel, routes PRs to honesty gate
 *
 * Usage:
 *   node .claude/batch-agent-run.mjs [--dry-run]
 *
 * To schedule (via /schedule CLI):
 *   /schedule --interval "0 6 * * *" --command "node .claude/batch-agent-run.mjs"
 *
 * To pause all agents:
 *   Edit TOMORROW.md, prepend [PAUSED] to priorities you want to skip
 *
 * To stop the schedule entirely:
 *   /schedule --cancel <job-id>
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dir, "..");
const tomorrowPath = path.join(projectRoot, "draft", "TOMORROW.md");

// Parse TOMORROW.md and extract unpaushed priorities
function parseTomorrow() {
  const content = fs.readFileSync(tomorrowPath, "utf-8");
  const lines = content.split("\n");
  const priorities = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match: ### 1. Title or ### [PAUSED] 1. Title
    const match = line.match(
      /^### (?:\[PAUSED\] )?(\d+)\. (.+?)(?:\n|$)/
    );
    if (!match) continue;

    const isPaused = line.includes("[PAUSED]");
    if (isPaused) continue; // Skip paused items

    const id = match[1];
    const title = match[2];

    // Find **Agent:** line in the next 5 lines
    let agent = null;
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const agentMatch = lines[j].match(/^\*\*Agent:\*\* (.+?)(?:\s|$)/);
      if (agentMatch) {
        agent = agentMatch[1].trim();
        break;
      }
    }

    if (agent) {
      priorities.push({
        id,
        title,
        agent,
        lineIndex: i,
      });
    }
  }

  return priorities;
}

// Group priorities by agent
function groupByAgent(priorities) {
  const grouped = {};
  for (const p of priorities) {
    if (!grouped[p.agent]) grouped[p.agent] = [];
    grouped[p.agent].push(p);
  }
  return grouped;
}

// Generate task for each priority
function generateAgentTask(priority) {
  return `
## Priority #${priority.id}: ${priority.title}

Find this in TOMORROW.md and expand the full acceptance criteria ("Done when").

Your workflow:
1. Read full criteria from draft/TOMORROW.md (priority #${priority.id})
2. Branch: git checkout -b feat/${priority.agent.toLowerCase().replace(/\s+/g, "-")}/priority-${priority.id}
3. Build/code/test
4. Commit frequently with semantic messages
5. When done: git push --set-upstream origin feat/...
6. Open PR with title: "feat: ${priority.title}"
   - Checklist: mark off acceptance criteria from TOMORROW.md
   - Honesty: run \`npm run verify\` before pushing
7. Main session will run honesty-gate review and merge

If you hit a blocker: comment in PR with details, don't force-push.
  `.trim();
}

// Main orchestration
async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("🤖 Batch Agent Orchestrator");
  console.log(`📅 Run time: ${new Date().toISOString()}`);
  console.log(`📝 Reading: ${tomorrowPath}\n`);

  try {
    const priorities = parseTomorrow();
    const grouped = groupByAgent(priorities);

    console.log(`Found ${priorities.length} active priorities:\n`);

    for (const [agent, items] of Object.entries(grouped)) {
      console.log(`  👤 ${agent}`);
      for (const item of items) {
        console.log(`     #${item.id}: ${item.title}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("DRY RUN:" , isDryRun);
    console.log("=".repeat(60) + "\n");

    if (isDryRun) {
      console.log("✅ Dry run complete. Use: node .claude/batch-agent-run.mjs (no --dry-run)");
      process.exit(0);
    }

    // In production, this would invoke the Agent tool via MCP
    // For now, log what would happen:
    console.log("📢 Agent spawn plan (would execute in Claude Code session):\n");

    for (const [agent, items] of Object.entries(grouped)) {
      const topPriority = items[0];
      const task = generateAgentTask(topPriority);
      console.log(`[SPAWN AGENT: ${agent}]`);
      console.log(task);
      console.log("\n" + "-".repeat(60) + "\n");
    }

    console.log(
      "✅ Batch orchestration plan ready. Run in Claude Code session to spawn agents."
    );
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();
