import { describe, it, expect } from 'vitest'
import { geocode, geocodeNamed } from '../src/lib/geocode'

describe('geocode', () => {
  it('resolves a known city embedded in a longer place string', () => {
    expect(geocode('23 Boulevard des Italiens, Paris, France')).toEqual({ lat: 48.8566, lng: 2.3522 })
    expect(geocode('Chicago, IL')).toEqual({ lat: 41.8781, lng: -87.6298 })
  })

  it('prefers the longer city name (multi-word match wins)', () => {
    // "new york" must win as a whole, not partially shadow a shorter key.
    expect(geocode('New York, NY')).toEqual({ lat: 40.7128, lng: -74.006 })
    expect(geocode('The Hague, Netherlands')).toEqual({ lat: 52.0705, lng: 4.3007 })
  })

  it('returns null for an unknown place — never invents a coordinate (honesty rule)', () => {
    expect(geocode('Atlantis')).toBeNull()
    expect(geocode('a place that does not exist')).toBeNull()
  })

  it('returns null for empty / nullish input', () => {
    expect(geocode(null)).toBeNull()
    expect(geocode(undefined)).toBeNull()
    expect(geocode('')).toBeNull()
  })

  it('never resolves to null-island (0,0) for a known city', () => {
    for (const place of ['Paris', 'London', 'Tokyo', 'Buenos Aires']) {
      const pt = geocode(place)
      expect(pt).not.toBeNull()
      expect(pt!.lat === 0 && pt!.lng === 0).toBe(false)
    }
  })
})

describe('geocodeNamed', () => {
  it('returns the canonical display name for the matched city', () => {
    expect(geocodeNamed('chicago, il')).toMatchObject({ name: 'Chicago' })
    expect(geocodeNamed('the hague')).toMatchObject({ name: 'The Hague' })
    expect(geocodeNamed('new york')).toMatchObject({ name: 'New York' })
  })

  it('returns null for unknown / empty input', () => {
    expect(geocodeNamed('nowhere-ville')).toBeNull()
    expect(geocodeNamed(null)).toBeNull()
  })
})
