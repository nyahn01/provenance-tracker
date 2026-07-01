import { describe, it, expect } from 'vitest'
import { buildUnifiedTimeline } from '../src/components/provenance/timeline'
import type { LocationEntry } from '../src/lib/types'

const loc = (institution: string, name: string, startDate: string | null, endDate: string | null): LocationEntry =>
  ({ name, institution, lat: null, lng: null, startDate, endDate, source: 'AIC provenance' })

describe('buildUnifiedTimeline — start-less custody ordering (#103)', () => {
  it('orders a start-less entry by its endDate instead of dangling it at the end', () => {
    // Mirrors aic:64818: Palmer Family (1902–) → Wood (?–1984) → AIC (1985–).
    const locations = [
      loc('Palmer Family', 'Chicago', '1902', null),
      loc('Arthur M. Wood and Pauline Palmer Wood', 'Lake Forest', null, '1984'),
      loc('The Art Institute of Chicago', 'Chicago', '1985', null),
    ]
    const events = buildUnifiedTimeline(locations, [], [])
    const who = events.map(e => e.who)
    // The Wood entry sorts BETWEEN Palmer (1902) and AIC (1985), not last.
    expect(who).toEqual([
      'Palmer Family',
      'Arthur M. Wood and Pauline Palmer Wood',
      'The Art Institute of Chicago',
    ])
  })

  it('never invents a start date — shows "?" but notes the known endDate', () => {
    const events = buildUnifiedTimeline([loc('Wood', 'Lake Forest', null, '1984')], [], [])
    expect(events[0].year).toBe('?')            // start is honestly unknown
    expect(events[0].detail).toBe('Held until 1984')
  })
})
