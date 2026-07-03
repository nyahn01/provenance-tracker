import { describe, it, expect } from 'vitest'
import { buildChainLayout, buildChainScale } from '../src/components/provenance/chain-timeline'
import type { LocationEntry, ExhibitionLoan, GapEntry } from '../src/lib/types'

const loc = (name: string, institution: string, startDate: string | null, endDate: string | null): LocationEntry =>
  ({ name, institution, lat: null, lng: null, startDate, endDate, source: 'AIC provenance' })

const loan = (name: string, startDate: string | null, endDate: string | null): ExhibitionLoan =>
  ({ name, lat: null, lng: null, startDate, endDate, source: 'AIC exhibition history' })

describe('buildChainLayout — lane classification (#130)', () => {
  it('puts locations on the custody spine and exhibitions on the loan lane, never mixed', () => {
    const locations = [
      loc('Chicago', 'Palmer Family', '1902', null),
      loc('Chicago', 'The Art Institute of Chicago', '1985', null),
    ]
    const exhibitions = [loan('Paris', '1930', '1931')]
    const layout = buildChainLayout(locations, exhibitions, [], [])

    expect(layout.custody.map(n => n.who)).toEqual(['Palmer Family', 'The Art Institute of Chicago'])
    expect(layout.custody.every(n => n.lane === 'custody')).toBe(true)
    expect(layout.loans.map(n => n.who)).toEqual(['Paris'])
    expect(layout.loans[0].lane).toBe('loan')
    // A loan is never counted as a custody node — it must not advance the spine.
    expect(layout.custody.some(n => n.who === 'Paris')).toBe(false)
  })

  it('anchors a loan to the custody node that held the work when the loan occurred', () => {
    const locations = [
      loc('Chicago', 'Palmer Family', '1902', null),
      loc('Chicago', 'The Art Institute of Chicago', '1985', null),
    ]
    const exhibitions = [loan('Paris', '1930', '1931')]
    const layout = buildChainLayout(locations, exhibitions, [], [])
    // 1930 falls after the 1902 custody entry and before the 1985 one.
    expect(layout.loans[0].anchorIndex).toBe(0)
  })

  it('folds a documented sale into the custody owner it created — no duplicate card (dedup)', () => {
    // Custody owner "Knoedler & Co." (1910) + a Getty sale to the same owner, same year:
    // the sale must annotate that custody entry, not appear as a second entry.
    const locations = [loc('New York', 'Knoedler & Co.', '1910', null)]
    const layout = buildChainLayout(locations, [], [
      {
        piRecordNo: null, artist: null, title: null, entryDate: null, saleDate: '1910',
        seller: 'Durand-Ruel', sellerLocation: null, buyer: 'Knoedler & Co.', buyerLocation: 'New York',
        purchasePrice: '$18,000', salePrice: null, transaction: null, notes: null,
        sourceUrl: 'https://gpi.example/1', sourceLabel: 'Getty GPI',
      },
    ], [])
    expect(layout.unmatchedSales).toHaveLength(0)
    expect(layout.custody).toHaveLength(1)
    expect(layout.custody[0].sales).toHaveLength(1)
    expect(layout.custody[0].sales![0].price).toBe('$18,000')
    expect(layout.custody[0].sales![0].via).toContain('Knoedler')
  })

  it('keeps a sale with no matching custody owner as an honest unmatched entry (never dropped)', () => {
    const locations = [loc('Chicago', 'Palmer Family', '1902', null)]
    const layout = buildChainLayout(locations, [], [
      {
        piRecordNo: null, artist: null, title: null, entryDate: null, saleDate: '1907',
        seller: 'Monet', sellerLocation: null, buyer: 'Durand-Ruel', buyerLocation: 'Paris',
        purchasePrice: '$500', salePrice: null, transaction: null, notes: null,
        sourceUrl: null, sourceLabel: 'Getty GPI',
      },
    ], [])
    expect(layout.unmatchedSales).toHaveLength(1)
    expect(layout.unmatchedSales[0].who).toBe('Durand-Ruel')
    // It did not get folded into the unrelated custody owner.
    expect(layout.custody[0].sales).toBeUndefined()
  })
})

