import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS sentinel module, no types
import { scanDataQuality } from '../scripts/sentinels/data-quality.mjs'
// @ts-expect-error — plain JS sentinel module, no types
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
    expect(nc.label).toBe('proposal')
    expect(nc.body).toContain('Galerie X')
    // The idempotency marker is added by the runner, not baked into the finding.
    expect(nc.body).not.toContain('<!-- sentinel:')
  })

  it('flags a trailing dateless custody entry', () => {
    const prov = {
      'aic:2': [
        { name: 'Paris', lat: 48.85, lng: 2.35, startDate: '1900' },
        { name: 'Chicago', institution: 'Unknown buyer', lat: 41.88, lng: -87.63, startDate: null },
      ],
    }
    const f = scanDataQuality(prov)
    const t = f.find((x: any) => x.id === 'data-quality-trailing-dateless-custody')
    expect(t).toBeTruthy()
    expect(t.body).toContain('Unknown buyer')
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
