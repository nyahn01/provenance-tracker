/**
 * /feedback — in-app feedback form page.
 * Static marketing-page shell (matches /pricing, /learn); the form itself is a
 * client component. Submissions file a labeled GitHub issue via /api/feedback,
 * with an email fallback when the service is unavailable.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import FeedbackForm from '@/components/FeedbackForm'
import { MARKETING as C } from '@/lib/design-tokens'

export const metadata: Metadata = {
  title: 'Feedback — Provenance Tracker',
  description:
    'Share feedback, report a bug, suggest a feature, or flag a data correction. Provenance Tracker is in public beta — your input shapes what gets built next.',
}

const EMAIL = 'ahn.ny01@gmail.com'
const MAILTO = `mailto:${EMAIL}?subject=Provenance%20Tracker%20feedback`

export default function FeedbackPage() {
  // Server-side check: if GITHUB_TOKEN is not configured in this environment,
  // the /api/feedback route will return 503. Surface this proactively so users
  // don't fill out the form and then hit an error.
  const issueFilingAvailable = !!process.env.GITHUB_TOKEN

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        a { text-decoration: none; }
        textarea::placeholder, input::placeholder { color: ${C.textFaint}; }
        select:focus, textarea:focus, input:focus { border-color: ${C.gold} !important; }
      ` }} />

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-ui)', color: C.text }}>

        {/* Nav */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            ← Back to journeys
          </Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: '0.8rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Provenance Tracker · Feedback
          </span>
        </nav>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 32px 100px' }}>

          {/* Hero */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 16 }}>
              Public Beta
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: C.text, lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.01em' }}>
              Help shape Provenance Tracker
            </h1>
            <p style={{ fontSize: '0.95rem', color: C.textMuted, lineHeight: 1.7 }}>
              This platform is being built in the open. A bug, a missing work, a data
              correction, or an idea — it all helps. Every submission is reviewed.
            </p>
          </div>

          {/* Proactive email banner when issue-filing backend is not yet configured */}
          {!issueFilingAvailable && (
            <div style={{
              marginBottom: 28,
              padding: '16px 20px',
              background: 'rgba(212,168,83,0.06)',
              border: `1px solid rgba(212,168,83,0.24)`,
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div style={{ fontSize: '0.8rem', color: C.text, lineHeight: 1.55 }}>
                The in-app form isn&apos;t wired to the issue tracker in this environment yet.
                The fastest way to reach me is directly by email — I read every message.
              </div>
              <a href={MAILTO} style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                padding: '8px 16px',
                background: 'rgba(212,168,83,0.10)',
                border: `1px solid rgba(212,168,83,0.35)`,
                borderRadius: 7,
                color: C.gold,
                fontSize: '0.82rem',
                fontWeight: 600,
              }}>
                Email {EMAIL} →
              </a>
            </div>
          )}

          <FeedbackForm />

        </div>
      </main>
    </>
  )
}
