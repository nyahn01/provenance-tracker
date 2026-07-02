/**
 * /support — what's free (everything), how to support the work, and a
 * transparent note on where this could go.
 *
 * Replaces the old /pricing page (permanent redirect in next.config.js).
 * Rationale: € tier cards with disabled buttons over-claimed maturity — a real
 * user flagged it (issue #61) and the honesty contract agrees. Nothing is for
 * sale today, and this page says so plainly. The future-model prose stays,
 * clearly labeled, because building in the open includes the business idea.
 *
 * Static server component — design tokens match /learn and /about.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING as C } from '@/lib/design-tokens'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export const metadata: Metadata = {
  title: 'Support — Provenance Tracker',
  description:
    'Provenance Tracker is free and built in the open. How to support the research, follow new provenance stories, or send feedback.',
}

export default function SupportPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        a { text-decoration: none; }
      ` }} />

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-ui)', color: C.text }}>

        {/* Nav */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            ← Back to journeys
          </Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: '0.8rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Provenance Tracker · Support
          </span>
        </nav>

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 32px 100px' }}>

          {/* Hero */}
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 16 }}>
              Support
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 400, color: C.text, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.01em' }}>
              Free, built in the open
            </h1>
            <p style={{ fontSize: '1rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 560 }}>
              Everything on this site is free — the curated journeys, the restitution case
              study, the search across seven museum and archive APIs, the sourced custody
              chains with their honest gaps. Nothing is for sale, and there is no paywalled tier.
            </p>
          </div>

          {/* Support the work */}
          <section style={{
            background: 'rgba(212,168,83,0.04)',
            border: '1px solid rgba(212,168,83,0.18)',
            borderRadius: 10,
            padding: '28px 28px',
            marginBottom: 24,
          }}>
            <h2 style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 12 }}>
              Keep it going
            </h2>
            <p style={{ fontSize: '0.88rem', color: C.textMuted, lineHeight: 1.7, marginBottom: 20, maxWidth: 580 }}>
              A human is building this, one sourced chain at a time. If the work is useful —
              for teaching, research, or curiosity — a coffee genuinely helps, and feedback
              helps even more.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <a
                href="https://buymeacoffee.com/nyahn"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', background: 'rgba(212,168,83,0.08)',
                  border: '1px solid rgba(212,168,83,0.3)', borderRadius: 7,
                  color: C.gold, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em',
                }}
              >
                ☕ Support on Buy Me a Coffee
              </a>
              <Link
                href="/feedback"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', background: 'transparent',
                  border: `1px solid ${C.border}`, borderRadius: 7,
                  color: C.textMuted, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em',
                }}
              >
                ✉ Leave feedback
              </Link>
            </div>
          </section>

          {/* Newsletter */}
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '28px 28px',
            marginBottom: 24,
          }}>
            <h2 style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 14 }}>
              Follow the research
            </h2>
            <NewsletterSignup />
          </section>

          {/* Where this could go — transparent, explicitly not for sale */}
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '28px 28px',
            marginBottom: 56,
          }}>
            <h2 style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 12 }}>
              Where this could go
            </h2>
            <p style={{ fontSize: '0.88rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 580 }}>
              The same reconciled, gap-flagged data layer could one day serve researchers and
              institutions — provenance exports, an API, deeper dealer-archive coverage. That
              is an exploratory direction, not a product: <strong style={{ color: C.text, fontWeight: 600 }}>nothing
              is for sale today, and no paid tier exists.</strong> If the coverage and the audience
              ever justify it, it will be announced here first — and the public site stays free.
            </p>
          </section>

          {/* Footer nav */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <Link href="/" style={{ fontSize: '0.78rem', color: C.gold, fontWeight: 600, borderBottom: `1px solid ${C.gold}`, paddingBottom: 1 }}>
                Next: explore journeys →
              </Link>
              <span style={{ width: 1, height: 14, background: C.border }} />
              <Link href="/feedback" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Feedback
              </Link>
              <Link href="/impressum" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Legal notice
              </Link>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
