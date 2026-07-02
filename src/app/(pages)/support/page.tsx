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
 * Static server component — shell (bg/font/nav/footer) comes from the (pages)
 * layout; column + typography from the '@/components/ui' primitives.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING as C } from '@/lib/design-tokens'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { PageShell, Eyebrow, DisplayHeading, Prose, Card, CTALink } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Support — Provenance Tracker',
  description:
    'Provenance Tracker is free and built in the open. How to support the research, follow new provenance stories, or send feedback.',
}

export default function SupportPage() {
  return (
    <PageShell width={760}>

      {/* Hero */}
      <div style={{ marginBottom: 56 }}>
        <Eyebrow>Support</Eyebrow>
        <DisplayHeading size="hero">Free, built in the open</DisplayHeading>
        <Prose maxWidth={560}>
          Everything on this site is free — the curated journeys, the restitution case
          study, the search across seven museum and archive APIs, the sourced custody
          chains with their honest gaps. Nothing is for sale, and there is no paywalled tier.
        </Prose>
      </div>

      {/* Support the work — gold-tinted panel, intentionally not the standard Card surface */}
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
        <Prose size="0.88rem" maxWidth={580} marginBottom={20}>
          A human is building this, one sourced chain at a time. If the work is useful —
          for teaching, research, or curiosity — a coffee genuinely helps, and feedback
          helps even more.
        </Prose>
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
              textDecoration: 'none',
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
              textDecoration: 'none',
            }}
          >
            ✉ Leave feedback
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <Card padding="28px 28px" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 14 }}>
          Follow the research
        </h2>
        <NewsletterSignup />
      </Card>

      {/* Where this could go — transparent, explicitly not for sale */}
      <Card padding="28px 28px" style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 12 }}>
          Where this could go
        </h2>
        <Prose size="0.88rem" maxWidth={580}>
          The same reconciled, gap-flagged data layer could one day serve researchers and
          institutions — provenance exports, an API, deeper dealer-archive coverage. That
          is an exploratory direction, not a product: <strong style={{ color: C.text, fontWeight: 600 }}>nothing
          is for sale today, and no paid tier exists.</strong> If the coverage and the audience
          ever justify it, it will be announced here first — and the public site stays free.
        </Prose>
      </Card>

      {/* Footer nav */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <CTALink href="/" tone="gold">Next: explore journeys →</CTALink>
          <span style={{ width: 1, height: 14, background: C.border }} />
          <CTALink href="/feedback" size="0.72rem">Feedback</CTALink>
          <CTALink href="/impressum" size="0.72rem">Legal notice</CTALink>
        </div>
      </div>

    </PageShell>
  )
}
