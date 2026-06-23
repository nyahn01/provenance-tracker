/**
 * /feedback — in-app feedback form page.
 * Static marketing-page shell (matches /pricing, /learn); the form itself is a
 * client component. Submissions file a labeled GitHub issue via /api/feedback,
 * with an email fallback when the service is unavailable.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import FeedbackForm from '@/components/FeedbackForm'

export const metadata: Metadata = {
  title: 'Feedback — Provenance Tracker',
  description:
    'Share feedback, report a bug, suggest a feature, or flag a data correction. Provenance Tracker is in public beta — your input shapes what gets built next.',
}

const C = {
  bg: '#0a0908',
  border: '#2a2218',
  text: '#f6f1e8',
  textMuted: '#9a8f85',
  textFaint: '#5a5248',
  gold: '#d4a853',
}

export default function FeedbackPage() {
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

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Pretendard Variable', Pretendard, system-ui, sans-serif", color: C.text }}>

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
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 300, color: C.text, lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.01em' }}>
              Help shape Provenance Tracker
            </h1>
            <p style={{ fontSize: '0.95rem', color: C.textMuted, lineHeight: 1.7 }}>
              This platform is being built in the open. A bug, a missing work, a data
              correction, or an idea — it all helps. Every submission is reviewed.
            </p>
          </div>

          <FeedbackForm />

        </div>
      </main>
    </>
  )
}
