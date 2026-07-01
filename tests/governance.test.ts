import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS module, no types
import { autoPromoteTarget } from '../scripts/decision/promote.mjs'
// @ts-expect-error
import { findDatedPlans } from '../scripts/sentinels/stale-plans.mjs'

describe('auto-promotion policy — autoPromoteTarget', () => {
  it('promotes security and honesty proposals to their owning agent', () => {
    expect(autoPromoteTarget('[sentinel] security: 1 high vulnerability')).toEqual({ kind: 'security', agent: 'provenance-data' })
    expect(autoPromoteTarget('[sentinel] honesty-regression: contract eroded on main')).toEqual({ kind: 'honesty', agent: 'provenance-honesty-review' })
  })

  it('does NOT promote judgment-call proposals (data/docs/hygiene/feedback)', () => {
    expect(autoPromoteTarget('[sentinel] data-quality: null coords')).toBeNull()
    expect(autoPromoteTarget('[sentinel] docs-drift: broken refs')).toBeNull()
    expect(autoPromoteTarget('[feedback] ux: mobile layout')).toBeNull()
  })

  it('respects the enabled-kinds allowlist', () => {
    expect(autoPromoteTarget('[sentinel] security: x', ['honesty'])).toBeNull()
    expect(autoPromoteTarget('[sentinel] honesty: x', ['honesty'])).toMatchObject({ kind: 'honesty' })
  })
})

describe('stale-plans sentinel — findDatedPlans', () => {
  it('flags dated plan files and ignores README', () => {
    expect(findDatedPlans(['README.md', '2026-06-20-github-feedback-loop.md', 'notes.txt']))
      .toEqual(['2026-06-20-github-feedback-loop.md'])
  })

  it('returns [] for a clean plans dir', () => {
    expect(findDatedPlans(['README.md'])).toEqual([])
  })
})
