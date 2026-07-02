/**
 * POST /api/subscribe
 *
 * Adds an email to the newsletter list via Buttondown (merchant of the list;
 * handles double-opt-in and unsubscribe, so no address is ever stored here).
 *
 * Server-side only — BUTTONDOWN_API_KEY never reaches the client.
 * Degrades honestly: if the key is absent, returns 503 { fallback: 'email' }
 * so the form surfaces the email fallback instead of failing silently.
 *
 * Rate limit: 5 req / min / IP. Honeypot field ("website") silently drops bots.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/cache'
import type { NewsletterSubscribeBody, NewsletterSubscribeResponse } from '@/lib/types'

const BUTTONDOWN_API = 'https://api.buttondown.com/v1/subscribers'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function json(body: NewsletterSubscribeResponse, status = 200) {
  return NextResponse.json(body, { status })
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit(clientIp(request), 5, 60_000)) {
    return json({ ok: false, error: 'Rate limit exceeded. Max 5 requests per minute.' }, 429)
  }

  let body: NewsletterSubscribeBody
  try {
    body = (await request.json()) as NewsletterSubscribeBody
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400)
  }

  // Honeypot: a real user never fills the hidden "website" field. Pretend success.
  if (body.website && body.website.trim().length > 0) {
    return json({ ok: true })
  }

  const email = (body.email ?? '').trim().slice(0, 200)
  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400)
  }

  // Graceful degradation — no key configured (local dev, or not yet set on Vercel)
  const apiKey = process.env.BUTTONDOWN_API_KEY
  if (!apiKey) {
    return json(
      { ok: false, fallback: 'email', error: 'Signup service is offline. Please email instead.' },
      503,
    )
  }

  try {
    const res = await fetch(BUTTONDOWN_API, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_address: email }),
    })

    if (res.ok) return json({ ok: true })

    // Buttondown 400s on an already-subscribed address — treat as success so
    // the response never reveals whether an email is on the list.
    if (res.status === 400) return json({ ok: true })

    console.error(`[subscribe] Buttondown request failed: HTTP ${res.status}`)
    return json(
      { ok: false, fallback: 'email', error: 'Could not sign you up right now. Please email instead.' },
      502,
    )
  } catch (err) {
    console.error('[subscribe] Unexpected error reaching Buttondown:', err)
    return json(
      { ok: false, fallback: 'email', error: 'Could not sign you up right now. Please email instead.' },
      502,
    )
  }
}
