import { describe, it, expect } from 'vitest'
import {
  detectConflicts,
  gatherGetty,
  deterministicExtract,
  chainGaps,
  sameName,
  applyArtistOriginFix,
  gettyYear,
} from '../scripts/curate.mjs'

const AIC = 'AIC provenance'

describe('detectConflicts (the ADR-0003 honesty rule)', () => {
  const chain = [{ name: 'Chicago', institution: 'Bertha Palmer', startDate: '1895', endDate: '1922', source: AIC }]

  it('surfaces a conflict when two sources date the same party differently', () => {
    const getty = [{ piRecordNo: 'K-1', buyer: 'Bertha Palmer', seller: 'Knoedler', saleDate: '1892-03-03', sourceLabel: 'Getty GPI — Knoedler' }]
    const conflicts = detectConflicts(chain, getty)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ holder: 'Bertha Palmer', aicYear: '1895', gettyYear: '1892' })
    // It records a gap, never a chosen "consensus" value.
    expect(conflicts[0].note).toMatch(/unresolved gap/i)
  })

  it('stays silent when the sources agree (±1 year)', () => {
    const agree = [{ piRecordNo: 'K-2', buyer: 'Bertha Palmer', saleDate: '1895-01-01', sourceLabel: 'Getty GPI' }]
    expect(detectConflicts(chain, agree)).toEqual([])
  })

  it('raises no conflict when no chain holder matches the Getty party', () => {
    const other = [{ piRecordNo: 'K-3', buyer: 'Someone Else', saleDate: '1850-01-01', sourceLabel: 'Getty GPI' }]
    expect(detectConflicts(chain, other)).toEqual([])
  })
})

describe('gatherGetty', () => {
  const records = [
    { artist: 'MONET, CLAUDE', title: 'Water Lilies', buyer: 'X' },
    { artist: 'MONET, CLAUDE', title: 'The poppy field', buyer: 'Y' },
    { artist: 'DEGAS, EDGAR', title: 'Dancers', buyer: 'Z' },
  ]

  it('splits same-title (conflict candidates) from artist-only (market context)', () => {
    const { sameWork, context } = gatherGetty(records, 'Claude Monet', 'Water Lilies')
    expect(sameWork.map(r => r.title)).toEqual(['Water Lilies'])
    expect(context.map(r => r.title)).toEqual(['The poppy field'])
  })

  it('an artist with no records yields empty buckets', () => {
    expect(gatherGetty(records, 'Pablo Picasso', 'Guernica')).toEqual({ sameWork: [], context: [] })
  })
})

describe('deterministicExtract', () => {
  const meta = {
    artist: 'Claude Monet',
    creationYear: 1906,
    prose: 'The artist, Paris, 1906; Durand-Ruel, Paris, 1909; Durand-Ruel, New York, 1911; Martin A. Ryerson, Chicago, 1914; The Art Institute of Chicago, 1933.',
  }

  it('mines a dated, ordered chain from AIC prose', () => {
    const chain = deterministicExtract(meta)
    expect(chain.map(e => e.name)).toEqual(['Paris', 'Paris', 'New York', 'Chicago', 'Chicago'])
    expect(chain[0].startDate).toBe('1906')
  })

  it('every entry carries source "AIC provenance" and no null-island coords (honesty rules)', () => {
    const chain = deterministicExtract(meta)
    expect(chain.every(e => e.source === AIC)).toBe(true)
    expect(chain.every(e => !(e.lat === 0 || e.lng === 0))).toBe(true)
  })

  it('returns [] for prose too short to mine', () => {
    expect(deterministicExtract({ artist: 'X', creationYear: null, prose: 'n/a' })).toEqual([])
  })
})

describe('applyArtistOriginFix', () => {
  it('dates an artist-held entry to the creation year when its startDate is missing', () => {
    const out = applyArtistOriginFix([{ name: 'Paris', institution: 'Claude Monet', startDate: null, source: AIC }], 'Claude Monet', 1906)
    expect(out[0].startDate).toBe('1906')
  })

  it('never invents a date when the creation year is unknown (honesty rule)', () => {
    const out = applyArtistOriginFix([{ name: 'Paris', institution: 'Claude Monet', startDate: null, source: AIC }], 'Claude Monet', null)
    expect(out[0].startDate).toBeNull()
  })

  it('leaves a non-artist holder untouched', () => {
    const out = applyArtistOriginFix([{ name: 'Paris', institution: 'Durand-Ruel', startDate: null, source: AIC }], 'Claude Monet', 1906)
    expect(out[0].startDate).toBeNull()
  })
})

describe('chainGaps', () => {
  it('reports an undocumented span between consecutive dated entries', () => {
    const gaps = chainGaps([
      { name: 'Paris', startDate: '1906', endDate: '1909', source: AIC },
      { name: 'Chicago', startDate: '1950', endDate: null, source: AIC },
    ])
    expect(gaps).toEqual([{ from: '1909', to: '1950', note: expect.stringContaining('1909') }])
  })

  it('reports no gap for a continuous chain', () => {
    const gaps = chainGaps([
      { name: 'Paris', startDate: '1906', endDate: '1909', source: AIC },
      { name: 'Chicago', startDate: '1909', endDate: null, source: AIC },
    ])
    expect(gaps).toEqual([])
  })
})

describe('helpers', () => {
  it('sameName matches loosely on case/punctuation but not on short tokens', () => {
    expect(sameName('Durand-Ruel', 'durand ruel')).toBe(true)
    expect(sameName('The Art Institute of Chicago', 'Art Institute of Chicago')).toBe(true)
    expect(sameName('A', 'B')).toBe(false)
  })

  it('gettyYear pulls a 4-digit year from saleDate then entryDate', () => {
    expect(gettyYear({ saleDate: '1892-03-03', entryDate: '1891-04-04' })).toBe('1892')
    expect(gettyYear({ saleDate: null, entryDate: '1891-04-04' })).toBe('1891')
    expect(gettyYear({ saleDate: null, entryDate: null })).toBeNull()
  })
})
