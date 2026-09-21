import { describe, it, expect } from 'vitest'
import { inflationAdjustUsd } from '../src/lib/prices'
import { usdMedianByYear, arbitragePairs } from '../src/lib/insights'
import { CPI_ANNUAL_INDEX, CPI_ESTIMATE_CUTOFF_YEAR, CPI_PRESENT_YEAR } from '../src/lib/cpi-data'

describe('inflationAdjustUsd — additive, USD-only reading (#241)', () => {
  it('scales by the CPI ratio between the two years', () => {
    const adj = inflationAdjustUsd(100, 1970)!
    const expected = 100 * (CPI_ANNUAL_INDEX[CPI_PRESENT_YEAR] / CPI_ANNUAL_INDEX[1970])
    expect(adj.adjustedAmount).toBeCloseTo(expected, 6)
    expect(adj.fromYear).toBe(1970)
    expect(adj.toYear).toBe(CPI_PRESENT_YEAR)
  })

  it('flags years before the official-CPI cutoff as estimates', () => {
    expect(inflationAdjustUsd(100, 1895)!.estimated).toBe(true)
    expect(inflationAdjustUsd(100, CPI_ESTIMATE_CUTOFF_YEAR)!.estimated).toBe(false)
  })

  it('returns null for a year outside the series rather than guessing', () => {
    expect(inflationAdjustUsd(100, 1871)).toBeNull()
    expect(inflationAdjustUsd(100, 2999)).toBeNull()
  })

  it('a later, more inflated year adjusts up; an already-present year is unchanged', () => {
    expect(inflationAdjustUsd(100, 1913)!.adjustedAmount).toBeGreaterThan(100)
    expect(inflationAdjustUsd(100, CPI_PRESENT_YEAR)!.adjustedAmount).toBeCloseTo(100, 6)
  })
})

describe('usdMedianByYear — inflation reading rides along per year', () => {
  const { stats } = usdMedianByYear(5)

  it('every stat in the Knoedler range (1872–1970) gets an adjustment', () => {
    expect(stats.length).toBeGreaterThan(0)
    for (const s of stats) {
      expect(s.inflationAdjusted).not.toBeNull()
      expect(s.inflationAdjusted!.fromYear).toBe(s.year)
      expect(s.inflationAdjusted!.adjustedAmount).toBeGreaterThan(0)
    }
  })

  it('never converts currency — the adjustment is still a dollar figure', () => {
    for (const s of stats) {
      expect(Object.keys(s)).not.toContain('eurEquivalent')
      expect(Object.keys(s)).not.toContain('gbpEquivalent')
    }
  })
})

describe('arbitragePairs — the dollar side adjusts, the franc side never does', () => {
  const { pairs } = arbitragePairs()

  it('every pair with a resolvable year gets a saleAdjusted reading', () => {
    for (const p of pairs) {
      if (p.year !== null) expect(p.saleAdjusted).not.toBeNull()
    }
  })

  it('saleAdjusted always restates the USD sale, never the franc purchase', () => {
    for (const p of pairs) {
      if (p.saleAdjusted) expect(p.saleAdjusted.fromYear).toBe(p.year)
    }
    // No field on the type adjusts the franc-denominated purchase.
    for (const p of pairs) expect(Object.keys(p)).not.toContain('purchaseAdjusted')
  })
})
