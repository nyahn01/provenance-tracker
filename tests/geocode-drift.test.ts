/**
 * Gazetteer drift guard — the scripts-side table (scripts/lib/cities.mjs, used
 * by the curation pipeline) must stay a coordinate-identical subset of the
 * runtime table (src/lib/geocode.ts, used by the API routes). A city added to
 * one but not the other would silently geocode differently at curation time
 * vs runtime.
 */

import { describe, it, expect } from 'vitest'
import { CITIES as runtimeCities } from '../src/lib/geocode'
// @ts-ignore — plain .mjs module, no type declarations
import { CITIES as scriptCities, geocodeKey, titleCaseCity } from '../scripts/lib/cities.mjs'

describe('gazetteer drift (scripts/lib/cities.mjs vs src/lib/geocode.ts)', () => {
  it('every scripts-side city exists in the runtime table with identical coordinates', () => {
    for (const [key, pt] of Object.entries(scriptCities) as [string, { lat: number; lng: number }][]) {
      expect(runtimeCities[key], `"${key}" missing from src/lib/geocode.ts`).toBeDefined()
      expect(runtimeCities[key]).toEqual(pt)
    }
  })

  it('every runtime city exists in the scripts table (full parity, both directions)', () => {
    for (const key of Object.keys(runtimeCities)) {
      expect((scriptCities as Record<string, unknown>)[key], `"${key}" missing from scripts/lib/cities.mjs`).toBeDefined()
    }
  })

  it('geocodeKey resolves longest-match-first and returns null for unknowns', () => {
    expect(geocodeKey('23 Boulevard des Italiens, Paris')).toMatchObject({ key: 'paris' })
    expect(geocodeKey('New York, NY')).toMatchObject({ key: 'new york' })
    expect(geocodeKey('Middle of Nowhere')).toBeNull()
  })

  it('titleCaseCity uses canonical display names', () => {
    expect(titleCaseCity('new york')).toBe('New York')
    expect(titleCaseCity('the hague')).toBe('The Hague')
    expect(titleCaseCity('paris')).toBe('Paris')
  })
})
