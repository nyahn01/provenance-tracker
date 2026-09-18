import { describe, it, expect } from 'vitest'
import { canonicalHolder, sameHolder, ALIASES as runtimeAliases } from '../src/lib/holder-names'
// @ts-ignore — plain .mjs module, no type declarations
import { canonicalHolder as scriptCanonical, ALIASES as scriptAliases } from '../scripts/lib/holder-names.mjs'
import featured from '../src/lib/featured-provenance.json'
import type { LocationEntry } from '../src/lib/types'

describe('canonicalHolder — writing, not identity', () => {
  it('collapses case, leading article and stray whitespace', () => {
    expect(canonicalHolder('Palmer Family')).toBe(canonicalHolder('Palmer family'))
    expect(canonicalHolder('  Potter   Palmer ')).toBe('Potter Palmer')
  })

  it('applies the evidenced aliases', () => {
    for (const written of ['Art Institute', 'Art Institute of Chicago', 'The Art Institute of Chicago']) {
      expect(canonicalHolder(written)).toBe('The Art Institute of Chicago')
    }
    expect(canonicalHolder('Bernheim-Jeune')).toBe('Galerie Bernheim-Jeune')
  })

  it('passes an unknown holder through untouched — never a guess', () => {
    expect(canonicalHolder('Marczell de Nemes')).toBe('Marczell de Nemes')
    expect(canonicalHolder('Mrs. W. W. Kimball')).toBe('Mrs. W. W. Kimball')
    expect(canonicalHolder('')).toBe('')
    expect(canonicalHolder(null)).toBe('')
  })

  it('never merges a joint purchase into one of its parties', () => {
    // Two dealers buying together is one custody entry naming both, not Bernheim-Jeune.
    expect(canonicalHolder('Durand-Ruel and Bernheim-Jeune')).toBe('Durand-Ruel and Bernheim-Jeune')
  })

  it('leaves the unverified person-name variant alone', () => {
    // Merging a given-name spelling is an identity claim; see the module comment.
    expect(canonicalHolder('Frederick Clay Bartlett')).not.toBe(canonicalHolder('Frederic Clay Bartlett'))
  })

  it('sameHolder recognises a writing variant without merging distinct holders', () => {
    expect(sameHolder('Art Institute', 'The Art Institute of Chicago')).toBe(true)
    expect(sameHolder('Potter Palmer', 'Palmer family')).toBe(false)
  })
})

describe('holder-name drift (scripts/lib/holder-names.mjs vs src/lib/holder-names.ts)', () => {
  it('both tables carry identical aliases', () => {
    expect(scriptAliases).toEqual(runtimeAliases)
  })

  it('both implementations agree on every alias and on a pass-through', () => {
    for (const written of [...Object.keys(runtimeAliases), 'Marczell de Nemes', 'Palmer Family', '']) {
      expect(scriptCanonical(written)).toBe(canonicalHolder(written))
    }
  })
})

describe('the committed chains are internally consistent', () => {
  const prov = featured as Record<string, LocationEntry[]>

  it('names one holder one way across every work (feedback #228)', () => {
    // Group canonical names by their case/article-insensitive key. More than one
    // spelling per key means a visitor sees the same holder written two ways.
    const byKey = new Map<string, Set<string>>()
    for (const list of Object.values(prov)) {
      for (const e of list) {
        const raw = e.institution
        if (!raw) continue
        const key = raw.toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, ' ').trim()
        if (!byKey.has(key)) byKey.set(key, new Set())
        byKey.get(key)!.add(canonicalHolder(raw))
      }
    }
    const inconsistent = [...byKey.entries()].filter(([, set]) => set.size > 1)
    expect(inconsistent).toEqual([])
  })

  it('writes the owning museum the same way in all 13 chains', () => {
    const finals = Object.values(prov)
      .map(list => list.map(e => e.institution ?? '').filter(i => /art institute/i.test(i)))
      .flat()
    expect(new Set(finals).size).toBe(1)
    expect([...new Set(finals)][0]).toBe('The Art Institute of Chicago')
  })
})
