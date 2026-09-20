import { describe, it, expect } from 'vitest'
// @ts-ignore — plain .mjs module, no type declarations
import { planRefresh, parseState, renderState, stripState, exceedsPeak, mergePeak } from '../scripts/sentinels/refresh.mjs'
// @ts-ignore
import { summarizeAudit } from '../scripts/sentinels/security.mjs'

const finding = (over: Record<string, unknown> = {}) => ({
  id: 'security-npm-audit',
  label: 'proposal',
  title: '[sentinel] security: 2 high',
  body: '`npm audit` reports **2 high**.',
  signal: { critical: 0, high: 2 },
  ...over,
})

/** Apply a plan to an issue the way the orchestrator would, for multi-run tests. */
const apply = (issue: any, plan: any) => ({
  ...issue,
  title: plan.title ?? issue.title,
  body: plan.action === 'noop' ? issue.body : plan.body,
})

describe('state marker round-trip', () => {
  it('survives write then read', () => {
    const state = { signal: { high: 2 }, peak: { high: 5 }, label: 'priority' }
    expect(parseState(`body\n\n${renderState(state)}`)).toEqual(state)
  })

  it('returns null rather than throwing on a missing or corrupt marker', () => {
    expect(parseState('no marker here')).toBeNull()
    expect(parseState('<!-- sentinel-state:{not json} -->')).toBeNull()
    expect(parseState('')).toBeNull()
    expect(parseState(undefined)).toBeNull()
  })

  it('strips the marker so bodies compare like with like', () => {
    expect(stripState(`text\n\n${renderState({ peak: {} })}`)).toBe('text')
  })
})

describe('exceedsPeak / mergePeak', () => {
  it('reports only counters past the recorded worst', () => {
    expect(exceedsPeak({ high: 6, moderate: 1 }, { high: 2, moderate: 3 }))
      .toEqual([{ key: 'high', from: 2, to: 6 }])
  })

  it('treats an absent peak as new ground', () => {
    expect(exceedsPeak({ high: 1 }, null)).toEqual([{ key: 'high', from: 0, to: 1 }])
  })

  it('ignores non-numeric values rather than crashing a run', () => {
    expect(exceedsPeak({ high: 'lots' as any, low: NaN }, {})).toEqual([])
  })

  it('takes the element-wise maximum, never lowering the mark', () => {
    expect(mergePeak({ high: 2, critical: 1 }, { high: 9 })).toEqual({ high: 9, critical: 1 })
  })
})

describe('planRefresh — the three outcomes', () => {
  it('does nothing when the finding is unchanged', () => {
    const f = finding()
    const issue = { title: f.title, body: `${f.body}\n\n${renderState({ signal: f.signal, peak: f.signal, label: f.label })}` }
    expect(planRefresh(issue, f).action).toBe('noop')
  })

  it('refreshes silently when the wording moved but nothing got worse', () => {
    const f = finding({ body: '`npm audit` reports **2 high**. Details changed.' })
    const issue = { title: f.title, body: `old text\n\n${renderState({ signal: { high: 2 }, peak: { high: 9 }, label: 'proposal' })}` }
    const plan = planRefresh(issue, f)
    expect(plan.action).toBe('refresh')
    expect(plan.comment).toBeUndefined()
    expect(plan.body).toContain('Details changed')
  })

  it('escalates with one comment when a counter passes its high-water mark', () => {
    const f = finding({ signal: { critical: 1, high: 6 }, title: '[sentinel] security: 1 critical, 6 high' })
    const issue = { title: '[sentinel] security: 2 high', body: `old\n\n${renderState({ signal: { high: 2 }, peak: { critical: 0, high: 2 }, label: 'proposal' })}` }
    const plan = planRefresh(issue, f)
    expect(plan.action).toBe('escalate')
    expect(plan.comment).toContain('`critical`: 0 → **1**')
    expect(plan.comment).toContain('`high`: 2 → **6**')
    expect(plan.title).toBe('[sentinel] security: 1 critical, 6 high')
  })

  it('escalates on a severity-tier change even with no counters', () => {
    const f = finding({ label: 'priority', signal: undefined })
    const issue = { title: f.title, body: `${f.body}\n\n${renderState({ peak: {}, label: 'proposal' })}` }
    const plan = planRefresh(issue, f)
    expect(plan.action).toBe('escalate')
    expect(plan.comment).toContain('`proposal` → `priority`')
  })
})

