'use client'

/**
 * FeedbackForm — in-app feedback form that posts to /api/feedback.
 * On success the route files a labeled GitHub issue; on 503/502 the form
 * surfaces the email fallback (ahn.ny01@gmail.com).
 *
 * Design tokens mirror the marketing pages (/pricing, /learn).
 */

import { useState } from 'react'
import { MARKETING as C } from '@/lib/design-tokens'

const EMAIL = 'ahn.ny01@gmail.com'
const MAILTO = `mailto:${EMAIL}?subject=Provenance%20Tracker%20feedback`

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'bug', label: 'Bug / something broken' },
  { value: 'data-correction', label: 'Data correction' },
  { value: 'feature', label: 'Feature idea' },
  { value: 'ux', label: 'Design / usability' },
]

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; issue?: number }
  | { kind: 'error'; message: string; emailFallback: boolean }

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 7,
  color: C.text,
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: C.textMuted,
  marginBottom: 8,
}

export default function FeedbackForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status.kind === 'submitting') return

    const form = e.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      category: String(data.get('category') ?? 'general'),
      message: String(data.get('message') ?? ''),
      website: String(data.get('website') ?? ''), // honeypot
    }

    setStatus({ kind: 'submitting' })
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        issue?: number
        error?: string
        fallback?: string
      }

      if (res.ok && json.ok) {
        setStatus({ kind: 'success', issue: json.issue })
        form.reset()
      } else {
        setStatus({
          kind: 'error',
          message: json.error ?? 'Something went wrong. Please try again.',
          emailFallback: json.fallback === 'email' || res.status >= 500,
        })
      }
    } catch {
      setStatus({
        kind: 'error',
        message: 'Could not reach the server. Please email instead.',
        emailFallback: true,
      })
    }
  }

  if (status.kind === 'success') {
    return (
      <div
        style={{
          padding: '28px',
          background: 'rgba(111,141,125,0.06)',
          border: `1px solid rgba(111,141,125,0.28)`,
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: '1.05rem', color: C.text, marginBottom: 8 }}>
          Thank you — your feedback was received.
        </div>
        <p style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.6 }}>
          {status.issue
            ? `It's logged as issue #${status.issue} and will be reviewed. `
            : 'It will be reviewed. '}
          If you left an email, I may follow up.
        </p>
        <button
          onClick={() => setStatus({ kind: 'idle' })}
          style={{
            marginTop: 16,
            padding: '9px 18px',
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            color: C.textMuted,
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Send another
        </button>
      </div>
    )
  }

  const submitting = status.kind === 'submitting'

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Honeypot — hidden from real users, catches bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <div>
        <label htmlFor="fb-category" style={labelStyle}>
          What kind of feedback?
        </label>
        <select id="fb-category" name="category" defaultValue="general" style={inputStyle}>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value} style={{ background: C.surface }}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="fb-message" style={labelStyle}>
          Your feedback <span style={{ color: C.clay }}>*</span>
        </label>
        <textarea
          id="fb-message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder="What's working, what's broken, what's missing, or a correction to the data…"
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div>
          <label htmlFor="fb-name" style={labelStyle}>
            Name <span style={{ color: C.textFaint, fontWeight: 400 }}>(optional)</span>
          </label>
          <input id="fb-name" name="name" type="text" maxLength={120} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="fb-email" style={labelStyle}>
            Email <span style={{ color: C.textFaint, fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="fb-email"
            name="email"
            type="email"
            maxLength={200}
            placeholder="so I can follow up"
            style={inputStyle}
          />
        </div>
      </div>

      {status.kind === 'error' && (
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(200,120,85,0.08)',
            border: `1px solid rgba(200,120,85,0.3)`,
            borderRadius: 8,
            fontSize: '0.82rem',
            color: C.text,
            lineHeight: 1.5,
          }}
        >
          {status.message}
          {status.emailFallback && (
            <>
              {' '}
              <a href={MAILTO} style={{ color: C.gold, textDecoration: 'underline' }}>
                Email {EMAIL}
              </a>{' '}
              instead.
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '11px 24px',
            background: submitting ? 'transparent' : 'rgba(212,168,83,0.10)',
            border: `1px solid ${C.gold}`,
            borderRadius: 8,
            color: C.gold,
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            fontFamily: 'inherit',
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Sending…' : 'Send feedback'}
        </button>
        <span style={{ fontSize: '0.78rem', color: C.textFaint }}>
          Prefer email?{' '}
          <a href={MAILTO} style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>
            {EMAIL}
          </a>
        </span>
      </div>
    </form>
  )
}
