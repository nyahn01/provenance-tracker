/**
 * Simple in-memory cache with TTL.
 * Keyed by string; values are typed generically.
 * Not shared across serverless function instances — acceptable for dev and
 * single-node prod; swap for Redis if multi-instance.
 */

// ─── TTL configuration (per data source) ─────────────────────────────────────
// These constants are the single source of truth for cache lifetimes.
// Met/AIC museum records are stable (7 days); Wikidata/RKD update more frequently (1 day).

export const CACHE_TTL = {
  /** Metropolitan Museum of Art — stable museum records, 7-day TTL */
  met: 7 * 24 * 60 * 60 * 1000,
  /** Art Institute of Chicago — stable museum records, 7-day TTL */
  aic: 7 * 24 * 60 * 60 * 1000,
  /** Wikidata — community-edited, refresh daily */
  wikidata: 1 * 24 * 60 * 60 * 1000,
  /** RKD Netherlands Art Institute — sync daily */
  rkd: 1 * 24 * 60 * 60 * 1000,
} as const

export type CacheSource = keyof typeof CACHE_TTL

// ─── Cache key prefixes (used for source-scoped invalidation) ─────────────────

/** All provenance and search cache keys are prefixed by source so invalidation is scoped. */
export const CACHE_KEY_PREFIXES: Record<CacheSource, string[]> = {
  met: ['provenance:met:', 'search:'],
  aic: ['provenance:aic:', 'search:'],
  wikidata: ['wikidata:'],
  rkd: ['rkd:'],
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) {
    console.log(`[cache] MISS  ${key}`)
    return undefined
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    console.log(`[cache] EXPIRED ${key}`)
    return undefined
  }
  console.log(`[cache] HIT   ${key}`)
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
  console.log(`[cache] SET   ${key} (ttl=${Math.round(ttlMs / 1000)}s)`)
}

/**
 * Invalidate all cache entries whose keys start with any of the given prefixes.
 * Returns the number of entries removed.
 */
export function cacheInvalidateByPrefixes(prefixes: string[]): number {
  let removed = 0
  for (const key of store.keys()) {
    if (prefixes.some(p => key.startsWith(p))) {
      store.delete(key)
      removed++
      console.log(`[cache] INVALIDATED ${key}`)
    }
  }
  return removed
}

/**
 * Invalidate all cache entries for a given data source.
 * Returns the number of entries removed.
 */
export function cacheInvalidateSource(source: CacheSource): number {
  const prefixes = CACHE_KEY_PREFIXES[source]
  return cacheInvalidateByPrefixes(prefixes)
}

/** Return snapshot stats (total entries, breakdown by prefix) for observability. */
export function cacheStats(): { total: number; entries: string[] } {
  const now = Date.now()
  const entries: string[] = []
  for (const [key, entry] of store.entries()) {
    const ttlRemaining = Math.round((entry.expiresAt - now) / 1000)
    entries.push(`${key} (ttl_remaining=${ttlRemaining}s)`)
  }
  return { total: store.size, entries }
}

// --- Per-IP rate limiter ---
// Sliding window: track timestamps of recent requests per IP.

const ipWindows = new Map<string, number[]>()

/**
 * Returns true if the request should be allowed.
 * maxRequests / windowMs is the rate (default: 20 req / 60 000 ms).
 */
export function checkRateLimit(
  ip: string,
  maxRequests = 20,
  windowMs = 60_000,
): boolean {
  const now = Date.now()
  const cutoff = now - windowMs
  const timestamps = (ipWindows.get(ip) ?? []).filter(t => t > cutoff)
  if (timestamps.length >= maxRequests) return false
  timestamps.push(now)
  ipWindows.set(ip, timestamps)
  return true
}
