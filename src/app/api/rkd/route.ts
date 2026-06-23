/**
 * GET /api/rkd?artist=<name>&title=<title>&limit=<n>
 * Proxy for RKD Netherlands Art Institute search. No API key required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/cache'
import { searchRkd } from '@/lib/rkd'

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get('artist') ?? ''
  const title = request.nextUrl.searchParams.get('title') ?? ''
  const limit = Math.min(20, parseInt(request.nextUrl.searchParams.get('limit') ?? '10', 10))

  if (!artist) return NextResponse.json({ error: 'Missing param: artist' }, { status: 400 })

  const key = `rkd:${artist}:${title}:${limit}`
  const cached = cacheGet(key)
  if (cached) return NextResponse.json(cached)

  const records = await searchRkd(artist, title, limit)
  const result = { records, source: 'RKD Netherlands Art Institute', count: records.length }
  cacheSet(key, result, CACHE_TTL.rkd)
  return NextResponse.json(result)
}
