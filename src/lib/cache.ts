/**
 * Two-tier cache with TTL.
 *
 *  L1 — in-process Map (fast, but empty on every serverless cold start).
 *  L2 — a durable key/value store (Vercel KV / Upstash Redis) reached over its
 *       REST API, so cached museum/Claude responses survive cold starts and are
 *       shared across function instances. L2 is OPTIONAL: when its env vars are
 *       absent the cache is L1-only and behaves exactly as before.
 *
 * Configure L2 by setting either pair (Vercel KV exposes the first; Upstash the
 * second — we read whichever is present):
 *   KV_REST_API_URL        + KV_REST_API_TOKEN
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *
 * The cache must never break a request: every L2 call is best-effort, time-boxed,
 * and falls back to L1 on any error.
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

/** Cache keys embed user-supplied query terms; strip control chars (CR/LF) and
 *  bound the length before logging so a crafted key can't forge log lines. */
function keyForLog(key: string): string {
  // eslint-disable-next-line no-control-regex
  return key.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 200)
}

// ─── L1: synchronous in-process tier ─────────────────────────────────────────

function l1Get<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value as T
}

function l1Set<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

// ─── L2: durable REST tier (Vercel KV / Upstash), optional ───────────────────
// Namespaced so the store can be shared without colliding with other keys.
const L2_NS = 'pvt:'
const L2_TIMEOUT_MS = 2000

function l2Config(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url: url.replace(/\/$/, ''), token }
}

/** Run one Redis command via the Upstash-compatible REST API. Returns `result`
 *  or undefined on any failure (the cache degrades to L1, never throws). */
async function l2Command<R = unknown>(command: (string | number)[]): Promise<R | undefined> {
  const cfg = l2Config()
  if (!cfg) return undefined
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(L2_TIMEOUT_MS),
    })
    if (!res.ok) return undefined
    const json = (await res.json()) as { result?: R }
    return json.result ?? undefined
  } catch {
    return undefined
  }
}

// L2 values embed their own expiry so an L2 hit can repopulate L1 with the
// correct remaining TTL (Redis PX is the backstop for eviction).
interface L2Payload<T> { v: T; e: number }

async function l2Get<T>(key: string): Promise<{ value: T; ttlRemainingMs: number } | undefined> {
  const raw = await l2Command<string>(['GET', L2_NS + key])
  if (typeof raw !== 'string') return undefined
  try {
    const { v, e } = JSON.parse(raw) as L2Payload<T>
    const ttlRemainingMs = e - Date.now()
    if (ttlRemainingMs <= 0) return undefined
    return { value: v, ttlRemainingMs }
  } catch {
    return undefined
  }
}

async function l2Set<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const payload: L2Payload<T> = { v: value, e: Date.now() + ttlMs }
  await l2Command(['SET', L2_NS + key, JSON.stringify(payload), 'PX', ttlMs])
}

/** Delete every L2 key matching a namespaced prefix, via SCAN + DEL. Best-effort. */
async function l2DelByPrefix(prefix: string): Promise<number> {
  if (!l2Config()) return 0
  let cursor = '0'
  let removed = 0
  // Bound the scan so a pathological keyspace can't loop forever.
  for (let i = 0; i < 100; i++) {
    const page = await l2Command<[string, string[]]>(['SCAN', cursor, 'MATCH', `${L2_NS}${prefix}*`, 'COUNT', 200])
    if (!page) break
    const [next, keys] = page
    if (keys.length) {
      const n = await l2Command<number>(['DEL', ...keys])
      removed += typeof n === 'number' ? n : 0
    }
    cursor = next
    if (cursor === '0') break
  }
  return removed
}

// ─── Public async API (L1 + L2) ──────────────────────────────────────────────

/** Read through L1 then L2. An L2 hit repopulates L1 for the rest of this instance's life. */
export async function getCached<T>(key: string): Promise<T | undefined> {
  const hot = l1Get<T>(key)
  if (hot !== undefined) {
    console.log(`[cache] HIT(l1)  ${keyForLog(key)}`)
    return hot
  }
  const warm = await l2Get<T>(key)
  if (warm !== undefined) {
    l1Set(key, warm.value, warm.ttlRemainingMs)
    console.log(`[cache] HIT(l2)  ${keyForLog(key)}`)
    return warm.value
  }
  console.log(`[cache] MISS     ${keyForLog(key)}`)
  return undefined
}

/** Write to L1 and (best-effort) the durable L2. */
export async function setCached<T>(key: string, value: T, ttlMs: number): Promise<void> {
  l1Set(key, value, ttlMs)
  console.log(`[cache] SET      ${keyForLog(key)} (ttl=${Math.round(ttlMs / 1000)}s)`)
  await l2Set(key, value, ttlMs)
}

// ─── Synchronous L1-only helpers ─────────────────────────────────────────────
// Used by routes whose responses include locally-sourced data (Getty seed file,
// disk prose cache): they stay in-process so file-derived bytes are never written
// to the shared durable store. Network-only routes use getCached/setCached (L1+L2).

/** L1-only read. */
export function cacheGet<T>(key: string): T | undefined {
  return l1Get<T>(key)
}

/** L1-only write. */
export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  l1Set(key, value, ttlMs)
}

/**
 * Invalidate all cache entries whose keys start with any of the given prefixes,
 * across L1 and (best-effort) L2. Returns the number of L1 entries removed.
 */
export async function cacheInvalidateByPrefixes(prefixes: string[]): Promise<number> {
  let removed = 0
  for (const key of store.keys()) {
    if (prefixes.some(p => key.startsWith(p))) {
      store.delete(key)
      removed++
      console.log(`[cache] INVALIDATED ${keyForLog(key)}`)
    }
  }
  for (const p of prefixes) await l2DelByPrefix(p)
  return removed
}

/**
 * Invalidate all cache entries for a given data source (L1 + L2).
 * Returns the number of L1 entries removed.
 */
export async function cacheInvalidateSource(source: CacheSource): Promise<number> {
  return cacheInvalidateByPrefixes(CACHE_KEY_PREFIXES[source])
}

/** Return snapshot stats for the in-process L1 tier (observability). */
export function cacheStats(): { total: number; entries: string[]; durable: boolean } {
  const now = Date.now()
  const entries: string[] = []
  for (const [key, entry] of store.entries()) {
    const ttlRemaining = Math.round((entry.expiresAt - now) / 1000)
    entries.push(`${key} (ttl_remaining=${ttlRemaining}s)`)
  }
  return { total: store.size, entries, durable: l2Config() !== null }
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
