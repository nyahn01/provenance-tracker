/**
 * /pricing — Three-tier pricing page
 * Static server component — no client-side JS required.
 * Design tokens match /learn and /team exactly (src/lib/design-tokens.ts).
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING as C } from '@/lib/design-tokens'

export const metadata: Metadata = {
  title: 'Pricing — Provenance Tracker',
  description:
    'Three-tier access to provenance research: Explorer (free), Researcher (€99/mo), and Institution (€999/mo) for museums, auction houses, and restitution law firms.',
}

interface Tier {
  name: string
  price: string
  period?: string
  who: string
  features: string[]
  accent: string
  accentBg: string
  accentBorder: string
  highlight?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Explorer',
    price: 'Free',
    who: 'Public, students, art-curious',
    features: [
      'Curated provenance stories',
      'Globe visualization',
      'Provenance gap disclosure',
      'Source attribution (Met · AIC · Rijksmuseum)',
    ],
    accent: C.textMuted,
    accentBg: 'rgba(154,143,133,0.06)',
    accentBorder: 'rgba(154,143,133,0.22)',
  },
  {
    name: 'Researcher',
    price: '€99',
    period: '/mo',
    who: 'Art historians, journalists, educators',
    features: [
      'Everything in Explorer',
      'Getty Provenance Index (GPI) dealer records',
      'RKD Netherlands Art Institute data',
      'Confidence scoring on all events',
      'Export provenance timeline (JSON)',
      'API access (100 req/day)',
    ],
    accent: C.gold,
    accentBg: 'rgba(212,168,83,0.06)',
    accentBorder: 'rgba(212,168,83,0.28)',
    highlight: true,
  },
  {
    name: 'Institution',
    price: '€999',
    period: '/mo',
    who: 'Museums, auction houses, restitution law firms',
    features: [
      'Everything in Researcher',
      'Bulk provenance ingestion',
      'White-label reporting',
      'Custom gap analysis',
      'Priority restitution research queue',
      'Dedicated support + SLA',
      'Unlimited API access',
    ],
    accent: C.clay,
    accentBg: 'rgba(200,120,85,0.06)',
    accentBorder: 'rgba(200,120,85,0.28)',
  },
]

export default function PricingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        .tier-card { transition: border-color 0.2s, transform 0.2s; }
        .tier-card:hover { transform: translateY(-4px); }
        a { text-decoration: none; }
      ` }} />

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Pretendard Variable', Pretendard, system-ui, sans-serif", color: C.text }}>

        {/* Nav */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            ← Back to journeys
          </Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: '0.8rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Provenance Tracker · Pricing
          </span>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 32px 100px' }}>

          {/* Hero */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 16 }}>
              Pricing
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 300, color: C.text, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.01em' }}>
              Access built for<br />serious research
            </h1>
            <p style={{ fontSize: '1rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 560 }}>
              From the art-curious to restitution counsel — three tiers designed around
              the actual work of provenance research.
            </p>
          </div>

          {/* Public beta banner */}
          <div style={{
            background: 'rgba(212,168,83,0.04)',
            border: '1px solid rgba(212,168,83,0.18)',
            borderRadius: 10,
            padding: '24px 28px',
            marginBottom: 48,
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 12 }}>
              Early Access · Public Beta
            </div>
            <p style={{ fontSize: '0.88rem', color: C.textMuted, lineHeight: 1.7, marginBottom: 20, maxWidth: 580 }}>
              Provenance Tracker is being built in the open. Paid tiers are the roadmap —
              they represent the research depth we&apos;re actively adding source by source.
              For now the platform is entirely free. If it&apos;s useful, support the work or leave feedback below.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <a
                href="https://buymeacoffee.com/nyahn"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  background: 'rgba(212,168,83,0.08)',
                  border: '1px solid rgba(212,168,83,0.3)',
                  borderRadius: 7,
                  color: C.gold,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  textDecoration: 'none',
                }}
              >
                ☕ Support on Buy Me a Coffee
              </a>
              <Link
                href="/feedback"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 7,
                  color: C.textMuted,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  textDecoration: 'none',
                }}
              >
                ✉ Leave feedback
              </Link>
            </div>
          </div>

          {/* Pricing cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 56 }}>
            {TIERS.map(tier => (
              <div
                key={tier.name}
                className="tier-card"
                style={{
                  padding: '32px 28px',
                  background: tier.highlight ? tier.accentBg : C.surface,
                  border: `1px solid ${tier.highlight ? tier.accentBorder : C.border}`,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                }}
              >
                {/* Tier header */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tier.accent, marginBottom: 10 }}>
                    {tier.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8 }}>
                    <span style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', fontWeight: 300, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span style={{ fontSize: '0.85rem', color: C.textMuted, marginLeft: 2 }}>{tier.period}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.4 }}>
                    {tier.who}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: '100%', height: 1, background: tier.highlight ? tier.accentBorder : C.border, marginBottom: 20 }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 28 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.82rem', color: C.textMuted, lineHeight: 1.4 }}>
                      <span style={{ color: tier.accent, flexShrink: 0, fontSize: '0.75rem', marginTop: '0.1em' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    background: tier.highlight ? tier.accentBg : 'transparent',
                    border: `1px solid ${tier.accentBorder}`,
                    borderRadius: 8,
                    color: tier.accent,
                    fontFamily: "'Pretendard Variable', Pretendard, system-ui, sans-serif",
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    cursor: 'not-allowed',
                    opacity: 0.8,
                  }}
                >
                  Coming soon
                </button>
              </div>
            ))}
          </div>

          {/* Footnote */}
          <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: '0 16px' }}>
            <p style={{ fontSize: '0.8rem', color: C.textFaint, fontStyle: 'italic', lineHeight: 1.6 }}>
              Restitution clients are the anchor segment.
            </p>
            <p style={{ fontSize: '0.75rem', color: C.textFaint, marginTop: 8, lineHeight: 1.6 }}>
              Pricing reflects the value of documented custody chains in legal restitution proceedings.
              Museum and law firm access is priced at institutional license rates.
            </p>
            <p style={{ fontSize: '0.75rem', color: C.textFaint, marginTop: 16, lineHeight: 1.6 }}>
              In the meantime —{' '}
              <a
                href="https://buymeacoffee.com/nyahn"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: C.gold, textDecoration: 'none', borderBottom: ' 1px solid rgba(212,168,83,0.3)' }}
              >
                support the work on Buy Me a Coffee
              </a>
              {' '}and{' '}
              <Link
                href="/feedback"
                style={{ color: C.textMuted, textDecoration: 'none', borderBottom: `1px solid ${C.border}` }}
              >
                send feedback
              </Link>
              .
            </p>
          </div>

          {/* Footer nav */}
          <div style={{ marginTop: 80, borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link href="/demo" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Our story →
              </Link>
              <Link href="/learn" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Provenance glossary →
              </Link>
              <Link href="/team" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                How the platform works →
              </Link>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
