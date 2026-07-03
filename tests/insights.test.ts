/**
 * Aggregation regression against the COMMITTED Getty seeds and featured chains.
 *
 * These asserts pin exact counts from the seed files on purpose: if the seeds
 * are ever re-run, these tests fail loudly so the numbers quoted on /insights
 * get re-verified rather than silently drifting — that is the honesty feature,
 * not brittleness. Update the constants only after re-checking the data.
 */
import { describe, it, expect } from 'vitest'
import {
  recordYear,
  marketActivityByYear,
  topArtistActivity,
  usdMedianByYear,
  arbitragePairs,
  dealerBipartite,
  pipelineFlows,
} from '../src/lib/insights'
import { allGettyRecords } from '../src/lib/getty'

describe('market activity', () => {
  it('counts match the committed seeds (4,388 records; 4,371 dated, 1859–1971)', () => {
    expect(allGettyRecords()).toHaveLength(4388)
    const { years, dated, undated } = marketActivityByYear()
    expect(dated).toBe(4371)
    expect(undated).toBe(17)
    expect(years[0].year).toBe(1859)
    expect(years[years.length - 1].year).toBe(1971)
    expect(years.reduce((s, y) => s + y.sold + y.unsold + y.other, 0)).toBe(dated)
  })

  it('top artists are the known GPI hubs (Corot first)', () => {
    const top = topArtistActivity(6)
    expect(top).toHaveLength(6)
    expect(top[0].artist).toMatch(/Corot/)
    expect(top[0].total).toBeGreaterThan(top[5].total)
  })
})

describe('USD prices (Knoedler only, currencies never mixed)', () => {
  it('1,724 Knoedler records carry a year + USD sale price', () => {
    const { totalUsdSales, stats } = usdMedianByYear(5)
    expect(totalUsdSales).toBe(1724)
    for (const s of stats) {
      expect(s.n).toBeGreaterThanOrEqual(5)
      expect(Number.isFinite(s.medianUsd)).toBe(true)
    }
    // chronological
    expect([...stats].sort((a, b) => a.year - b.year)).toEqual(stats)
  })

  it('266 francs-bought → dollars-sold arbitrage records, verbatim strings only', () => {
    const { pairs, total } = arbitragePairs()
    expect(total).toBe(266)
    expect(pairs.length).toBeLessThanOrEqual(8)
    for (const p of pairs) {
      expect(p.purchase).toMatch(/franc/i)
      expect(p.sale).toMatch(/\$/)
      expect(p.sourceLabel).toMatch(/Knoedler/)
    }
  })
})

describe('dealer bipartite (deterministic, ledger-true)', () => {
  it('is deterministic across runs and honors the link threshold', () => {
    const a = dealerBipartite(12, 3)
    const b = dealerBipartite(12, 3)
    expect(a).toEqual(b)
    expect(a.sellers).toHaveLength(12)
    expect(a.buyers).toHaveLength(12)
    for (const l of a.links) expect(l.count).toBeGreaterThanOrEqual(3)
    expect(a.totalSellers).toBeGreaterThan(800)
    expect(a.totalBuyers).toBeGreaterThan(1100)
  })

  it('the top buyer is Reid & Lefevre (38 recorded purchases)', () => {
    const { buyers } = dealerBipartite(12, 3)
    expect(buyers[0].name).toBe('Reid & Lefevre')
    expect(buyers[0].count).toBe(38)
  })
})

describe('featured-collection pipeline', () => {
  it('aggregates all 13 chains, 103 entries, with exclusions stated not hidden', () => {
    const p = pipelineFlows()
    expect(p.workCount).toBe(13)
    expect(p.totalEntries).toBe(103)
    expect(p.flows.length).toBeGreaterThan(0)
    for (const f of p.flows) {
      expect(f.fromName).not.toBe(f.toName)
      expect(f.fromLat).not.toBe(0)
      expect(f.toLng).not.toBe(0)
    }
    // The collection IS the Paris→Chicago pipeline: Paris is the recurring hub
    // (most custody entries), Chicago the shared destination (second).
    expect(p.cities[0].name).toBe('Paris')
    expect(p.cities[1].name).toBe('Chicago')
    expect(p.excludedCount).toBeGreaterThanOrEqual(0)
  })
})

describe('recordYear', () => {
  it('prefers saleDate, falls back to entryDate, nulls when undated', () => {
    expect(recordYear({ saleDate: '1892-03-03', entryDate: '1891-01-01' } as never)).toBe(1892)
    expect(recordYear({ saleDate: null, entryDate: '1891-01-01' } as never)).toBe(1891)
    expect(recordYear({ saleDate: null, entryDate: null } as never)).toBeNull()
  })
})
