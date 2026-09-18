import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS module, no types
import { selectBuildable, buildBrief, needsBrief, briefMarker } from '../scripts/build-issue.mjs'

describe('build loop — selectBuildable', () => {
  const issues = [
    { number: 30, title: 'B', labels: [{ name: 'priority' }, { name: 'agent:provenance-data' }] },
    { number: 12, title: 'A', labels: ['priority', 'agent:design-director'] },
    { number: 40, title: 'paused one', labels: [{ name: 'priority' }, { name: 'paused' }] },
    { number: 8, title: 'already dispatched', labels: ['priority', 'ready-to-build'] },
  ]

  it('takes oldest-first, skips paused, respects the cap', () => {
    const picked = selectBuildable(issues, 2)
    expect(picked.map((p: any) => p.number)).toEqual([12, 30]) // 40 is paused, sorted by number
    expect(picked[0]).toMatchObject({ number: 12, agent: 'agent:design-director' })
  })

  it('never returns a paused issue', () => {
    expect(selectBuildable(issues, 10).some((p: any) => p.number === 40)).toBe(false)
  })

  // Regression: #112/#115/#189 were re-served on every run for 77 days, so the cap
  // never reached newer work (#202 security, #228 feedback). Already-dispatched
  // issues drop out of the queue.
  it('never re-serves an issue already labeled ready-to-build', () => {
    expect(selectBuildable(issues, 10).some((p: any) => p.number === 8)).toBe(false)
    expect(selectBuildable(issues, 1).map((p: any) => p.number)).toEqual([12])
  })
})

describe('build loop — needsBrief (comment idempotency)', () => {
  it('is true when the issue carries no brief yet', () => {
    expect(needsBrief(7, [])).toBe(true)
    expect(needsBrief(7, [{ body: 'unrelated chatter' }])).toBe(true)
  })

  it('is false once a marked brief exists', () => {
    expect(needsBrief(7, [{ body: `a brief\n\n${briefMarker(7)}` }])).toBe(false)
  })

  it('recognises the legacy unmarked brief so spammed issues get no more comments', () => {
    expect(needsBrief(112, [{ body: '**Ready to build.** No `BUILD_AGENT_CMD` configured, ...' }])).toBe(false)
  })

  it('tolerates malformed comments', () => {
    expect(needsBrief(7, [null as any, {}, { body: undefined }])).toBe(true)
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
