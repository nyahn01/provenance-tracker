'use client'

/**
 * NewsletterSignup — one-field email capture posting to /api/subscribe.
 *
 * Honest and low-key by design: says what it is (one provenance story,
 * roughly monthly), promises nothing else, and degrades to a mailto link
 * when the signup service is unconfigured (same pattern as FeedbackForm).
 *
 * Palette is prop-driven so the same component sits on the dark landing
 * (OBS) and the dark marketing pages (MARKETING) without restating hexes.
 */

import { useState } from 'react'
import { OBS, MARKETING } from '@/lib/design-tokens'
import type { NewsletterSubscribeResponse } from '@/lib/types'

const EMAIL = 'ahn.ny01@gmail.com'
const MAILTO = `mailto:${EMAIL}?subject=Provenance%20Tracker%20newsletter`

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string; emailFallback: boolean }

export function NewsletterSignup({ palette = 'marketing' }: { palette?: 'obs' | 'marketing' }) {
  const C = palette === 'obs' ? OBS : MARKETING
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status.kind === 'submitting') return
    const form = e.currentTarget
    const data = new FormData(form)
    const payload = {
      email: String(data.get('email') ?? ''),
      website: String(data.get('website') ?? ''), // honeypot
    }
    setStatus({ kind: 'submitting' })
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json().catch(() => ({}))) as NewsletterSubscribeResponse
      if (res.ok && json.ok) {
        setStatus({ kind: 'success' })
        form.reset()
      } else {
        setStatus({
          kind: 'error',
          message: json.error ?? 'Something went wrong. Please try again.',
          emailFallback: json.fallback === 'email' || res.status >= 500,
        })
      }
    } catch {
      setStatus({ kind: 'error', message: 'Could not reach the server.', emailFallback: true })
    }
  }

  if (status.kind === 'success') {
    return (
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.6 }}>
        Thank you — check your inbox to confirm the subscription.
      </div>
    )
  }

  const submitting = status.kind === 'submitting'

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'var(--font-ui)' }}>
      <div style={{ fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
        One provenance story, roughly monthly. No tracking beyond the email itself;
        unsubscribe any time.
      </div>
      {/* Honeypot — hidden from real users, catches bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 420 }}>
        <input
          name="email"
          type="email"
          required
          maxLength={200}
          placeholder="you@example.com"
          aria-label="Email address for the newsletter"
          style={{
            flex: '1 1 200px',
            padding: '9px 12px',
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            color: C.text,
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '9px 18px',
            background: 'rgba(212,168,83,0.10)',
            border: `1px solid ${C.gold}`,
            borderRadius: 7,
            color: C.gold,
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            fontFamily: 'inherit',
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Signing up…' : 'Subscribe'}
        </button>
      </div>
      {status.kind === 'error' && (
        <div style={{ marginTop: 10, fontSize: '0.78rem', color: C.textMuted, lineHeight: 1.55 }}>
          {status.emailFallback ? (
            <>
              Signup isn&apos;t available right now — email{' '}
              <a href={MAILTO} style={{ color: C.gold, borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}>
                {EMAIL}
              </a>{' '}
              with &ldquo;newsletter&rdquo; and I&apos;ll add you when it is.
            </>
          ) : (
            status.message
          )}
        </div>
      )}
    </form>
  )
}
