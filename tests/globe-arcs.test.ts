import { describe, it, expect } from 'vitest'
import {
  arcStyleForConfidence,
  buildArcs,
  buildGapArcs,
  countUnresolvedGaps,
} from '../src/components/provenance/globe-data'
import type { LocationEntry, GapEntry } from '../src/lib/types'

const loc = (over: Partial<LocationEntry>): LocationEntry => ({
  name: 'Somewhere', lat: 0, lng: 0, startDate: null, endDate: null, source: 'test', ...over,
})

describe('arcStyleForConfidence', () => {
  it('high confidence matches the pre-#124 tight/solid dash (unstyled default)', () => {
    expect(arcStyleForConfidence('high', 0.18)).toEqual({ stroke: 0.6, dashGap: 0.015, opacity: 1 })
  })

  it('undefined confidence renders identically to high — absence is never invented as low', () => {
    expect(arcStyleForConfidence(undefined, 0.18)).toEqual(arcStyleForConfidence('high', 0.18))
  })

  it('medium confidence widens the dash gap and softens opacity, same hue', () => {
    const style = arcStyleForConfidence('medium', 0.18)
    const base = arcStyleForConfidence('high', 0.18)
    expect(style.dashGap).toBeGreaterThan(base.dashGap)
    expect(style.stroke).toBeLessThan(base.stroke)
    expect(style.opacity).toBeLessThan(1)
  })

  it('low confidence is sparser and fainter than medium', () => {
    const medium = arcStyleForConfidence('medium', 0.18)
    const low = arcStyleForConfidence('low', 0.18)
    expect(low.dashGap).toBeGreaterThan(medium.dashGap)
    expect(low.stroke).toBeLessThan(medium.stroke)
    expect(low.opacity).toBeLessThan(medium.opacity)
  })
})

describe('buildArcs confidence → arc-style mapping', () => {
  it('a high-confidence link keeps the plain hex color (no alpha) — pixel-identical to before', () => {
    const arcs = buildArcs([loc({ name: 'A', lat: 1, lng: 1, confidence: 'high' }), loc({ name: 'B', lat: 2, lng: 2, confidence: 'high' })], '#d4a853', 0.18)
    expect(arcs).toHaveLength(1)
    expect(arcs[0].color).toBe('#d4a853')
    expect(arcs[0].dashAnimateTime).toBe(10000)
  })

  it('a low-confidence link bakes reduced alpha into the same hue', () => {
    const arcs = buildArcs([loc({ name: 'A', lat: 1, lng: 1, confidence: 'low' }), loc({ name: 'B', lat: 2, lng: 2, confidence: 'low' })], '#d4a853', 0.18)
    expect(arcs[0].color).toBe('rgba(212,168,83,0.5)')
  })

  it('the weaker of the two endpoints wins, but an undefined endpoint never degrades the link', () => {
    const arcs = buildArcs([loc({ name: 'A', lat: 1, lng: 1, confidence: undefined }), loc({ name: 'B', lat: 2, lng: 2, confidence: 'medium' })], '#d4a853', 0.18)
    expect(arcs[0].color).toBe(buildArcs([loc({ name: 'A', lat: 1, lng: 1, confidence: 'medium' }), loc({ name: 'B', lat: 2, lng: 2, confidence: 'medium' })], '#d4a853', 0.18)[0].color)
  })
})

describe('buildGapArcs — honesty: never a synthetic endpoint', () => {
  const locations = [
    loc({ name: 'Paris', lat: 48.85, lng: 2.35 }),
    loc({ name: 'New York', lat: 40.71, lng: -74.0 }),
  ]

  it('a null-coordinate GapEntry produces no arc', () => {
    const gaps: GapEntry[] = [{ from: null, to: null, note: 'no chain found' }]
    expect(buildGapArcs(locations, gaps, '#9a8f85')).toEqual([])
  })

  it('a resolvable gap between two real-coordinate neighbors renders as a broken, un-animated arc', () => {
    const gaps: GapEntry[] = [{ from: 'Paris', to: 'New York', note: 'undocumented span' }]
    const arcs = buildGapArcs(locations, gaps, '#9a8f85')
    expect(arcs).toHaveLength(1)
    expect(arcs[0]).toMatchObject({ startLat: 48.85, startLng: 2.35, endLat: 40.71, endLng: -74.0, color: '#9a8f85', dashAnimateTime: 0 })
  })

  it('a gap naming a location with no coordinates is not drawn', () => {
    const gaps: GapEntry[] = [{ from: 'Paris', to: 'Unknown City', note: 'undocumented span' }]
    expect(buildGapArcs(locations, gaps, '#9a8f85')).toEqual([])
  })
})

describe('countUnresolvedGaps', () => {
  it('counts only gaps with no resolvable coordinates', () => {
    const gaps: GapEntry[] = [
      { from: null, to: null, note: 'a' },
      { from: 'Paris', to: 'New York', note: 'b' },
      { from: null, to: 'New York', note: 'c' },
    ]
    expect(countUnresolvedGaps(gaps)).toBe(2)
  })

  it('is zero for an empty gaps array', () => {
    expect(countUnresolvedGaps([])).toBe(0)
  })
})
