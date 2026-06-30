/**
 * GET /api/getty?artist=<name>&title=<title>
 *
 * Searches the seeded Getty Provenance Index — Knoedler Stock Books dataset
 * (public/data/getty-knoedler.json) for historical art market transactions.
 *
 * Source: Getty Research Institute, CC0 1.0 Public Domain
 * Data: Knoedler & Co. stock books 1872–1970 (~2,600 Impressionist/modern records)
 *
 * Artist matching: extract last name from "Firstname Lastname (French, 1859–1891)"
 * and compare against Knoedler authority "LASTNAME, FIRSTNAME".
 *
 * Honesty: returns only what's in the source — no invented dates, prices, or names.
 * Every record carries sourceLabel + sourceUrl linking back to the Getty handle.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCached } from '@/lib/cache'
import { searchGetty } from '@/lib/getty'
import type { GettyRecord } from '@/lib/types'

const GETTY_TTL_MS = 30 * 60 * 1000

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get('artist') ?? ''
  const title = request.nextUrl.searchParams.get('title') ?? ''

  if (!artist.trim()) {
    return NextResponse.json({ error: 'Missing query param: artist' }, { status: 400 })
  }

  const cacheKey = `getty:${artist.toLowerCase()}:${title.toLowerCase()}`
  const cached = await getCached<GettyRecord[]>(cacheKey)
  if (cached) return NextResponse.json(cached)

  const matches = searchGetty(artist, title, 20)
  await setCached(cacheKey, matches, GETTY_TTL_MS)
  return NextResponse.json(matches)
}
