/**
 * /feedback — in-app feedback form page.
 * Static marketing-page shell (matches /support, /learn); the form itself is a
 * client component. Submissions file a labeled GitHub issue via /api/feedback,
 * with an email fallback when the service is unavailable.
 * Shell (bg/font/nav/footer) comes from the (pages) layout.
 */

import type { Metadata } from 'next'
import FeedbackForm from '@/components/FeedbackForm'
import { MARKETING as C } from '@/lib/design-tokens'
import { PageShell, Eyebrow, Prose } from '@/components/ui'

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
      {/* Form-control rules FeedbackForm's inputs rely on (page-specific — not in globals.css). */}
      <style>{`
        textarea::placeholder, input::placeholder { color: ${C.textFaint}; }
        select:focus, textarea:focus, input:focus { border-color: ${C.gold} !important; }
      `}</style>

      <PageShell width={680}>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <Eyebrow>Public Beta</Eyebrow>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: C.text, lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.01em' }}>
            Help shape Provenance Tracker
          </h1>
          <Prose size="0.95rem">
            This platform is being built in the open. A bug, a missing work, a data
            correction, or an idea — it all helps. Every submission is reviewed.
          </Prose>
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
              textDecoration: 'none',
            }}>
              Email {EMAIL} →
            </a>
          </div>
        )}

        <FeedbackForm />

      </PageShell>
    </>
  )
}
