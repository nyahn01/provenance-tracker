/**
 * plan-to-issue — turn a plan / idea into a tracked GitHub issue.
 *
 * Makes YOUR plans first-class work items. Reads a Markdown file (a `.claude/plans/*`
 * doc, or any brief), derives a title from its first `#` heading, and files an issue.
 * Defaults to `proposal` (ideation, per CLAUDE.md — a human promotes to `priority`);
 * pass --priority to queue it directly.
 *
 * Usage:
 *   node scripts/plan-to-issue.mjs <file.md> [--priority] [--agent <domain>] [--title "…"] [--dry-run]
 *
 * Dry-runs automatically without a GITHUB_TOKEN (prints the issue it would file).
 *
 * `parsePlan` is pure so it can be unit-tested.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const REPO = process.env.GITHUB_REPOSITORY || 'nyahn01/provenance-tracker'
const API = 'https://api.github.com'

/**
 * Derive {title, body} from Markdown. Title = the first `# ` heading (that line is
 * dropped from the body); falls back to the first non-empty line, truncated.
 */
export function parsePlan(md, titleOverride) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  let title = titleOverride
  let bodyLines = lines
  if (!title) {
    const idx = lines.findIndex(l => /^#\s+\S/.test(l))
    if (idx >= 0) {
      title = lines[idx].replace(/^#\s+/, '').trim()
      bodyLines = lines.slice(0, idx).concat(lines.slice(idx + 1))
    } else {
      const first = lines.find(l => l.trim())
      title = (first || 'Untitled plan').trim().slice(0, 80)
    }
  }
  return { title: title.slice(0, 120), body: bodyLines.join('\n').trim() }
}

async function gh(path, init) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  const args = process.argv.slice(2)
  const file = args.find(a => !a.startsWith('--'))
  if (!file || args.includes('--help')) {
    console.log('Usage: node scripts/plan-to-issue.mjs <file.md> [--priority] [--agent <domain>] [--title "…"] [--dry-run]')
    process.exit(file ? 0 : 1)
  }
  const val = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
  const priority = args.includes('--priority')
  const agent = val('--agent')
  const dry = args.includes('--dry-run') || !process.env.GITHUB_TOKEN

  const { title, body } = parsePlan(readFileSync(file, 'utf8'), val('--title'))
  const labels = [priority ? 'priority' : 'proposal', ...(agent ? [`agent:${agent}`] : [])]
  const issueBody = `${body}\n\n_Filed from \`${file}\` via plan-to-issue._`

  if (dry) {
    console.log(`[plan-to-issue] DRY — would file [${labels.join(', ')}]:\n  ${title}`)
    return
  }
  const created = await gh(`/repos/${REPO}/issues`, {
    method: 'POST',
    body: JSON.stringify({ title, body: issueBody, labels }),
  })
  console.log(`[plan-to-issue] filed #${created.number} [${labels.join(', ')}] — ${title}`)
}

// Run only when invoked directly (so parsePlan can be imported by tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => { console.error('[plan-to-issue]', e.message); process.exit(1) })
}
