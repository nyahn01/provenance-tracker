/**
 * Disk-backed cache for Claude prose extractions.
 *
 * Keyed by "source:id" (e.g. "aic:16568").  Survives server restarts in dev
 * so each artwork is parsed by Claude at most once per machine.  In production
 * (Vercel), /tmp persists within the same Lambda instance — not across cold
 * starts — but it still cuts repeat calls within a warm invocation.
 *
 * Falls back silently if the filesystem is not writable.
 */

import { readFileSync, writeFile, mkdirSync } from 'fs'
import { join } from 'path'
import type { LocationEntry } from './types'

const IS_PROD = !!process.env.VERCEL
const CACHE_FILE = IS_PROD
  ? '/tmp/provenance-prose-cache.json'
  : join(process.cwd(), 'cache', 'prose-cache.json')

let mem: Record<string, LocationEntry[]> = {}

try {
  if (!IS_PROD) mkdirSync(join(process.cwd(), 'cache'), { recursive: true })
  mem = JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  console.log(`[prose-cache] loaded ${Object.keys(mem).length} entries`)
} catch {
  // First run — file doesn't exist yet, start empty.
}

export function getProseCacheEntry(key: string): LocationEntry[] | null {
  return mem[key] ?? null
}

export function setProseCacheEntry(key: string, entries: LocationEntry[]): void {
  mem[key] = entries
  writeFile(CACHE_FILE, JSON.stringify(mem, null, 2), 'utf8', err => {
    if (err) console.warn('[prose-cache] write failed:', err.message)
  })
}
