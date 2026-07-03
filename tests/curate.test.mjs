import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  detectConflicts,
  gatherGetty,
  deterministicExtract,
  chainGaps,
  sameName,
  applyArtistOriginFix,
  gettyYear,
  validateChain,
  parseJsonObject,
  thinkingFor,
  curateModel,
} from '../scripts/curate.mjs'
import committedChains from '../src/lib/featured-provenance.json'

const AIC = 'AIC provenance'
const __dir = dirname(fileURLToPath(import.meta.url))

describe('detectConflicts (the ADR-0003 honesty rule)', () => {
  const chain = [{ name: 'Chicago', institution: 'Bertha Palmer', startDate: '1895', endDate: '1922', source: AIC }]

  it('surfaces a conflict when two sources date the same party differently', () => {
    const getty = [{ piRecordNo: 'K-1', buyer: 'Bertha Palmer', seller: 'Knoedler', saleDate: '1892-03-03', sourceLabel: 'Getty GPI — Knoedler' }]
    const conflicts = detectConflicts(chain, getty)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ holder: 'Bertha Palmer', aicYear: '1895', gettyYear: '1892' })
    // It records a gap, never a chosen "consensus" value.
    expect(conflicts[0].note).toMatch(/unresolved gap/i)
  })

  it('stays silent when the sources agree (±1 year)', () => {
    const agree = [{ piRecordNo: 'K-2', buyer: 'Bertha Palmer', saleDate: '1895-01-01', sourceLabel: 'Getty GPI' }]
    expect(detectConflicts(chain, agree)).toEqual([])
  })

  it('raises no conflict when no chain holder matches the Getty party', () => {
    const other = [{ piRecordNo: 'K-3', buyer: 'Someone Else', saleDate: '1850-01-01', sourceLabel: 'Getty GPI' }]
    expect(detectConflicts(chain, other)).toEqual([])
  })
})

describe('gatherGetty', () => {
  const records = [
    { artist: 'MONET, CLAUDE', title: 'Water Lilies', buyer: 'X' },
    { artist: 'MONET, CLAUDE', title: 'The poppy field', buyer: 'Y' },
    { artist: 'DEGAS, EDGAR', title: 'Dancers', buyer: 'Z' },
  ]

  it('splits same-title (conflict candidates) from artist-only (market context)', () => {
    const { sameWork, context } = gatherGetty(records, 'Claude Monet', 'Water Lilies')
    expect(sameWork.map(r => r.title)).toEqual(['Water Lilies'])
    expect(context.map(r => r.title)).toEqual(['The poppy field'])
  })

  it('an artist with no records yields empty buckets', () => {
    expect(gatherGetty(records, 'Pablo Picasso', 'Guernica')).toEqual({ sameWork: [], context: [] })
  })
})

describe('deterministicExtract', () => {
  const meta = {
    artist: 'Claude Monet',
    creationYear: 1906,
    prose: 'The artist, Paris, 1906; Durand-Ruel, Paris, 1909; Durand-Ruel, New York, 1911; Martin A. Ryerson, Chicago, 1914; The Art Institute of Chicago, 1933.',
  }

  it('mines a dated, ordered chain from AIC prose', () => {
    const chain = deterministicExtract(meta)
    expect(chain.map(e => e.name)).toEqual(['Paris', 'Paris', 'New York', 'Chicago', 'Chicago'])
    expect(chain[0].startDate).toBe('1906')
  })

  it('every entry carries source "AIC provenance" and no null-island coords (honesty rules)', () => {
    const chain = deterministicExtract(meta)
    expect(chain.every(e => e.source === AIC)).toBe(true)
    expect(chain.every(e => !(e.lat === 0 || e.lng === 0))).toBe(true)
  })

  it('returns [] for prose too short to mine', () => {
    expect(deterministicExtract({ artist: 'X', creationYear: null, prose: 'n/a' })).toEqual([])
  })
})

describe('applyArtistOriginFix', () => {
  it('dates an artist-held entry to the creation year when its startDate is missing', () => {
    const out = applyArtistOriginFix([{ name: 'Paris', institution: 'Claude Monet', startDate: null, source: AIC }], 'Claude Monet', 1906)
    expect(out[0].startDate).toBe('1906')
  })

  it('never invents a date when the creation year is unknown (honesty rule)', () => {
    const out = applyArtistOriginFix([{ name: 'Paris', institution: 'Claude Monet', startDate: null, source: AIC }], 'Claude Monet', null)
    expect(out[0].startDate).toBeNull()
  })

  it('leaves a non-artist holder untouched', () => {
    const out = applyArtistOriginFix([{ name: 'Paris', institution: 'Durand-Ruel', startDate: null, source: AIC }], 'Claude Monet', 1906)
    expect(out[0].startDate).toBeNull()
  })
})

