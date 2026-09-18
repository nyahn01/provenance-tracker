import { describe, it, expect } from 'vitest'
import {
  escapeHtml, nodeTooltip, arcTooltip, landmassTooltip, buildPoints, buildArcs,
} from '../src/components/provenance/globe-data'
import type { LocationEntry, ExhibitionLoan, GettyRecord } from '../src/lib/types'

const loc = (
  name: string, institution: string, startDate: string | null, endDate: string | null,
  lat: number | null = 48.85, lng: number | null = 2.35,
): LocationEntry => ({ name, institution, lat, lng, startDate, endDate, source: 'AIC provenance' })

const loan = (name: string, startDate: string | null, endDate: string | null): ExhibitionLoan =>
  ({ name, lat: 40.71, lng: -74.006, startDate, endDate, source: 'AIC exhibition history' })

describe('escapeHtml — museum prose is data, never markup', () => {
  it('escapes every character that could open a tag or attribute', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).not.toContain('<')
    expect(escapeHtml(`Durand-Ruel & Cie "Paris"`)).toBe('Durand-Ruel &amp; Cie &quot;Paris&quot;')
    expect(escapeHtml("O'Keeffe")).toBe('O&#39;Keeffe')
  })
})

describe('nodeTooltip — honesty invariants', () => {
  it('names the documenting institution, never an unsourced claim', () => {
    const tip = nodeTooltip({ who: 'Durand-Ruel', place: 'Paris', kind: 'custody', startDate: '1906', endDate: '1909', source: 'AIC provenance' })
    expect(tip).toContain('Art Institute of Chicago')
  })

  it('labels a loan as a loan so hovering can never read it as a change of owner', () => {
    const tip = nodeTooltip({ who: 'Grand Palais', place: 'Paris', kind: 'loan', startDate: '1930', endDate: '1931', source: 'AIC exhibition history' })
    expect(tip).toMatch(/not a change of owner/i)
    expect(tip).not.toMatch(/^.*\bOwnership\b/)
  })

  it('shows no span at all for an undated holder rather than a guessed one', () => {
    const tip = nodeTooltip({ who: 'Reinhardt', place: 'New York', kind: 'custody', startDate: null, endDate: null, source: 'AIC provenance' })
    expect(tip).toContain('New York')
    expect(tip).not.toMatch(/\d{4}/)
  })

  it('reports a one-sided date honestly', () => {
    expect(nodeTooltip({ who: 'Boulton', place: 'Oxfordshire', kind: 'custody', startDate: null, endDate: '1911', source: 'AIC provenance' })).toContain('until 1911')
    expect(nodeTooltip({ who: 'Ketelaar', place: 'Amsterdam', kind: 'custody', startDate: '1767', endDate: null, source: 'AIC provenance' })).toContain('from 1767')
  })

  it('escapes the holder name it was given', () => {
    expect(nodeTooltip({ who: '<script>x</script>', place: 'Paris', kind: 'custody', source: 'AIC provenance' })).not.toContain('<script>')
  })
})

describe('arcTooltip — the tier is never ambiguous', () => {
  it('distinguishes all four tiers', () => {
    expect(arcTooltip('Paris → Chicago', 'custody')).toMatch(/change of owner/i)
    expect(arcTooltip('Paris → New York', 'loan')).toMatch(/not a change of owner/i)
    expect(arcTooltip('London → New York', 'dealer')).toMatch(/Getty/i)
    expect(arcTooltip('Munich → Germany', 'gap')).toMatch(/no record/i)
  })
})

describe('landmassTooltip', () => {
  it('names the landmass from the geo feature', () => {
    expect(landmassTooltip('British Isles')).toContain('British Isles')
  })
  it('returns nothing for a feature with no usable name, rather than an empty card', () => {
    expect(landmassTooltip(undefined)).toBe('')
    expect(landmassTooltip('   ')).toBe('')
    expect(landmassTooltip(42)).toBe('')
  })
})

describe('buildPoints', () => {
  const locations = [loc('Paris', 'Durand-Ruel', '1906', '1909'), loc('Chicago', 'The Art Institute of Chicago', '1933', null, 41.88, -87.63)]
  const loans = [loan('New York', '1930', '1931')]
  const getty: GettyRecord[] = [
    { sellerLocation: 'London, England', buyerLocation: 'New York, NY', saleDate: '1912' } as GettyRecord,
    { sellerLocation: 'London', buyerLocation: 'Paris', saleDate: '1913' } as GettyRecord,
  ]

  it('gives every dot a tooltip', () => {
    for (const pt of buildPoints(locations, loans, getty)) expect(pt.tip.length).toBeGreaterThan(0)
  })

  it('keeps the three tiers distinct', () => {
    const pts = buildPoints(locations, loans, getty)
    expect(pts.filter(p => p.tier === 'custody')).toHaveLength(2)
    expect(pts.filter(p => p.tier === 'loan')).toHaveLength(1)
    expect(pts.filter(p => p.tier === 'dealer').length).toBeGreaterThan(0)
  })

  it('never emits a dot for a node with no coordinates', () => {
    const withNull = [...locations, loc('Germany', 'Private collection', '1933', '1955', null, null)]
    const pts = buildPoints(withNull, [], [])
    expect(pts).toHaveLength(2)
    expect(pts.every(p => p.lat != null && p.lng != null)).toBe(true)
  })

  it('deduplicates dealer cities by coordinate but never merges two owners in one city', () => {
    const pts = buildPoints([loc('Paris', 'Owner A', '1900', '1905'), loc('Paris', 'Owner B', '1905', '1910')], [], getty)
    expect(pts.filter(p => p.tier === 'custody')).toHaveLength(2) // two facts, two dots
    const dealerKeys = pts.filter(p => p.tier === 'dealer').map(p => `${p.lat},${p.lng}`)
    expect(new Set(dealerKeys).size).toBe(dealerKeys.length)
  })
})

describe('label/dot pairing at a shared coordinate', () => {
  // buildLabels shows the FIRST holder at a coordinate, so the label's tooltip has to
  // be that same holder. Pairing it with a later owner's card would caption a city
  // with the wrong person.
  it('pairs a repeated city with its first holder, not its last', () => {
    const pts = buildPoints(
      [loc('Paris', 'Durand-Ruel', '1900', '1905'), loc('Paris', 'Ambroise Vollard', '1905', '1910')],
      [], [],
    )
    const tipAt = new Map<string, string>()
    for (const pt of pts) {
      const key = `${pt.lat.toFixed(4)},${pt.lng.toFixed(4)}`
      if (!tipAt.has(key)) tipAt.set(key, pt.tip)
    }
    const paired = tipAt.get('48.8500,2.3500')!
    expect(paired).toContain('Durand-Ruel')
    expect(paired).not.toContain('Vollard')
  })
})

describe('buildArcs — arcs carry their tier for the tooltip', () => {
  it('defaults to custody and accepts loan', () => {
    const custody = buildArcs([loc('Paris', 'A', '1900', null), loc('Chicago', 'B', '1910', null, 41.88, -87.63)], '#d4a853', 0.18)
    expect(custody[0].kind).toBe('custody')
    const loans = buildArcs([loc('Paris', 'A', '1900', null), loc('Chicago', 'B', '1910', null, 41.88, -87.63)], '#6f8d7d', 0.30, 'loan')
    expect(loans[0].kind).toBe('loan')
  })
})
