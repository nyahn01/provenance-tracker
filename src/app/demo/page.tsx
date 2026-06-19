/**
 * /demo — Scrollytelling origin & vision page
 * Client component — uses IntersectionObserver for scroll animations.
 * No external animation libraries. Pure CSS transitions.
 * Design tokens: draft/CLAUDE.md (exact hex values)
 */

'use client'

import Link from 'next/link'
import { useEffect, useRef, type ReactNode } from 'react'
import type { CSSProperties } from 'react'

// Design tokens — exact values from draft/CLAUDE.md
const C = {
  bg:          '#0a0908',
  surface:     '#111010',
  surface2:    '#161413',
  border:      '#2a2218',
  borderMid:   '#3a3028',
  text:        '#f6f1e8',
  textMuted:   '#9a8f85',
  textFaint:   '#5a5248',
  gold:        '#d4a853',
  sage:        '#6f8d7d',
  clay:        '#c87855',
}

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────

interface RevealProps {
  children: ReactNode
  delay?: number
  style?: CSSProperties
  className?: string
}

function Reveal({ children, delay = 0, style, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              if (el) {
                el.style.opacity = '1'
                el.style.transform = 'translateY(0)'
              }
            }, delay)
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: 'translateY(32px)',
        transition: 'opacity 600ms ease-out, transform 600ms ease-out',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

interface SectionProps {
  children: ReactNode
  accent?: string
  id?: string
}

