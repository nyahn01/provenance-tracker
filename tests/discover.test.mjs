import { describe, it, expect } from 'vitest'
import { scoreCandidate, rankCandidates } from '../scripts/discover-works.mjs'

// Synthetic AIC search hits — no network in tests (CI has no AIC access).
const rich = {
  id: 101, title: 'The Poppy Field', artist_display: 'Claude Monet\nFrench, 1840–1926',
  date_start: 1890, is_public_domain: true, image_id: 'img-1',
  provenance_text: 'The artist, Paris, 1890; Durand-Ruel, Paris, 1891; sold to Martin Ryerson, Chicago, 1900; The Art Institute of Chicago, 1933.',
  exhibition_history: 'Paris, 1900.',
}
const thin = {
  id: 102, title: 'Sketch', artist_display: 'Unknown', date_start: null,
  is_public_domain: true, image_id: 'img-2', provenance_text: 'Chicago.', exhibition_history: '',
}
const copyrighted = { ...rich, id: 103, is_public_domain: false }
const noProse = { ...rich, id: 104, provenance_text: '' }

const GETTY = [
  { artist: 'MONET, CLAUDE', title: 'The Poppy Field', buyer: 'X' },
  { artist: 'MONET, CLAUDE', title: 'Water Lilies', buyer: 'Y' },
]

describe('scoreCandidate', () => {
  it('scores rich prose above thin prose (deterministic, explainable breakdown)', () => {
    const a = scoreCandidate(rich, GETTY)
    const b = scoreCandidate(thin, GETTY)
    expect(a.score).toBeGreaterThan(b.score)
    expect(a.breakdown.prose).toBeGreaterThan(b.breakdown.prose)
    expect(a.breakdown.exhibitions).toBe(10)
    expect(b.breakdown.exhibitions).toBe(0)
  })

  it('counts distinct years as a chain-depth proxy', () => {
    expect(scoreCandidate(rich, []).distinctYears).toBe(4) // 1890, 1891, 1900, 1933
  })

  it('weights same-title Getty records above artist-context ones', () => {
    const withGetty = scoreCandidate(rich, GETTY)
    expect(withGetty.gettySameWork).toBe(1)
    expect(withGetty.gettyContext).toBe(1)
    expect(withGetty.breakdown.getty).toBe(4) // 1×3 + 1
  })
})

describe('rankCandidates', () => {
  it('excludes copyrighted works, prose-less works, and already-featured ids', () => {
    const ranked = rankCandidates([rich, thin, copyrighted, noProse], GETTY, new Set(['102']))
    expect(ranked.map(c => c.id)).toEqual(['101']) // 102 featured, 103 not PD, 104 no prose
  })

  it('sorts by score, richest first', () => {
    const ranked = rankCandidates([thin, rich], GETTY, new Set())
    expect(ranked[0].id).toBe('101')
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score)
  })
})
