import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS sentinel modules, no types
import { extractRepoPaths, scanDocsDrift } from '../scripts/sentinels/docs-drift.mjs'
// @ts-expect-error
import { summarizeAudit } from '../scripts/sentinels/security.mjs'
// @ts-expect-error
import { findMarkers } from '../scripts/sentinels/repo-hygiene.mjs'

describe('docs-drift sentinel', () => {
  it('extracts only real-looking repo file paths from inline code', () => {
    const md = 'See `src/lib/types.ts` and `scripts/curate.mjs:12`, but not `npm run build` or `agent:data` or `src/lib` (a dir).'
    const paths = extractRepoPaths(md)
    expect(paths).toContain('src/lib/types.ts')
    expect(paths).toContain('scripts/curate.mjs')
    expect(paths).not.toContain('npm run build')
    expect(paths).not.toContain('src/lib')
  })

  it('flags a broken reference and ignores an existing one', () => {
    const root = '/repo'
    const exists = (p: string) => p === 'src/lib/types.ts' // only this one "exists"
    // Fake tree via a custom exists fn; scanDocsDrift reads real md files, so drive
    // the pure extractor + exists contract directly for determinism:
    const refs = extractRepoPaths('`src/lib/types.ts` and `src/lib/gone.ts`')
    const broken = refs.filter(p => !exists(p))
    expect(broken).toEqual(['src/lib/gone.ts'])
    void root; void scanDocsDrift
  })
})

describe('security sentinel — summarizeAudit', () => {
  it('returns null when there are no vulnerabilities', () => {
    expect(summarizeAudit({ metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } } })).toBeNull()
  })

  it('files a proposal for moderate-only findings', () => {
    const f = summarizeAudit({
      metadata: { vulnerabilities: { moderate: 1, high: 0, critical: 0 } },
      vulnerabilities: { postcss: { name: 'postcss', severity: 'moderate', via: [{ title: 'ReDoS' }] } },
    })
    expect(f.label).toBe('proposal')
    expect(f.title).toMatch(/1 moderate/)
    expect(f.body).toContain('postcss')
  })

  it('escalates to priority when high/critical present', () => {
    const f = summarizeAudit({ metadata: { vulnerabilities: { high: 2 } }, vulnerabilities: {} })
    expect(f.label).toBe('priority')
  })
})

describe('repo-hygiene sentinel — findMarkers', () => {
  it('catches TODO/FIXME/HACK/XXX markers', () => {
    const hits = findMarkers(['const a = 1 // TODO: refactor', 'let b // FIXME broken', 'ok line'].join('\n'))
    expect(hits.map((h: any) => h.marker)).toEqual(['TODO', 'FIXME'])
  })

  it('ignores honesty-ok lines and clean code', () => {
    expect(findMarkers('const x = 1 // TODO later // honesty-ok')).toEqual([])
    expect(findMarkers('const y = 2 // a normal comment')).toEqual([])
  })
})