function Section({ children, accent, id }: SectionProps) {
  return (
    <section
      id={id}
      style={{
        padding: 'clamp(64px, 10vw, 120px) clamp(24px, 6vw, 80px)',
        maxWidth: 860,
        margin: '0 auto',
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {accent && (
        <div
          style={{
            width: 40,
            height: 2,
            background: accent,
            marginBottom: 32,
            borderRadius: 1,
          }}
        />
      )}
      {children}
    </section>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  number: string
  label: string
  detail: string
  delay: number
}

function StatCard({ number, label, detail, delay }: StatCardProps) {
  return (
    <Reveal delay={delay}>
      <div
        style={{
          padding: '24px 28px',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          background: C.surface,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            fontWeight: 400,
            color: C.gold,
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          {number}
        </div>
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: C.text,
            marginBottom: 4,
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: '0.74rem', color: C.textMuted, lineHeight: 1.5 }}>
          {detail}
        </div>
      </div>
    </Reveal>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        a { text-decoration: none; }
        .demo-cta:hover { opacity: 0.85 !important; }
        .demo-cta-ghost:hover { border-color: ${C.textMuted} !important; color: ${C.text} !important; }
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0.01ms !important; }
        }
      `}} />

      <main
        style={{
          minHeight: '100vh',
          background: C.bg,
          fontFamily: "'Pretendard Variable', Pretendard, system-ui, sans-serif",
          color: C.text,
        }}
      >
        {/* ── Nav ── */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: C.bg,
            borderBottom: `1px solid ${C.border}`,
            padding: '14px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Link href="/" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            ← Back to journeys
          </Link>
          <span style={{ color: C.border }}>|</span>
          <span
            style={{
              fontSize: '0.8rem',
              color: C.textFaint,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Provenance Tracker · Story
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
            <Link
              href="/learn"
              style={{ fontSize: '0.78rem', color: C.textMuted, letterSpacing: '0.02em' }}
            >
              Glossary
            </Link>
            <Link
              href="/pricing"
              style={{ fontSize: '0.78rem', color: C.textMuted, letterSpacing: '0.02em' }}
            >
              Pricing
            </Link>
            <Link
              href="/team"
              style={{ fontSize: '0.78rem', color: C.textMuted, letterSpacing: '0.02em' }}
            >
              Team
            </Link>
          </div>
        </nav>

        {/* ── Hero label ── */}
        <div
          style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: 'clamp(48px, 8vw, 96px) clamp(24px, 6vw, 80px) 0',
          }}
        >
          <Reveal>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: C.clay,
                marginBottom: 20,
              }}
            >
              The origin story
            </div>
          </Reveal>
        </div>

        {/* ────────────────────────────────────────────────────────────────────
            Section 1 — Origin
        ──────────────────────────────────────────────────────────────────── */}
        <Section id="origin" accent={C.clay}>
          <Reveal>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
                fontWeight: 400,
                color: C.text,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                marginBottom: 32,
              }}
            >
              A gift for a curator
            </h1>
          </Reveal>

          <Reveal delay={80}>
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                color: C.textMuted,
                lineHeight: 1.8,
                maxWidth: 620,
              }}
            >
              A friend debuted curating at the National Gallery, London. His dream: curate all 10 great
              museums — Louvre, Hermitage, Uffizi, Prado. He&apos;d travel between cities and say:{' '}
              <em style={{ color: C.text, fontStyle: 'italic' }}>
                &ldquo;that painting was here last time — where did it go?&rdquo;
              </em>{' '}
              This platform began as an answer to that question.
            </p>
          </Reveal>
        </Section>

        {/* ────────────────────────────────────────────────────────────────────
            Section 2 — The Problem
        ──────────────────────────────────────────────────────────────────── */}
        <Section id="problem" accent={C.textFaint}>
          <Reveal>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.textFaint,
                marginBottom: 16,
              }}
            >
              02 &mdash; The problem
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                fontWeight: 400,
                color: C.text,
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                marginBottom: 32,
              }}
            >
              What nobody tracks
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)',
                color: C.textMuted,
                lineHeight: 1.8,
                maxWidth: 620,
              }}
            >
              Art appreciates with documented provenance. Unlike electronics, a painting with a clean,
              verified chain of custody is worth more — to insurers, to auction houses, to heirs. But no
              tool shows you the full journey. Museum records stop at acquisition. Dealer records are buried
              in archives. Gaps are hidden, not shown.
            </p>
          </Reveal>
        </Section>

        {/* ────────────────────────────────────────────────────────────────────
            Section 3 — The Product
        ──────────────────────────────────────────────────────────────────── */}
        <Section id="product" accent={C.gold}>
          <Reveal>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.textFaint,
                marginBottom: 16,
              }}
            >
              03 &mdash; The product
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                fontWeight: 400,
                color: C.text,
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                marginBottom: 32,
              }}
            >
              The hidden journey,<br />made visible
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)',
                color: C.textMuted,
                lineHeight: 1.8,
                maxWidth: 620,
                marginBottom: 48,
              }}
            >
              Pick any work. The globe draws the custody chain &mdash;{' '}
              <span style={{ color: C.gold }}>gold arcs for ownership</span>,{' '}
              <span style={{ color: C.sage }}>sage for exhibition loans</span>, amber for dealer trails
              from the Getty Provenance Index. The sidebar merges records from the Met, Art Institute,
              Rijksmuseum, Wikidata, and the Knoedler stock books into one dated timeline. Gaps are shown,
              never invented.
            </p>
          </Reveal>

          {/* Stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            <StatCard
              number="5"
              label="Live data sources"
              detail="Met · AIC · Rijksmuseum · Wikidata · Getty GPI"
              delay={0}
            />
            <StatCard
              number="4,388"
              label="Dealer records"
              detail="Knoedler & Goupil & Cie combined"
              delay={120}
            />
            <StatCard
              number="Gaps shown honestly"
              label="Never filled, always flagged"
              detail="Provenance gap — help complete it"
              delay={240}
            />
          </div>
        </Section>

        {/* ────────────────────────────────────────────────────────────────────
            Section 4 — The Agent Team
        ──────────────────────────────────────────────────────────────────── */}
        <Section id="agents" accent={C.sage}>
          <Reveal>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.textFaint,
                marginBottom: 16,
              }}
            >
              04 &mdash; How it&apos;s built
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                fontWeight: 400,
                color: C.text,
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                marginBottom: 32,
              }}
            >
              Agents that work<br />while you sleep
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)',
                color: C.textMuted,
                lineHeight: 1.8,
                maxWidth: 620,
                marginBottom: 32,
              }}
            >
              This was the first project built with a full AI agent team. 7 specialist agents &mdash;
              art historian, data integrator, globe engineer, strategy director, story writer, honesty
              reviewer &mdash; work in parallel overnight. Every commit passes a credibility gate: no
              invented data, no custody-as-loan conflation, no faked coordinates. The honesty gate blocks
              the commit if anything fails.
            </p>
          </Reveal>

          <Reveal delay={160}>
            <div
              style={{
                display: 'inline-block',
                padding: '8px 14px',
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: '0.75rem',
                color: C.textFaint,
                fontFamily: "'Courier New', monospace",
                letterSpacing: '0.02em',
              }}
            >
              Built with Claude agent team on Max.
            </div>
          </Reveal>
        </Section>

        {/* ────────────────────────────────────────────────────────────────────
            Section 5 — Vision
        ──────────────────────────────────────────────────────────────────── */}
        <Section id="vision">
          <Reveal>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.textFaint,
                marginBottom: 16,
              }}
            >
              05 &mdash; Vision
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                fontWeight: 400,
                color: C.text,
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                marginBottom: 32,
              }}
            >
              Beyond Western museums
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <div style={{ marginBottom: 24 }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1rem, 2.2vw, 1.3rem)',
                  color: C.text,
                  fontStyle: 'italic',
                  display: 'block',
                  marginBottom: 12,
                }}
              >
                직지심체요절
              </span>
              <p
                style={{
                  fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)',
                  color: C.textMuted,
                  lineHeight: 1.8,
                  maxWidth: 620,
                }}
              >
                The Jikji, printed in 1377, is the world&apos;s oldest surviving metal-type book. It sits
                today in the Biblioth&egrave;que nationale de France in Paris. It has never returned to
                Korea. This platform could one day be the place where that journey is documented, disputed,
                and understood. Art lost under colonialism deserves the same rigor as a Monet.
              </p>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div
              style={{
                borderLeft: `2px solid ${C.clay}`,
                paddingLeft: 24,
                marginTop: 40,
                marginBottom: 56,
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: C.text,
                  lineHeight: 1.5,
                }}
              >
                Provenance is not just history. It is evidence.
              </p>
            </div>
          </Reveal>

          {/* CTA buttons */}
          <Reveal delay={240}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link
                href="/"
                className="demo-cta"
                style={{
                  display: 'inline-block',
                  padding: '13px 28px',
                  background: C.clay,
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  transition: 'opacity 0.2s',
                }}
              >
                Explore the collection &rarr;
              </Link>
              <Link
                href="/learn"
                className="demo-cta-ghost"
                style={{
                  display: 'inline-block',
                  padding: '13px 28px',
                  border: `1px solid ${C.border}`,
                  color: C.textMuted,
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
              >
                How the data works &rarr;
              </Link>
            </div>
          </Reveal>
        </Section>

        {/* ── Footer ── */}
        <div
          style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: '40px clamp(24px, 6vw, 80px) 80px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ fontSize: '0.72rem', color: C.textFaint }}>
            Sources: Wikidata &middot; Met &middot; AIC &middot; Rijksmuseum &middot; Getty GPI
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link
              href="/demo/source"
              style={{
                fontSize: '0.72rem',
                color: C.textMuted,
                borderBottom: `1px solid ${C.border}`,
                paddingBottom: 1,
              }}
            >
              Source doc &rarr;
            </Link>
            <Link
              href="/pricing"
              style={{
                fontSize: '0.72rem',
                color: C.textMuted,
                borderBottom: `1px solid ${C.border}`,
                paddingBottom: 1,
              }}
            >
              Pricing &rarr;
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
