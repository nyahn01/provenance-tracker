import { describe, it, expect } from 'vitest'
import {
  extractProvenanceLoans,
  extractExhibitionHistoryLoans,
  mergeLoans,
} from '../src/lib/exhibition-loans'

const SRC = 'AIC provenance prose'

describe('extractProvenanceLoans', () => {
  it('extracts an "on loan to" clause with city, dates, marker and source', () => {
    const prose = 'The artist, Paris; on loan to the Louvre, Paris, 1992–1995; private collection.'
    const loans = extractProvenanceLoans(prose, SRC)
    expect(loans).toHaveLength(1)
    expect(loans[0]).toMatchObject({
      name: 'Paris',
      startDate: '1992',
      endDate: '1995',
      loanMarker: 'on loan',
      source: SRC,
    })
    // Evidence excerpt is kept verbatim from the prose.
    expect(prose).toContain(loans[0].excerpt!.replace(/…$/, '').trim().split(',')[0])
  })

  it('recognises "loaned to" and "borrowed by" markers', () => {
    expect(extractProvenanceLoans('Loaned to the Met, New York, 1980.', SRC)[0]?.loanMarker).toBe('loaned')
    expect(extractProvenanceLoans('Borrowed by the Tate, London, 2001.', SRC)[0]?.loanMarker).toBe('borrowed')
  })

  it('returns nothing for custody-only prose — a loan is never inferred from ownership (honesty rule)', () => {
    const custodyOnly = 'Durand-Ruel, Paris, 1909; Martin A. Ryerson, Chicago, 1914; Art Institute of Chicago, 1933.'
    expect(extractProvenanceLoans(custodyOnly, SRC)).toEqual([])
  })

  it('rejects stray years that predate the artwork creation year', () => {
    // "1850" predates a 1906 work — it must not become a loan year.
    const loans = extractProvenanceLoans('On loan to the Louvre, Paris, catalogue no. 1850.', SRC, 1906)
    expect(loans[0]?.startDate ?? null).toBeNull()
  })

  it('every extracted loan carries a non-empty source (honesty rule)', () => {
    const loans = extractProvenanceLoans('On loan to the Prado, Madrid, 1990–1991.', SRC)
    expect(loans.length).toBeGreaterThan(0)
    expect(loans.every(l => typeof l.source === 'string' && l.source.length > 0)).toBe(true)
  })
})

describe('extractExhibitionHistoryLoans', () => {
  it('reads a dedicated exhibition field with no marker keyword', () => {
    const loans = extractExhibitionHistoryLoans('Art Institute of Chicago, 1995–1996; Grand Palais, Paris, 2010.', 'AIC exhibition history')
    expect(loans.length).toBeGreaterThanOrEqual(2)
    expect(loans.every(l => l.loanMarker === null)).toBe(true)
    expect(loans.every(l => l.lat === 0 && l.lng === 0)).toBe(false) // no null-island
  })
})

describe('mergeLoans', () => {
  it('dedups by name+dates, preferring the exhibition-history entry', () => {
    const exhibition = extractExhibitionHistoryLoans('Louvre, Paris, 1992–1995.', 'AIC exhibition history')
    const prov = extractProvenanceLoans('On loan to the Louvre, Paris, 1992–1995.', SRC)
    const merged = mergeLoans(exhibition, prov)
    expect(merged).toHaveLength(1)
    expect(merged[0].loanMarker).toBeNull() // exhibition-history wins
  })
})
