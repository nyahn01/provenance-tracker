import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getCached,
  setCached,
  cacheStats,
  cacheInvalidateByPrefixes,
  CACHE_KEY_PREFIXES,
} from '../src/lib/cache'

// These tests run with NO L2 configured (no KV_*/UPSTASH_* env), so they exercise
// the in-process L1 tier and prove the memory-only fallback is unchanged.
describe('cache (L1, no durable L2 configured)', () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL
    delete process.env.KV_REST_API_TOKEN
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('returns undefined on a miss', async () => {
    expect(await getCached('search:none')).toBeUndefined()
  })

  it('round-trips a value set then read', async () => {
    await setCached('search:all:monet', { results: [1, 2, 3] }, 60_000)
    expect(await getCached('search:all:monet')).toEqual({ results: [1, 2, 3] })
  })

  it('expires an entry once its TTL elapses', async () => {
    await setCached('provenance:aic:16568', { x: 1 }, 1_000)
    vi.advanceTimersByTime(1_001)
    expect(await getCached('provenance:aic:16568')).toBeUndefined()
  })

  it('reports durable:false when no L2 is configured', () => {
    expect(cacheStats().durable).toBe(false)
  })

  it('invalidates by prefix and reports the count removed', async () => {
    // Dedicated prefix so the assertion is independent of any other test's keys.
    await setCached('provenance:aic:inv-a', { a: 1 }, 60_000)
    await setCached('provenance:aic:inv-b', { a: 2 }, 60_000)
    await setCached('wikidata:inv-keep', { w: 1 }, 60_000)
    const removed = await cacheInvalidateByPrefixes(['provenance:aic:inv-'])
    expect(removed).toBe(2)
    expect(await getCached('provenance:aic:inv-a')).toBeUndefined()
    expect(await getCached('wikidata:inv-keep')).toEqual({ w: 1 }) // untouched
  })

  it('exposes the source-prefix map for scoped invalidation', () => {
    expect(CACHE_KEY_PREFIXES.aic).toContain('provenance:aic:')
    expect(CACHE_KEY_PREFIXES.wikidata).toEqual(['wikidata:'])
  })
})
