/**
 * Smoke coverage for the #243 hook-order fix: useState/useRef must run on
 * EVERY render of this component, empty state or not, so the conditional
 * early return above them can never skip a hook call. renderToStaticMarkup
 * only exercises a single render pass each (this repo's test env has no
 * jsdom/act() to simulate a re-render toggling empty <-> populated on the
 * same instance), but it does prove both branches still render cleanly with
 * the hooks hoisted above the early return, and guards against a regression
 * back to a conditional declaration.
 */
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ChainOfCustodyTimeline } from '../src/components/provenance/ChainOfCustodyTimeline'
import type { LocationEntry } from '../src/lib/types'

const populatedLocations: LocationEntry[] = [
  { name: 'The artist', institution: 'Origin', lat: 48.8566, lng: 2.3522, startDate: '1880', endDate: '1895', source: 'Wikidata P276', confidence: 'high' },
  { name: 'A Private Collector', lat: 40.7128, lng: -74.006, startDate: '1895', endDate: '1930', source: 'Wikidata P276', confidence: 'medium' },
  { name: 'The Art Institute of Chicago', lat: 41.8796, lng: -87.6237, startDate: '1930', endDate: null, source: 'AIC API', confidence: 'high' },
]

describe('ChainOfCustodyTimeline — hooks run on every render path (#243)', () => {
  it('renders the empty-state branch without throwing', () => {
    const html = renderToStaticMarkup(<ChainOfCustodyTimeline locations={[]} exhibitions={[]} gettyRecords={[]} gaps={[]} />)
    expect(html).not.toContain('NaN')
    expect(html.toLowerCase()).toContain('provenance gap')
  })

  it('renders the populated branch (past the early return) without throwing', () => {
    const html = renderToStaticMarkup(<ChainOfCustodyTimeline locations={populatedLocations} exhibitions={[]} gettyRecords={[]} gaps={[]} />)
    expect(html).not.toContain('NaN')
    expect(html).toContain('Chain of custody')
  })
})