describe('planRefresh — it cannot become a comment pump (#231 regression)', () => {
  it('stays silent across many identical re-runs', () => {
    const f = finding()
    let issue: any = { title: f.title, body: `${f.body}\n\n${renderState({ signal: f.signal, peak: f.signal, label: f.label })}` }
    const actions: string[] = []
    for (let run = 0; run < 60; run++) {
      const plan = planRefresh(issue, f)
      actions.push(plan.action)
      issue = apply(issue, plan)
    }
    expect(new Set(actions)).toEqual(new Set(['noop']))
  })

  it('comments ONCE for a count that oscillates, not on every rise', () => {
    // 2 → 7 → 2 → 7 → 2 → 7. Only the first 7 is new ground.
    let issue: any = {
      title: 'x',
      body: `body 2\n\n${renderState({ signal: { high: 2 }, peak: { high: 2 }, label: 'proposal' })}`,
    }
    let comments = 0
    for (const high of [7, 2, 7, 2, 7]) {
      const f = finding({ signal: { high }, body: `body ${high}`, title: `t ${high}` })
      const plan = planRefresh(issue, f)
      if (plan.action === 'escalate') comments++
      issue = apply(issue, plan)
    }
    expect(comments).toBe(1)
  })

  it('comments again only when a genuinely new worst is reached', () => {
    let issue: any = {
      title: 'x',
      body: `body 2\n\n${renderState({ signal: { high: 2 }, peak: { high: 2 }, label: 'proposal' })}`,
    }
    const escalations: number[] = []
    for (const high of [5, 3, 5, 9, 9, 4]) {
      const f = finding({ signal: { high }, body: `body ${high}`, title: `t ${high}` })
      const plan = planRefresh(issue, f)
      if (plan.action === 'escalate') escalations.push(high)
      issue = apply(issue, plan)
    }
    expect(escalations).toEqual([5, 9]) // two new worsts, nothing else
  })

  it('keeps refreshing the body while staying silent as a finding improves', () => {
    let issue: any = {
      title: 'x',
      body: `body 9\n\n${renderState({ signal: { high: 9 }, peak: { high: 9 }, label: 'proposal' })}`,
    }
    const actions: string[] = []
    for (const high of [6, 3, 1]) {
      const f = finding({ signal: { high }, body: `body ${high}`, title: `t ${high}` })
      const plan = planRefresh(issue, f)
      actions.push(plan.action)
      issue = apply(issue, plan)
    }
    expect(actions).toEqual(['refresh', 'refresh', 'refresh'])
    expect(issue.body).toContain('body 1')
    // The mark never falls, so a later relapse to 9 stays quiet.
    expect(parseState(issue.body).peak).toEqual({ high: 9 })
  })
})

describe('the #202 scenario end to end', () => {
  it('a body filed at 2 high becomes current and speaks once when a critical appears', () => {
    const filed = summarizeAudit({ metadata: { vulnerabilities: { high: 2 } }, vulnerabilities: {} })!
    let issue: any = {
      title: filed.title,
      body: `${filed.body}\n\n${renderState({ signal: filed.signal, peak: filed.signal, label: filed.label })}`,
    }
    expect(issue.body).toContain('2 high')

    // 60 quiet runs at the same level — this is what actually happened.
    for (let i = 0; i < 60; i++) {
      const plan = planRefresh(issue, filed)
      expect(plan.action).toBe('noop')
      issue = apply(issue, plan)
    }

    // Then the surface degrades.
    const worse = summarizeAudit({ metadata: { vulnerabilities: { critical: 1, high: 6, moderate: 3 } }, vulnerabilities: {} })!
    const plan = planRefresh(issue, worse)
    issue = apply(issue, plan)

    expect(plan.action).toBe('escalate')
    expect(issue.body).toContain('1 critical, 6 high, 3 moderate')
    expect(issue.body).not.toContain('reports **2 high**')
    expect(issue.title).toContain('1 critical')
    // No tier change to report: 2 high already tripped `severe`, so the real #202
    // carried `priority` from the day it was filed. What escalated is the counts.
    expect(plan.comment).toContain('`critical`: 0 → **1**')
    expect(plan.comment).toContain('`high`: 2 → **6**')
    expect(plan.comment).not.toContain('Severity tier escalated')
  })

  it('would have caught it on the very next run, not the 60th', () => {
    const filed = summarizeAudit({ metadata: { vulnerabilities: { high: 2 } }, vulnerabilities: {} })!
    const issue = {
      title: filed.title,
      body: `${filed.body}\n\n${renderState({ signal: filed.signal, peak: filed.signal, label: filed.label })}`,
    }
    const worse = summarizeAudit({ metadata: { vulnerabilities: { critical: 1, high: 2 } }, vulnerabilities: {} })!
    expect(planRefresh(issue, worse).action).toBe('escalate')
  })
})
