/**
 * GET /api/cache/invalidate?source=met|aic|wikidata|rkd
 *
 * Purges all in-memory cache entries for the specified data source.
 * Useful before a demo recording to ensure fresh data without waiting for TTL expiry.
 *
 * Query params:
 *   source  — required: "met" | "aic" | "wikidata" | "rkd"
 *
 * Response: { source, removed, message }
 *
 * Rate limit: shares the global 20 req/min/IP limiter.
 * Note: only clears the in-process cache — each serverless instance has its own store.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  cacheInvalidateSource,
  cacheStats,
  checkRateLimit,
  CACHE_TTL,
  type CacheSource,
} from '@/lib/cache'

const VALID_SOURCES: CacheSource[] = ['met', 'aic', 'wikidata', 'rkd']

export async function GET(request: NextRequest) {
  // Per-IP rate limiting (shared with other routes)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 20 requests per minute.' },
      { status: 429 },
    )
  }

  const source = request.nextUrl.searchParams.get('source')

  if (!source || !VALID_SOURCES.includes(source as CacheSource)) {
    return NextResponse.json(
      {
        error: `Query param "source" must be one of: ${VALID_SOURCES.join(' | ')}`,
        valid_sources: VALID_SOURCES,
        ttls: {
          met: `${CACHE_TTL.met / 1000 / 60 / 60 / 24}d`,
          aic: `${CACHE_TTL.aic / 1000 / 60 / 60 / 24}d`,
          wikidata: `${CACHE_TTL.wikidata / 1000 / 60 / 60 / 24}d`,
          rkd: `${CACHE_TTL.rkd / 1000 / 60 / 60 / 24}d`,
        },
      },
      { status: 400 },
    )
  }

  const removed = await cacheInvalidateSource(source as CacheSource)
  const stats = cacheStats()

  // `source` is whitelist-validated above, but encode it inline at the log sink —
  // a barrier CodeQL models — so the log-injection query stays clear regardless.
  console.log(
    `[cache/invalidate] source=${encodeURIComponent(source)} removed=${removed} total_remaining=${stats.total}`,
  )

  return NextResponse.json({
    source,
    removed,
    total_remaining: stats.total,
    message:
      removed === 0
        ? `No cached entries found for source "${source}". Cache may already be empty.`
        : `Invalidated ${removed} cache ${removed === 1 ? 'entry' : 'entries'} for source "${source}".`,
  })
}
