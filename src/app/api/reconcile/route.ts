/**
 * POST /api/reconcile
 *
 * Body: { artwork: string, locations: LocationEntry[], rawProvenance: string }
 *
 * Uses claude-haiku-4-5-20251001 (cheapest/fastest) to merge multi-source
 * location fragments into a clean chronological timeline. The model is
 * instructed to:
 *   - Only assert what the source data confirms
 *   - Mark uncertain entries as such
 *   - Flag conflicts between sources
 *   - Note gaps explicitly rather than filling them in
 *
 * Returns:
 *   { timeline: TimelineEntry[], conflicts: string[], warnings: string[] }
 *
 * Budget guard: max_tokens = 400.
 * Cache: 10 min TTL per request hash.
 * Rate limit: 20 req / min / IP (shared limit with other routes).
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { cacheGet, cacheSet, checkRateLimit } from '@/lib/cache'
import type { ReconcileRequest, ReconcileResponse } from '@/lib/types'

const RECONCILE_TTL_MS = 10 * 60 * 1000 // 10 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashBody(body: ReconcileRequest): string {
  // Stable cache key — JSON.stringify order is deterministic for plain objects
  return `reconcile:${JSON.stringify(body)}`
}

function buildPrompt(body: ReconcileRequest): string {
  const locationsJson = JSON.stringify(body.locations, null, 2)
  return `You are a museum provenance researcher. Your job is to merge structured location data and raw provenance text into a clean chronological timeline.

ARTWORK: ${body.artwork}

STRUCTURED LOCATIONS (from Wikidata P276 and museum APIs):
${locationsJson}

RAW PROVENANCE TEXT:
${body.rawProvenance || '(none provided)'}

INSTRUCTIONS:
1. Produce a chronological timeline array. Each entry has:
   - "date": the best available date string (year or ISO-8601), or null if unknown
   - "location": place name
   - "confidence": "confirmed" (source explicitly states it), "uncertain" (inferred or qualified), or "gap" (period with no information)
   - "note": brief explanation or null

2. If two sources conflict about the same period, include both entries with confidence "uncertain" and note the conflict.
3. Do NOT invent dates or locations. If a period is undocumented, add a "gap" entry.
4. Return ONLY valid JSON matching this schema — no prose:
{
  "timeline": [{"date": string|null, "location": string, "confidence": "confirmed"|"uncertain"|"gap", "note": string|null}],
  "conflicts": ["description of any conflict"],
  "warnings": ["any important caveats about data quality"]
}`
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Per-IP rate limiting
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

  let body: ReconcileRequest
  try {
    body = (await request.json()) as ReconcileRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.artwork) {
    return NextResponse.json({ error: 'Missing required field: artwork' }, { status: 400 })
  }

  const cacheKey = hashBody(body)
  const cached = cacheGet<ReconcileResponse>(cacheKey)
  if (cached) {
    return NextResponse.json({ ...cached, cached: true })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 },
    )
  }

  const client = new Anthropic({ apiKey })

  let raw: string
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: buildPrompt(body) }],
    })

    const block = message.content[0]
    if (block.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic')
    }
    raw = block.text
  } catch (err) {
    console.error('[reconcile/anthropic]', err)
    return NextResponse.json(
      { error: 'Anthropic API call failed' },
      { status: 502 },
    )
  }

  // Parse the JSON the model returned. If it is wrapped in a code fence, strip it.
  let parsed: ReconcileResponse
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    parsed = JSON.parse(cleaned) as ReconcileResponse
  } catch {
    console.error('[reconcile/parse] raw output:', raw)
    return NextResponse.json(
      { error: 'Model returned non-JSON output', raw },
      { status: 502 },
    )
  }

  // Validate minimal shape — protect downstream consumers
  if (!Array.isArray(parsed.timeline)) {
    return NextResponse.json(
      { error: 'Model response missing timeline array', raw },
      { status: 502 },
    )
  }

  const response: ReconcileResponse = {
    timeline: parsed.timeline,
    conflicts: parsed.conflicts ?? [],
    warnings: parsed.warnings ?? [],
  }

  cacheSet(cacheKey, response, RECONCILE_TTL_MS)
  return NextResponse.json(response)
}
