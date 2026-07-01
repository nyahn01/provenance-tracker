import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS module, no types
import { scoreProposal, rankProposals, renderDigest } from '../scripts/decision/rank.mjs'
// @ts-expect-error
import { parsePlan } from '../scripts/plan-to-issue.mjs'

describe('decision head — scoreProposal', () => {
  it('weights security and honesty above hygiene/docs', () => {
    const sec = scoreProposal({ title: '[sentinel] security: 1 high vulnerability' }).score
    const hyg = scoreProposal({ title: '[sentinel] repo-hygiene: 3 TODO markers' }).score
    expect(sec).toBeGreaterThan(hyg)
  })

  it('adds engagement and staleness on top of base weight', () => {
    const bare = scoreProposal({ title: '[feedback] ux: x' }).score
    const hot = scoreProposal({ title: '[feedback] ux: x', comments: 4, reactions: 3, ageDays: 21 }).score
    expect(hot).toBeGreaterThan(bare)
  })
})

describe('decision head — rankProposals + renderDigest', () => {
  const issues = [
    { number: 10, title: '[sentinel] repo-hygiene: markers' },
    { number: 11, title: '[sentinel] security: 1 high vulnerability' },
    { number: 12, title: '[sentinel] data-quality: null coords' },
  ]

  it('ranks security first and recommends it', () => {
    const ranked = rankProposals(issues)
    expect(ranked[0].number).toBe(11)
    const digest = renderDigest(ranked)
    expect(digest).toContain('promote #11')
    expect(digest).toContain('<!-- decision-digest -->')
  })

  it('renders a clean-queue message when there are no proposals', () => {
    expect(renderDigest([])).toContain('queue is clear')
  })
})

describe('plan-to-issue — parsePlan', () => {
  it('uses the first # heading as the title and drops it from the body', () => {
    const { title, body } = parsePlan('# Improve the globe lighting\n\nSome detail here.')
    expect(title).toBe('Improve the globe lighting')
    expect(body).toBe('Some detail here.')
  })

  it('honors a title override', () => {
    const { title } = parsePlan('# ignored\nbody', 'Explicit title')
    expect(title).toBe('Explicit title')
  })

  it('falls back to the first non-empty line when no heading', () => {
    expect(parsePlan('just a line of text\nmore').title).toBe('just a line of text')
  })
})
