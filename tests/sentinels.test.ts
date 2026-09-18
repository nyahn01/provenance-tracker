import { describe, it, expect } from 'vitest'
import { scanDataQuality } from '../scripts/sentinels/data-quality.mjs'
import { findOverclaims } from '../scripts/sentinels/honesty-regression.mjs'

describe('data-quality sentinel', () => {
  it('flags null / null-island coordinates', () => {
    const prov = {
      'aic:1': [
        { name: 'Paris', lat: 48.85, lng: 2.35, startDate: '1900' },
        { name: 'Nowhere', institution: 'Galerie X', lat: null, lng: null, startDate: '1905' },
        { name: 'Origin', lat: 0, lng: 0, startDate: '1910' },
      ],
    }
    const f = scanDataQuality(prov)
    const nc = f.find((x: any) => x.id === 'data-quality-null-coordinates')
    expect(nc).toBeTruthy()
    expect(nc!.label).toBe('proposal')
    expect(nc!.body).toContain('Galerie X')
    // The idempotency marker is added by the runner, not baked into the finding.
    expect(nc!.body).not.toContain('<!-- sentinel:')
  })

  it('does NOT flag a country-level place — it is unplaced on purpose (#236)', () => {
    // Pinning a national centroid would assert a location the source never gave,
    // so flagging this would push a future fix toward faking a coordinate.
    const prov = {
      'aic:g': [
        { name: 'Munich', institution: 'A. Mayer', lat: 48.14, lng: 11.58, startDate: '1930' },
        { name: 'Germany', institution: 'Private collection', lat: null, lng: null, startDate: '1933' },
      ],
    }
    expect(scanDataQuality(prov).find((x: any) => x.id === 'data-quality-null-coordinates')).toBeUndefined()
  })

  it('flags a chain with no dated entry anywhere — nothing anchors the sequence', () => {
    const prov = {
      'aic:2': [
        { name: 'Paris', institution: 'Dealer A', lat: 48.85, lng: 2.35, startDate: null, endDate: null },
        { name: 'Chicago', institution: 'Unknown buyer', lat: 41.88, lng: -87.63, startDate: null, endDate: null },
      ],
    }
    const f = scanDataQuality(prov)
    const t = f.find((x: any) => x.id === 'data-quality-undatable-chain')
    expect(t).toBeTruthy()
    expect(t!.body).toContain('aic:2')
  })

  it('does NOT flag an undated entry that the source sequence can place (#236)', () => {
    // One dated neighbour is enough: the entry is ordered by its position in the
    // source prose, so it is no longer stranded and no longer a defect.
    const prov = {
      'aic:x': [
        { name: 'Paris', lat: 48.85, lng: 2.35, startDate: '1900', endDate: '1902' },
        { name: 'Lake Forest', institution: 'Wood', lat: 42.26, lng: -87.84, startDate: null, endDate: '1984' },
        { name: 'Chicago', institution: 'AIC', lat: 41.88, lng: -87.63, startDate: '1985', endDate: null },
        { name: 'Chicago', institution: 'Undated heir', lat: 41.88, lng: -87.63, startDate: null, endDate: null },
      ],
    }
    expect(scanDataQuality(prov).find((x: any) => x.id === 'data-quality-undatable-chain')).toBeUndefined()
  })

  it('stays silent on a clean chain', () => {
    const prov = {
      'aic:3': [
        { name: 'Paris', lat: 48.85, lng: 2.35, startDate: '1900' },
        { name: 'Chicago', lat: 41.88, lng: -87.63, startDate: '1910' },
      ],
    }
    expect(scanDataQuality(prov)).toEqual([])
  })
})

describe('honesty-regression sentinel — findOverclaims', () => {
  it('catches real-time / speculative phrasings in rendered copy', () => {
    const hits = findOverclaims([
      'currently on display at the gallery', // honesty-ok (test fixture)
      'a work probably owned by a private collector', // honesty-ok (test fixture)
    ].join('\n'))
    expect(hits.length).toBeGreaterThanOrEqual(2)
    expect(hits.some((h: any) => /real-time/i.test(h.rule))).toBe(true)
    expect(hits.some((h: any) => /speculative/i.test(h.rule))).toBe(true)
  })

  it('ignores comments and honesty-ok escape hatches', () => {
    const hits = findOverclaims([
      '// this explains why we never make a real-time display claim', // honesty-ok
      'const x = someValue // honesty-ok: documented exception',
    ].join('\n'))
    expect(hits).toEqual([])
  })

  it('stays silent on honest copy', () => {
    expect(findOverclaims('Held by the Art Institute of Chicago as of 1933 (source: AIC).')).toEqual([])
  })
})
