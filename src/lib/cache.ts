/**
 * Simple in-memory cache with TTL.
 * Keyed by string; values are typed generically.
 * Not shared across serverless function instances — acceptable for dev and
 * single-node prod; swap for Redis if multi-instance.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
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