describe('chainGaps', () => {
  it('reports an undocumented span between consecutive dated entries', () => {
    const gaps = chainGaps([
      { name: 'Paris', startDate: '1906', endDate: '1909', source: AIC },
      { name: 'Chicago', startDate: '1950', endDate: null, source: AIC },
    ])
    expect(gaps).toEqual([{ from: '1909', to: '1950', note: expect.stringContaining('1909') }])
  })

  it('reports no gap for a continuous chain', () => {
    const gaps = chainGaps([
      { name: 'Paris', startDate: '1906', endDate: '1909', source: AIC },
      { name: 'Chicago', startDate: '1909', endDate: null, source: AIC },
    ])
    expect(gaps).toEqual([])
  })
})

describe('helpers', () => {
  it('sameName matches loosely on case/punctuation but not on short tokens', () => {
    expect(sameName('Durand-Ruel', 'durand ruel')).toBe(true)
    expect(sameName('The Art Institute of Chicago', 'Art Institute of Chicago')).toBe(true)
    expect(sameName('A', 'B')).toBe(false)
  })

  it('gettyYear pulls a 4-digit year from saleDate then entryDate', () => {
    expect(gettyYear({ saleDate: '1892-03-03', entryDate: '1891-04-04' })).toBe('1892')
    expect(gettyYear({ saleDate: null, entryDate: '1891-04-04' })).toBe('1891')
    expect(gettyYear({ saleDate: null, entryDate: null })).toBeNull()
  })
})

