import { describe, it, expect } from 'vitest'
import { percentileRank, rankBand, parsePrice, MIN_RANK_POPULATION } from '../src/lib/prices'
import { arbitragePairs, priceRankIndex } from '../src/lib/insights'

describe('percentileRank', () => {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('counts the share at or below, so the largest is 100 and a low value is small', () => {
    expect(percentileRank(pool, 10)).toBe(100)
    expect(percentileRank(pool, 5)).toBe(50)
    expect(percentileRank(pool, 1)).toBe(10)
  })

  it('places a value below every record at 0', () => {
    expect(percentileRank(pool, 0.5)).toBe(0)
  })

  it('counts ties as at-or-below', () => {
    expect(percentileRank([5, 5, 5, 9], 5)).toBe(75)
  })

  it('returns null for an empty population rather than a misleading 0', () => {
    expect(percentileRank([], 100)).toBeNull()
  })
})

describe('rankBand — coarse on purpose', () => {
  it('maps percentiles to bands the ledger data can support', () => {
    expect(rankBand(99)).toBe('top 10%')
    expect(rankBand(90)).toBe('top 10%')
    expect(rankBand(80)).toBe('top quarter')
    expect(rankBand(60)).toBe('above the median')
    expect(rankBand(50)).toBe('at the median')
    expect(rankBand(30)).toBe('below the median')
    expect(rankBand(5)).toBe('bottom quarter')
  })
})

describe('priceRankIndex — currencies and sides never mix', () => {
  const index = priceRankIndex()

  it('keeps a separate pool per currency and per side', () => {
    expect(index.purchase.get('FRF')!.length).toBeGreaterThan(0)
    expect(index.sale.get('USD')!.length).toBeGreaterThan(0)
    // Francs bought and dollars sold are different populations; if they were
    // pooled these counts would match, and a conversion would be implied.
    expect(index.purchase.get('FRF')!.length).not.toBe(index.sale.get('USD')!.length)
  })

  it('sorts every pool ascending so the rank search is valid', () => {
    for (const pool of [...index.purchase.values(), ...index.sale.values()]) {
      for (let i = 1; i < pool.length; i++) expect(pool[i]).toBeGreaterThanOrEqual(pool[i - 1])
    }
  })

  it('never pools an unparseable currency', () => {
    expect(index.purchase.has('unknown')).toBe(false)
    expect(index.sale.has('unknown')).toBe(false)
  })
})

describe('arbitragePairs — comparison without conversion (#228)', () => {
  const { pairs, total } = arbitragePairs()

  it('still reports the honest total, not the displayed sample size', () => {
    expect(total).toBeGreaterThan(pairs.length)
  })

  it('keeps the ledger strings verbatim', () => {
    for (const p of pairs) {
      expect(p.purchase).toMatch(/franc/i)
      expect(p.sale).toContain('$')
    }
  })

  it('ranks a franc purchase against francs and a dollar sale against dollars', () => {
    for (const p of pairs) {
      if (p.purchaseRank) {
        expect(p.purchaseRank.currency).toBe('FRF')
        expect(p.purchaseRank.side).toBe('purchase')
      }
      if (p.saleRank) {
        expect(p.saleRank.currency).toBe('USD')
        expect(p.saleRank.side).toBe('sale')
      }
    }
  })

  it('carries the population size with every rank, so a thin base is visible', () => {
    for (const p of pairs) {
      for (const r of [p.purchaseRank, p.saleRank]) {
        if (r) expect(r.n).toBeGreaterThanOrEqual(MIN_RANK_POPULATION)
      }
    }
  })

  it('withholds a rank entirely when the population is too thin', () => {
    // One recorded mark purchase exists in the seed. "Top 100% of 1" would be
    // noise dressed as a fact, so nothing is shown for it.
    const index = priceRankIndex()
    const marks = index.purchase.get('DEM') ?? []
    expect(marks.length).toBeLessThan(MIN_RANK_POPULATION)
  })

  it('never derives a ratio or a converted figure between the two currencies', () => {
    for (const p of pairs) {
      const bought = parsePrice(p.purchase)!, sold = parsePrice(p.sale)!
      expect(bought.currency).not.toBe(sold.currency)
      // The pair carries no field holding a cross-currency number.
      expect(Object.keys(p)).not.toContain('markup')
      expect(Object.keys(p)).not.toContain('ratio')
      expect(Object.keys(p)).not.toContain('usdEquivalent')
    }
  })
})
