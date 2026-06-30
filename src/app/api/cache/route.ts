/**
 * GET /api/cache
 *
 * Returns current in-memory cache statistics.
 * Useful for verifying TTL config and cache state before a demo.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheStats, checkRateLimit, CACHE_TTL } from '@/lib/cache'

export async function GET(request: NextRequest) {
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

  const stats = cacheStats()

  return NextResponse.json({
    total: stats.total,
    durable: stats.durable, // true when a Vercel KV / Upstash L2 is configured
    ttl_config: {
      met: `${CACHE_TTL.met / 1000 / 60 / 60 / 24}d`,
      aic: `${CACHE_TTL.aic / 1000 / 60 / 60 / 24}d`,
      wikidata: `${CACHE_TTL.wikidata / 1000 / 60 / 60 / 24}d`,
      rkd: `${CACHE_TTL.rkd / 1000 / 60 / 60 / 24}d`,
    },
    entries: stats.entries,
  })
}