describe('parseJsonObject (tolerant extraction of the model response)', () => {
  it('parses a clean JSON object', () => {
    expect(parseJsonObject('{"entries":[]}')).toEqual({ entries: [] })
  })

  it('strips ```json code fences', () => {
    expect(parseJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('ignores prose/preamble before and after the object', () => {
    const raw = 'Here is the chain you asked for:\n{"entries":[{"place":"Paris"}]}\nLet me know if you need more.'
    expect(parseJsonObject(raw)).toEqual({ entries: [{ place: 'Paris' }] })
  })

  it('handles braces inside string values without truncating', () => {
    expect(parseJsonObject('{"note":"a {nested} brace","n":2}')).toEqual({ note: 'a {nested} brace', n: 2 })
  })

  it('throws when there is no JSON object at all', () => {
    expect(() => parseJsonObject('no json here')).toThrow()
  })
})

describe('extraction model selection (CURATE_MODEL, honest request shape)', () => {
  it('defaults to the Haiku tier when CURATE_MODEL is unset (cheap first pass; drafts are human-reviewed)', () => {
    const saved = process.env.CURATE_MODEL
    delete process.env.CURATE_MODEL
    expect(curateModel()).toBe('claude-haiku-4-5')
    if (saved !== undefined) process.env.CURATE_MODEL = saved
  })

  it('honours CURATE_MODEL when set (bump to Sonnet/Opus for a hard audited case)', () => {
    const saved = process.env.CURATE_MODEL
    process.env.CURATE_MODEL = 'claude-opus-4-8'
    expect(curateModel()).toBe('claude-opus-4-8')
    if (saved !== undefined) process.env.CURATE_MODEL = saved
    else delete process.env.CURATE_MODEL
  })

  it('disables thinking for Haiku/Sonnet/Opus (structured extraction), omits it for Fable/Mythos', () => {
    expect(thinkingFor('claude-haiku-4-5')).toEqual({ type: 'disabled' })
    expect(thinkingFor('claude-sonnet-5')).toEqual({ type: 'disabled' })
    expect(thinkingFor('claude-opus-4-8')).toEqual({ type: 'disabled' })
    // Fable/Mythos reject a disabled thinking block — must be omitted.
    expect(thinkingFor('claude-fable-5')).toBeUndefined()
    expect(thinkingFor('claude-mythos-5')).toBeUndefined()
  })
})

describe('validateChain (the Stage-5 gate, ADR 0003 §5)', () => {
  const good = [
    { name: 'Paris', institution: 'Claude Monet', lat: 48.8566, lng: 2.3522, startDate: '1906', endDate: '1909', source: AIC },
    { name: 'Chicago', institution: 'The Art Institute of Chicago', lat: 41.8781, lng: -87.6298, startDate: '1933', endDate: null, source: AIC },
  ]

  it('accepts a well-formed chain', () => {
    const g = validateChain(good)
    expect(g.ok).toBe(true)
    expect(g.errors).toEqual([])
    expect(g.stats).toEqual({ entries: 2, mapped: 2, datedStart: 2 })
  })

  it('rejects an empty or non-array chain', () => {
    expect(validateChain([]).ok).toBe(false)
    expect(validateChain(null).ok).toBe(false)
  })

  it('rejects a missing source (every fact carries a source)', () => {
    const g = validateChain([{ ...good[0], source: '' }, good[1]])
    expect(g.ok).toBe(false)
    expect(g.errors.join()).toMatch(/source/)
  })

  it('rejects null-island coordinates (honesty rule: null, never 0)', () => {
    const g = validateChain([{ ...good[0], lat: 0 }, good[1]])
    expect(g.ok).toBe(false)
    expect(g.errors.join()).toMatch(/null-island/)
  })

  it('rejects non-4-digit dates', () => {
    const g = validateChain([{ ...good[0], startDate: '06' }, good[1]])
    expect(g.ok).toBe(false)
    expect(g.errors.join()).toMatch(/4-digit/)
  })

  it('rejects out-of-order dated entries but allows same-year handoffs', () => {
    expect(validateChain([{ ...good[1] }, { ...good[0] }]).ok).toBe(false)
    const sameYear = [{ ...good[0], startDate: '1906' }, { ...good[1], startDate: '1906' }]
    expect(validateChain(sameYear).errors).toEqual([])
  })

  it('rejects fewer than 2 mapped entries (reads as an honest gap, not a featured journey)', () => {
    const g = validateChain([good[0], { ...good[1], lat: null, lng: null }])
    expect(g.ok).toBe(false)
    expect(g.errors.join()).toMatch(/mapped/)
  })

  it('warns (never errors) on unmapped cities, missing institutions, and documented gaps', () => {
    const g = validateChain([
      { ...good[0], endDate: '1909' },
      { name: 'Giverny', lat: null, lng: null, startDate: '1920', endDate: null, source: AIC },
      { ...good[1], startDate: '1933' },
    ])
    expect(g.ok).toBe(true)
    expect(g.warnings.join()).toMatch(/unmapped/)
    expect(g.warnings.join()).toMatch(/gap/)
  })
})

describe('committed featured chains (known-answer regression)', () => {
  it('every committed chain passes the Stage-5 gate', () => {
    for (const [key, chain] of Object.entries(committedChains)) {
      const g = validateChain(chain)
      expect(g.errors, `${key}: ${g.errors.join(' | ')}`).toEqual([])
    }
  })

  it('the Water Lilies chain (aic:16568) ends at the Art Institute of Chicago', () => {
    const chain = committedChains['aic:16568']
    const last = chain[chain.length - 1]
    expect(last.name).toBe('Chicago')
    expect(last.institution).toMatch(/Art Institute/)
  })
})

// ADR 0003's known-answer test: re-mine the REAL Water Lilies provenance prose
// (deterministic path — Claude output is nondeterministic and CI has no key)
// and compare against the committed chain. The fixture is a verbatim capture of
// the AIC API's provenance_text — capture it from a machine that can reach AIC:
//   curl -s 'https://api.artic.edu/api/v1/artworks/16568?fields=provenance_text' \
//     -H 'User-Agent: provenance-tracker/fixture' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(JSON.stringify({id:'16568',title:'Water Lilies',artist:'Claude Monet',creationYear:1906,capturedAt:new Date().toISOString().slice(0,10),prose:j.data.provenance_text},null,2))})" \
//     > tests/fixtures/aic-16568.provenance.json
// NEVER reconstruct the prose from the committed chain — that would be circular.
const FIXTURE = join(__dir, 'fixtures', 'aic-16568.provenance.json')
describe.skipIf(!existsSync(FIXTURE))('known-answer: Water Lilies prose → deterministic extraction', () => {
  it('re-mined chain agrees with the committed chain (cities ⊆ committed set, dates in range)', () => {
    const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'))
    const mined = deterministicExtract(fixture)
    expect(mined.length).toBeGreaterThanOrEqual(3)
    // The miner segments clause-by-clause, Claude segments holder-by-holder —
    // assert set relationships and date bounds, not entry-count equality.
    const committedCities = new Set(committedChains['aic:16568'].map(e => e.name))
    for (const e of mined) {
      expect(committedCities.has(e.name), `unexpected city "${e.name}"`).toBe(true)
      expect(e.source).toBe(AIC)
      expect(e.lat === 0 || e.lng === 0).toBe(false)
      if (e.startDate) {
        expect(Number(e.startDate)).toBeGreaterThanOrEqual(1906)
        expect(Number(e.startDate)).toBeLessThanOrEqual(1933)
      }
    }
    expect(mined[mined.length - 1].name).toBe('Chicago')
  })
})
