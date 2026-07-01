/**
 * stale-plans sentinel — enforces the "plans are transient" convention.
 *
 * `.claude/plans/` is working scratch for an in-flight sprint, not an archive:
 * once a plan ships, its record belongs in an issue (closed by the PR) or an ADR,
 * and the dated file should be removed. This flags any leftover dated plan file so
 * it gets promoted-and-deleted rather than accumulating as dormant debt
 * (CLAUDE.md: "No dated/dormant files"). Read-only; files ONE `proposal`.
 *
 * `findDatedPlans` is pure so it can be unit-tested.
 */

import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DATED_PLAN = /^\d{4}-\d{2}-\d{2}-.+\.md$/

/** @param {string[]} filenames @returns {string[]} dated plan files (README excluded) */
export function findDatedPlans(filenames) {
  return filenames.filter(n => DATED_PLAN.test(n))
}

/** @returns {Array<{id:string,label:'proposal',title:string,body:string}>} */
export function scanStalePlans(root = ROOT) {
  let names = []
  try { names = readdirSync(join(root, '.claude', 'plans')) } catch { return [] }
  const dated = findDatedPlans(names)
  if (!dated.length) return []
  const shown = dated.slice(0, 10).map(f => `- \`.claude/plans/${f}\``).join('\n')
  return [{
    id: 'stale-plans-dated-files',
    label: 'proposal',
    title: `[sentinel] repo-hygiene: ${dated.length} dated plan file(s) not promoted to issues`,
    body: `\`.claude/plans/\` is transient scratch — once a plan ships, its record belongs in a closed issue or an ADR, and the dated file should be removed.\n\n${shown}\n\nPromote each to an issue (or fold into \`docs/decisions/\` / \`docs/INSIGHTS.md\`) and delete the file.\n\n_Filed by the stale-plans sentinel (read-only)._`,
  }]
}
