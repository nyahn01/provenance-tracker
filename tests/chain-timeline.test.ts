import { describe, it, expect } from 'vitest'
import { buildChainLayout } from '../src/components/provenance/chain-timeline'
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

  it('puts Getty records on the dealer lane', () => {
    const locations = [loc('Chicago', 'Palmer Family', '1902', null)]
    const layout = buildChainLayout(locations, [], [
      {
        piRecordNo: null, artist: null, title: null, entryDate: null, saleDate: '1920',
        seller: 'Knoedler', sellerLocation: null, buyer: 'Palmer Family', buyerLocation: null,
        purchasePrice: '$500', salePrice: null, transaction: null, notes: null,
        sourceUrl: null, sourceLabel: 'Getty GPI',
      },
    ], [])
    expect(layout.dealers).toHaveLength(1)
    expect(layout.dealers[0].lane).toBe('dealer')
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
