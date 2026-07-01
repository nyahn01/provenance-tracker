import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS module, no types
import { classifyDomain, categoryOf, planFeedbackRouting } from '../scripts/feedback/route.mjs'

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
})

describe('feedback router — categoryOf', () => {
  it('parses the [feedback] <category>: convention', () => {
    expect(categoryOf({ title: '[feedback] data-correction: wrong date' })).toBe('data-correction')
    expect(categoryOf({ title: 'no convention here' })).toBe('general')
  })
})

describe('feedback router — planFeedbackRouting', () => {
  it('routes untriaged issues and skips already-queued ones (idempotent)', () => {
    const issues = [
      { number: 1, title: '[feedback] ux: mobile layout broken', body: '', labels: ['feedback'] },
      { number: 2, title: '[feedback] bug: globe crash', body: 'map pin error', labels: [{ name: 'feedback' }, { name: 'triage-queued' }] },
    ]
    const plan = planFeedbackRouting(issues)
    expect(plan).toHaveLength(1)
    expect(plan[0]).toMatchObject({ number: 1, label: 'agent:design-director' })
  })
})
