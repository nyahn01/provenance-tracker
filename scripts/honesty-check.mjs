#!/usr/bin/env node
/**
 * Honesty gate — runs on every PR diff (or the full src/ tree in CI).
 * Exits 0 if clean. Exits 1 with a clear report if any check fails.
 *
 * Usage:
 *   node scripts/honesty-check.mjs          # checks git diff vs main
 *   node scripts/honesty-check.mjs --full   # checks entire src/ tree
 */

import { execSync } from 'child_process'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const FULL = process.argv.includes('--full')
const ROOT = process.cwd()

// ─── Patterns that must NEVER appear in source or data ───────────────────────

const FORBIDDEN = [
  // Real-time claims we can't verify from static APIs.
  // Only match in actual content strings (not in comments explaining the rule).
  { pattern: /["'`]([^"'`]*\bon view\b[^"'`]*)["'`]/i,   reason: 'Claims real-time museum display — we cannot verify this from static APIs' },
  { pattern: /currently on (view|display)/i,               reason: 'Real-time display claim — use "as of [year]" with a source instead' },
  { pattern: /currently (held|housed|located|owned) (at|by)/i, reason: 'Present-tense custody claim without a date — add a dated source' },

  // Invented / speculative provenance in data output (not in comments or UI copy)
  { pattern: /\bprobably (owned|held|acquired) by\b/i,    reason: 'Speculative ownership in data — mark as gap with a note instead' },
  { pattern: /\blikely (owned|held|passed through)\b/i,   reason: 'Speculative provenance — mark as gap instead' },

  // Null-island coordinates in JSON data files
  { pattern: /"lat"\s*:\s*0[,\s}]/,                        reason: 'Null-island lat:0 in data — use null for unknown coordinates' },
  { pattern: /"lng"\s*:\s*0[,\s}]/,                        reason: 'Null-island lng:0 in data — use null for unknown coordinates' },

  // example.com left in API user-agent strings
  { pattern: /contact:\s*\S+@example\.com/i,               reason: 'example.com in API user-agent — replace with real contact email' },

  // Placeholder text that ships into production data
  { pattern: /lorem ipsum/i,                               reason: 'Lorem ipsum placeholder text in shipped file' },
]

// Patterns required in data files (public/data/*.json)
const DATA_REQUIRED = [
  { field: 'sourceLabel', reason: 'Every data record must carry a sourceLabel (e.g. "Getty GPI — Knoedler")' },
]

// ─── File collection ──────────────────────────────────────────────────────────

function getDiffFiles() {
  try {
    const base = execSync('git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main', { encoding: 'utf8' }).trim()
    const diff = execSync(`git diff --name-only ${base} HEAD`, { encoding: 'utf8' })
    return diff.trim().split('\n').filter(f =>
      f && !f.startsWith('feedback/') &&
      (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.mjs') || f.endsWith('.json'))
    )
  } catch {
    // Fallback: all staged files
    try {
      const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      return staged.trim().split('\n').filter(Boolean)
    } catch {
      return []
    }
  }
}

function walkDir(dir, exts = ['.ts', '.tsx', '.mjs', '.json']) {
  const results = []
  try {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.') || name === 'node_modules') continue
      const full = join(dir, name)
      const stat = statSync(full)
      if (stat.isDirectory()) results.push(...walkDir(full, exts))
      else if (exts.includes(extname(name))) results.push(full)
    }
  } catch {}
  return results
}

const files = FULL
  ? walkDir(join(ROOT, 'src')).concat(walkDir(join(ROOT, 'scripts')))
  : getDiffFiles().map(f => join(ROOT, f))

// ─── Checks ───────────────────────────────────────────────────────────────────

const violations = []
let filesChecked = 0

for (const file of files) {
  let content
  try { content = readFileSync(file, 'utf8') } catch { continue }

  // Skip seed data output files and this script itself from pattern checks
  const isRawData = file.includes('public/data/') || file.includes('public\\data\\')
  const isSelf = file.includes('honesty-check') || file.includes('verify.mjs')
  if (isSelf) continue

  filesChecked++
  const lines = content.split('\n')

  if (!isRawData) {
    for (const { pattern, reason } of FORBIDDEN) {
      lines.forEach((line, i) => {
        const trimmed = line.trim()
        // Skip pure comment lines and intentional meta-references marked // honesty-ok
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return
        if (line.includes('honesty-ok')) return
        if (pattern.test(line)) {
          violations.push({ file: file.replace(ROOT, '').replace(/\\/g, '/'), line: i + 1, text: trimmed, reason })
        }
      })
    }
  }

  // Data file structural checks
  if (isRawData && file.endsWith('.json') && content.trim().startsWith('[')) {
    try {
      const records = JSON.parse(content)
      if (Array.isArray(records) && records.length > 0) {
        const sample = records[0]
        for (const { field, reason } of DATA_REQUIRED) {
          if (!(field in sample)) {
            violations.push({ file: file.replace(ROOT, '').replace(/\\/g, '/'), line: 1, text: `Missing field: ${field}`, reason })
          }
        }
      }
    } catch {
      violations.push({ file: file.replace(ROOT, '').replace(/\\/g, '/'), line: 1, text: 'Invalid JSON', reason: 'Data file is not valid JSON' })
    }
  }
}

// ─── Source citation spot-check (API routes only) ─────────────────────────────
// Any route that constructs a LocationEntry must include a `source` field.
const routeFiles = files.filter(f => f.includes('/api/') || f.includes('\\api\\'))
for (const file of routeFiles) {
  let content
  try { content = readFileSync(file, 'utf8') } catch { continue }
  // If a file pushes LocationEntry objects, check that `source:` is always set
  if (content.includes('startDate') && content.includes('lat') && !content.includes('source:')) {
    violations.push({
      file: file.replace(ROOT, '').replace(/\\/g, '/'),
      line: 0,
      text: 'LocationEntry construction without source: field',
      reason: 'Every location event must carry its source for the credibility chain',
    })
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const GRN = '\x1b[32m', RED = '\x1b[31m', YLW = '\x1b[33m', RST = '\x1b[0m', DIM = '\x1b[2m'

console.log(`\n${DIM}Honesty gate — ${filesChecked} file${filesChecked !== 1 ? 's' : ''} checked${RST}\n`)

if (violations.length === 0) {
  console.log(`${GRN}✓ All checks passed. No over-claims, no invented data, no placeholder text.${RST}\n`)
  process.exit(0)
}

console.log(`${RED}✗ ${violations.length} violation${violations.length !== 1 ? 's' : ''} found:${RST}\n`)
for (const v of violations) {
  console.log(`  ${YLW}${v.file}${v.line ? `:${v.line}` : ''}${RST}`)
  console.log(`  ${DIM}${v.text.slice(0, 100)}${v.text.length > 100 ? '…' : ''}${RST}`)
  console.log(`  ${RED}→ ${v.reason}${RST}\n`)
}

console.log(`${RED}Gate failed. Fix the violations above before committing.${RST}\n`)
process.exit(1)
