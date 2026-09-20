/**
 * Featured-registry invariants — the guardrail behind the promotion flow.
 *
 * promote-work.mjs deliberately does NOT edit featured.ts or the preparse
 * registry (hand-curated files are pasted, not regex-edited). This suite is
 * what catches a forgotten paste, a duplicate slug, a missing image, or a
 * chain that would ship as a broken journey.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FEATURED_WORKS } from '../src/lib/featured'
import committedChains from '../src/lib/featured-provenance.json'
// @ts-ignore — plain .mjs module, no type declarations
import { validateChain } from '../scripts/curate.mjs'
// @ts-ignore — plain .mjs module, no type declarations
import { magicOf, MIN_BYTES } from '../scripts/lib/image-magic.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('featured registry invariants', () => {
  it('slugs are unique and URL-safe', () => {
    const slugs = FEATURED_WORKS.map(f => f.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9][a-z0-9-]*$/)
  })

  it('ids are unique and every field is populated', () => {
    const ids = FEATURED_WORKS.map(f => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const f of FEATURED_WORKS) {
      expect(f.source).toBe('aic')
      for (const field of ['id', 'slug', 'title', 'artist', 'year', 'hook', 'imageId', 'localSrc', 'credit'] as const) {
        expect(f[field], `${f.slug}.${field}`).toBeTruthy()
      }
      // The display year must contain a parseable 4-digit year (artist-origin fix
      // and the /work page's creationYear both rely on it).
      expect(f.year, `${f.slug}.year`).toMatch(/\b(1[5-9]\d{2}|20[0-2]\d)\b/)
    }
  })

  it('featured.ts and featured-provenance.json agree bidirectionally', () => {
    const tsKeys = new Set(FEATURED_WORKS.map(f => `${f.source}:${f.id}`))
    const jsonKeys = new Set(Object.keys(committedChains))
    expect([...tsKeys].filter(k => !jsonKeys.has(k))).toEqual([])
    expect([...jsonKeys].filter(k => !tsKeys.has(k))).toEqual([])
  })

  it('every featured work has a real committed hero image', () => {
    for (const f of FEATURED_WORKS) {
      const path = join(ROOT, 'public', f.localSrc)
      expect(existsSync(path), `${f.slug}: missing ${f.localSrc}`).toBe(true)
      const buf = readFileSync(path)
      expect(magicOf(buf), `${f.slug}: not a real image`).toBeTruthy()
      expect(buf.length, `${f.slug}: suspiciously small image`).toBeGreaterThanOrEqual(MIN_BYTES)
    }
  })

  it('every committed chain passes the Stage-5 gate (validateChain)', () => {
    for (const [key, chain] of Object.entries(committedChains)) {
      const g = validateChain(chain)
      expect(g.errors, `${key}: ${g.errors.join(' | ')}`).toEqual([])
    }
  })

  it('the preparse registry lists exactly the featured ids (two registries, kept in sync by hand)', () => {
    // preparse-provenance.mjs runs main() at import — read it as text, never import it.
    const src = readFileSync(join(ROOT, 'scripts', 'preparse-provenance.mjs'), 'utf8')
    const block = src.match(/const FEATURED = \[([\s\S]*?)\]/)?.[1] ?? ''
    const preparseIds = new Set([...block.matchAll(/id:\s*'(\d+)'/g)].map(m => m[1]))
    const featuredIds = new Set(FEATURED_WORKS.map(f => f.id))
    expect([...featuredIds].filter(id => !preparseIds.has(id)), 'missing from preparse FEATURED').toEqual([])
    expect([...preparseIds].filter(id => !featuredIds.has(id)), 'stale in preparse FEATURED').toEqual([])
  })
})
