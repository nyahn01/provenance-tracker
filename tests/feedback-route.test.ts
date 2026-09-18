import { describe, it, expect } from 'vitest'
import { classifyDomain, feedbackLabels } from '../src/lib/feedback-routing'

describe('feedback router — classifyDomain', () => {
  it('routes by keyword signal first', () => {
    expect(classifyDomain('general', 'The globe zoom is janky', 'arcs flicker')).toBe('provenance-globe')
    expect(classifyDomain('bug', 'contrast too low', 'the colour palette hurts')).toBe('design-director')
    expect(classifyDomain('feature', 'pricing page', 'what is the subscription revenue model')).toBe('provenance-strategy')
    expect(classifyDomain('general', 'wrong Getty date', 'the provenance custody source is off')).toBe('provenance-data')
  })

  it('falls back to the category default when no keyword matches', () => {
    expect(classifyDomain('data-correction', 'please fix', 'something is off')).toBe('provenance-data')
    expect(classifyDomain('ux', 'hard to use', 'confusing')).toBe('design-director')
    expect(classifyDomain('feature', 'idea', 'add a thing')).toBe('provenance-strategy')
    expect(classifyDomain('general', '', '')).toBe('provenance-strategy')
  })

  it('falls back to strategy for a category it does not know', () => {
    expect(classifyDomain('not-a-category', '', '')).toBe('provenance-strategy')
  })
})

describe('feedback router — feedbackLabels', () => {
  // Routing happens at intake now, so these are the labels the issue is BORN with.
  // Nothing downstream adds a label, and nothing is left for a human to apply.
  it('stamps the feedback label plus the domain owner', () => {
    expect(feedbackLabels('ux', 'mobile layout broken', '')).toEqual(['feedback', 'agent:design-director'])
    expect(feedbackLabels('bug', 'globe crash', 'map pin error')).toEqual(['feedback', 'agent:provenance-globe'])
  })

  it('never emits a queue label — promotion stays a human decision', () => {
    const labels = feedbackLabels('data-correction', 'wrong dates', 'custody source is off')
    expect(labels).not.toContain('priority')
    expect(labels).not.toContain('triage-queued')
    expect(labels).not.toContain('ready-to-build')
  })
})
