/**
 * POST /api/feedback
 *
 * Accepts a feedback submission from the in-app form and files it as a labeled
 * GitHub issue (repo: nyahn01/provenance-tracker, label: "feedback").
 *
 * Server-side only — GITHUB_TOKEN never reaches the client.
 * Degrades honestly: if GITHUB_TOKEN is absent, returns 503 { fallback: 'email' }
 * so the form can surface the email fallback instead of failing silently.
 *
 * Rate limit: 5 req / min / IP. Honeypot field ("website") silently drops bots.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/cache'

const REPO = 'nyahn01/provenance-tracker'
const VALID_CATEGORIES = ['bug', 'data-correction', 'feature', 'ux', 'general'] as const
type Category = (typeof VALID_CATEGORIES)[number]

interface FeedbackBody {
  name?: string
  email?: string
  category?: string
  message?: string
  website?: string // honeypot — must stay empty
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: NextRequest) {
  // Rate limit (stricter than the 20/min default used by read routes)
  if (!checkRateLimit(clientIp(request), 5, 60_000)) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded. Max 5 submissions per minute.' },
      { status: 429 },
    )
  }

  let body: FeedbackBody
  try {
    body = (await request.json()) as FeedbackBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 })
  }

  // Honeypot: a real user never fills the hidden "website" field. Pretend success.
  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true })
  }

  // Validation
  const category = (body.category ?? 'general').trim() as Category
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { ok: false, error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 },
    )
  }

  const message = (body.message ?? '').trim()
  if (message.length < 10 || message.length > 5000) {
    return NextResponse.json(
      { ok: false, error: 'Message must be between 10 and 5000 characters.' },
      { status: 400 },
    )
  }

  const name = (body.name ?? '').trim().slice(0, 120)
  const email = (body.email ?? '').trim().slice(0, 200)

  // Graceful degradation — no token configured (local dev, or not yet set on Vercel)
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json(
      { ok: false, fallback: 'email', error: 'Feedback service is offline. Please email instead.' },
      { status: 503 },
    )
  }

  // Compose the issue
  const title = `[feedback] ${category}: ${message.slice(0, 60)}${message.length > 60 ? '…' : ''}`
  const issueBody = [
    `**Category:** ${category}`,
    name ? `**From:** ${name}` : null,
    email ? `**Contact:** ${email}` : null,
    '',
    '**Feedback:**',
    '',
    message
      .split('\n')
      .map(l => `> ${l}`)
      .join('\n'),
    '',
    '---',
    '_Submitted via the in-app feedback form._',
  ]
    .filter(l => l !== null)
    .join('\n')

  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ProvenanceTracker-Feedback',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
  const postIssue = (withLabels: boolean) =>
    fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify(
        withLabels ? { title, body: issueBody, labels: ['feedback'] } : { title, body: issueBody },
      ),
    })

  try {
    let res = await postIssue(true)

    // A missing "feedback" label (or a token lacking label-write) can 403/422 the
    // labeled request even when plain issue creation is allowed. Retry unlabeled
    // before giving up so a label problem never silently breaks feedback.
    if (!res.ok && (res.status === 403 || res.status === 422)) {
      console.error(`[feedback] labeled issue create failed (HTTP ${res.status}); retrying without label`)
      res = await postIssue(false)
    }

    if (!res.ok) {
      // Log status server-side; never leak token or GitHub payload to the client.
      console.error(`[feedback] GitHub issue creation failed: HTTP ${res.status}`)
      return NextResponse.json(
        { ok: false, fallback: 'email', error: 'Could not file feedback right now. Please email instead.' },
        { status: 502 },
      )
    }

    const issue = (await res.json()) as { number: number }
    return NextResponse.json({ ok: true, issue: issue.number })
  } catch (err) {
    console.error('[feedback] Unexpected error filing GitHub issue:', err)
    return NextResponse.json(
      { ok: false, fallback: 'email', error: 'Could not file feedback right now. Please email instead.' },
      { status: 502 },
    )
  }
}