describe('buildChainLayout — gap placement never fabricates a date (#130)', () => {
  it('places a fully-dated gap after the custody node preceding it', () => {
    const locations = [
      loc('Chicago', 'Palmer Family', '1902', '1910'),
      loc('Chicago', 'The Art Institute of Chicago', '1985', null),
    ]
    const gaps: GapEntry[] = [{ from: '1912', to: '1919', note: 'No documented owner, 1912–1919.' }]
    const layout = buildChainLayout(locations, [], [], gaps)
    expect(layout.gaps[0].afterIndex).toBe(0)
    expect(layout.gaps[0].openStart).toBe(false)
    expect(layout.gaps[0].openEnd).toBe(false)
  })

  it('marks a null `from` as openStart without inventing a start year', () => {
    const locations = [loc('Chicago', 'The Art Institute of Chicago', '1985', null)]
    const gaps: GapEntry[] = [{ from: null, to: '1985', note: 'Ownership before 1985 is undocumented.' }]
    const layout = buildChainLayout(locations, [], [], gaps)
    expect(layout.gaps[0].openStart).toBe(true)
    // No dated event precedes an unknown-origin gap — it sits before every custody node.
    expect(layout.gaps[0].afterIndex).toBe(-1)
  })

  it('marks a null `to` as openEnd without inventing an end year', () => {
    const locations = [loc('Chicago', 'Palmer Family', '1902', null)]
    const gaps: GapEntry[] = [{ from: '1910', to: null, note: 'No further ownership records after 1910.' }]
    const layout = buildChainLayout(locations, [], [], gaps)
    expect(layout.gaps[0].openEnd).toBe(true)
    expect(layout.gaps[0].afterIndex).toBe(0)
  })
})

describe('buildChainScale — to-scale time axis (ADR 0006, spec §4.1/§4.3)', () => {
  it('spaces events in proportion to the years between them (monotonic)', () => {
    const locations = [
      loc('A', 'A', '1900', null), // 2-year hand-off to B …
      loc('B', 'B', '1902', null), // … then a 60-year hold to C
      loc('C', 'C', '1962', null),
    ]
    const { custody, gaps } = buildChainLayout(locations, [], [], [])
    const { spacerPx, intervalYears } = buildChainScale(custody, gaps)
    expect(intervalYears[0]).toBe(2)
    expect(intervalYears[1]).toBe(60)
    // The long interval leaves visibly more empty space than the short one.
    expect(spacerPx[1]).toBeGreaterThan(spacerPx[0])
    // Last node has no "next" — no trailing space.
    expect(spacerPx[2]).toBe(0)
  })

  it('floors a tiny interval and caps a huge one (to scale, softly bounded)', () => {
    const locations = [
      loc('A', 'A', '1900', null), // 1-year interval → floored, never a hairline
      loc('B', 'B', '1901', null), // 400-year interval → capped, never off-screen
      loc('C', 'C', '2301', null),
    ]
    const { custody, gaps } = buildChainLayout(locations, [], [], [])
    const { spacerPx } = buildChainScale(custody, gaps)
    expect(spacerPx[0]).toBeGreaterThanOrEqual(16) // MIN_STEP floor
    expect(spacerPx[1]).toBeLessThanOrEqual(200)   // MAX_STEP ceiling
    expect(spacerPx[1]).toBeGreaterThan(spacerPx[0])
  })

  it('draws a documented gap to its measured span — a longer silence is taller', () => {
    const locations = [
      loc('A', 'A', '1900', '1910'),
      loc('B', 'B', '1985', null),
    ]
    const shortGap: GapEntry[] = [{ from: '1910', to: '1915', note: '5-year gap.' }]
    const longGap: GapEntry[] = [{ from: '1910', to: '1960', note: '50-year gap.' }]
    const short = buildChainLayout(locations, [], [], shortGap)
    const long = buildChainLayout(locations, [], [], longGap)
    const hShort = buildChainScale(short.custody, short.gaps).gapHeightPx.get(short.gaps[0])!
    const hLong = buildChainScale(long.custody, long.gaps).gapHeightPx.get(long.gaps[0])!
    expect(hShort).toBeGreaterThanOrEqual(56) // GAP_MIN — always substantial
    expect(hLong).toBeGreaterThan(hShort)     // drawn to scale
    // A node followed by a gap stays tight — the gap carries the span, not double-counted.
    const { spacerPx } = buildChainScale(long.custody, long.gaps)
    expect(spacerPx[0]).toBeLessThan(hLong)
  })

  it('never invents a date: an open-ended gap gets a fixed dignified height', () => {
    const locations = [loc('A', 'A', '1902', null)]
    const gaps: GapEntry[] = [{ from: '1910', to: null, note: 'No records after 1910.' }]
    const { custody, gaps: chainGaps } = buildChainLayout(locations, [], [], gaps)
    const h = buildChainScale(custody, chainGaps).gapHeightPx.get(chainGaps[0])!
    expect(h).toBeGreaterThanOrEqual(56)
  })

  it('collapses to a uniform rhythm for a single dated event (no NaN, no crash)', () => {
    const { custody, gaps } = buildChainLayout([loc('A', 'A', '1902', null)], [], [], [])
    const { spacerPx, intervalYears } = buildChainScale(custody, gaps)
    expect(spacerPx).toEqual([0])          // one node → nothing after it
    expect(intervalYears).toEqual([null])  // no "next" → no interval
  })
})
