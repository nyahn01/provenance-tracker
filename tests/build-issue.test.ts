import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS module, no types
import { selectBuildable, buildBrief } from '../scripts/build-issue.mjs'

describe('build loop — selectBuildable', () => {
  const issues = [
    { number: 30, title: 'B', labels: [{ name: 'priority' }, { name: 'agent:provenance-data' }] },
    { number: 12, title: 'A', labels: ['priority', 'agent:design-director'] },
    { number: 40, title: 'paused one', labels: [{ name: 'priority' }, { name: 'paused' }] },
  ]

  it('takes oldest-first, skips paused, respects the cap', () => {
    const picked = selectBuildable(issues, 2)
    expect(picked.map((p: any) => p.number)).toEqual([12, 30]) // 40 is paused, sorted by number
    expect(picked[0]).toMatchObject({ number: 12, agent: 'agent:design-director' })
  })

  it('never returns a paused issue', () => {
    expect(selectBuildable(issues, 10).some((p: any) => p.number === 40)).toBe(false)
  })
})

describe('build loop — buildBrief', () => {
  it('produces a brief with the issue, owning agent, gates, and human-merge rule', () => {
    const brief = buildBrief({ number: 7, title: 'Fix the geocoder', body: 'add Naugatuck', labels: ['priority', 'agent:provenance-data'] })
    expect(brief).toContain('issue #7')
    expect(brief).toContain('agent:provenance-data')
    expect(brief).toContain('npm run honesty')
    expect(brief).toContain('Closes #7')
    expect(brief).toMatch(/human merges/i)
  })
})
