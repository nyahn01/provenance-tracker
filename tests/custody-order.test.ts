import { describe, it, expect } from 'vitest'
import { sourceOrderedSortKeys, buildUnifiedTimeline } from '../src/components/provenance/timeline'
import featured from '../src/lib/featured-provenance.json'
import type { LocationEntry } from '../src/lib/types'

describe('sourceOrderedSortKeys — undated entries keep their source position', () => {
  it('places an undated entry between its dated neighbours', () => {
    // Source order: 1900, ?, 1910 → the middle one belongs between them.
    const keys = sourceOrderedSortKeys([1900, null, 1910])
    expect(keys[0]).toBe(1900)
    expect(keys[2]).toBe(1910)
    expect(keys[1]).toBeGreaterThan(1900)
    expect(keys[1]).toBeLessThan(1910)
  })

  it('keeps a run of undated entries in source order', () => {
    const keys = sourceOrderedSortKeys([1900, null, null, null, 1910])
    expect(keys[1]).toBeLessThan(keys[2])
    expect(keys[2]).toBeLessThan(keys[3])
    expect(keys[3]).toBeLessThan(1910)
  })

  it('sorts a LEADING undated entry before the first known year, not to the end', () => {
    // The regression: this used to bucket to 9999 and dangle last.
    const keys = sourceOrderedSortKeys([null, 1766, 1767])
    expect(keys[0]).toBeLessThan(1766)
  })

  it('sorts a TRAILING undated entry just after the last known year', () => {
    const keys = sourceOrderedSortKeys([1900, 1910, null])
    expect(keys[2]).toBeGreaterThan(1910)
    // Just after, not a millennium after.
    expect(keys[2]).toBeLessThan(1911)
  })

  it('preserves source order when nothing is dated at all', () => {
    expect(sourceOrderedSortKeys([null, null, null])).toEqual([0, 1, 2])
  })

  it('never reorders entries that are all dated', () => {
    expect(sourceOrderedSortKeys([1900, 1910, 1920])).toEqual([1900, 1910, 1920])
  })

  it('invents no year — an undated entry is never given a whole-year key it could be mistaken for', () => {
    const keys = sourceOrderedSortKeys([1911, null, 1912])
    expect(Number.isInteger(keys[1])).toBe(false)
  })
})

describe('custody ordering — the aic:95998 regression', () => {
  // Rembrandt, Old Man with a Gold Chain. Twelve holders, three of them undated.
  // The source lists Jacob Alewijn 1st, Lippmann 6th and Reinhardt 10th; date-only
  // sorting put all three AFTER the 1921 Art Institute acquisition.
  const locations = (featured as Record<string, LocationEntry[]>)['aic:95998']

  it('is a real chain with undated holders (guards the fixture)', () => {
    expect(locations.length).toBeGreaterThan(10)
    expect(locations.filter(l => !l.startDate && !l.endDate).length).toBe(3)
  })

  it('no longer strands undated holders after the museum acquisition', () => {
    const events = buildUnifiedTimeline(locations, [], [], null, null)
    const order = events.map(e => e.who)
    const aic = order.findIndex(w => w.includes('Art Institute'))

    expect(aic).toBe(order.length - 1) // the museum is the final holder
    for (const who of ['Jacob Alewijn', 'Lippmann', 'Reinhardt']) {
      expect(order.indexOf(who)).toBeLessThan(aic)
    }
  })

  it('restores the source sequence: Alewijn first, Reinhardt between Nemes and Kimball', () => {
    const order = buildUnifiedTimeline(locations, [], [], null, null).map(e => e.who)
    expect(order[0]).toBe('Jacob Alewijn')
    expect(order.indexOf('Reinhardt')).toBeGreaterThan(order.indexOf('Marczell de Nemes'))
    expect(order.indexOf('Reinhardt')).toBeLessThan(order.indexOf('Mrs. W. W. Kimball'))
    // Lippmann sits between Shepherd (1911) and P. and D. Colnaghi (1912).
    expect(order.indexOf('Lippmann')).toBeGreaterThan(order.indexOf('Shepherd'))
    expect(order.indexOf('Lippmann')).toBeLessThan(order.indexOf('P. and D. Colnaghi'))
  })

  it('still shows "?" for an undated holder — ordering is not a date claim', () => {
    const events = buildUnifiedTimeline(locations, [], [], null, null)
    for (const who of ['Jacob Alewijn', 'Lippmann', 'Reinhardt']) {
      expect(events.find(e => e.who === who)!.year).toBe('?')
    }
  })
})
