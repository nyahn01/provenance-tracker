/**
 * Getty Provenance Index search helper — merges Knoedler (1872–1970) and Goupil & Cie (1846–1919).
 * Used by /api/getty (direct REST) and /api/provenance (parallel enrichment).
 * Source: Getty Research Institute, CC0 1.0 Public Domain.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import type { GettyRecord } from './types'

let _records: GettyRecord[] | null = null

// Repair a seed bug where a full Rosetta Handle URL was prefixed again, e.g.
// "https://hdl.handle.net/http://hdl.handle.net/10020/xxx". Strip the outer
// wrapper so the archival-evidence link actually resolves.
function normalizeSourceUrl(url: string | null): string | null {
  if (!url) return url
  const m = url.match(/^https?:\/\/hdl\.handle\.net\/(https?:\/\/.+)$/)
  return m ? m[1] : url
}

function loadFile(filename: string, warnScript: string): GettyRecord[] {
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'data', filename), 'utf8')
    const records = JSON.parse(raw) as GettyRecord[]
    return records.map(r => ({ ...r, sourceUrl: normalizeSourceUrl(r.sourceUrl) }))
  } catch {
    console.warn(`[getty] Seed file missing: ${filename} — run: node scripts/${warnScript}`)
    return []
  }
}

function getRecords(): GettyRecord[] {
  if (_records) return _records
  const knoedler = loadFile('getty-knoedler.json', 'seed-getty.mjs')
  const goupil = loadFile('getty-goupil.json', 'seed-goupil.mjs')
  _records = [...knoedler, ...goupil]
  console.info(`[getty] Loaded ${knoedler.length} Knoedler + ${goupil.length} Goupil records`)
  return _records
}

/**
 * Extract the last name from display strings like "Claude Monet (French, 1840–1926)"
 * Returns uppercase last name for matching Knoedler "LASTNAME, FIRSTNAME" authority field.
 */
export function artistLastName(artistDisplay: string): string {
  const stripped = artistDisplay.replace(/\s*\(.*?\)\s*/g, '').trim()
  const parts = stripped.split(/\s+/)
  return (parts[parts.length - 1] || '').toUpperCase()
}

function matchesArtist(record: GettyRecord, lastName: string): boolean {
  if (!record.artist || !lastName) return false
  return record.artist.split(',')[0].trim().toUpperCase() === lastName
}

function matchesTitle(record: GettyRecord, title: string): boolean {
  if (!title || !record.title) return true
  const rt = record.title.toLowerCase()
  const words = title.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 4)
  return words.length === 0 || words.some(w => rt.includes(w))
}

/** Returns up to `limit` Knoedler records matching the given artist (and optionally title). */
export function searchGetty(artist: string, title = '', limit = 20): GettyRecord[] {
  const lastName = artistLastName(artist)
  if (!lastName) return []
  return getRecords()
    .filter(r => matchesArtist(r, lastName) && matchesTitle(r, title))
    .slice(0, limit)
}
