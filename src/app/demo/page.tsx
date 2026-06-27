'use client'

import Link from 'next/link'
import { useEffect, useRef, type ReactNode } from 'react'
import type { CSSProperties } from 'react'
import { MARKETING as C } from '@/lib/design-tokens'

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────

interface RevealProps { children: ReactNode; delay?: number; style?: CSSProperties }

function Reveal({ children, delay = 0, style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              if (el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)' }
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
    <div ref={ref} style={{ opacity: 0, transform: 'translateY(32px)', transition: 'opacity 600ms ease-out, transform 600ms ease-out', ...style }}>
      {children}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ children, accent, id }: { children: ReactNode; accent?: string; id?: string }) {
  return (
    <section id={id} style={{ padding: 'clamp(64px, 10vw, 120px) clamp(24px, 6vw, 80px)', maxWidth: 860, margin: '0 auto', borderBottom: `1px solid ${C.border}` }}>
      {accent && <div style={{ width: 40, height: 2, background: accent, marginBottom: 32, borderRadius: 1 }} />}
      {children}
    </section>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ number, label, detail, delay }: { number: string; label: string; detail: string; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div style={{ padding: '24px 28px', border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface, minWidth: 0 }}>
        <div style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 300, color: C.gold, lineHeight: 1, marginBottom: 8, letterSpacing: '-0.02em' }}>
          {number}
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: C.text, marginBottom: 4, letterSpacing: '0.01em' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.74rem', color: C.textMuted, lineHeight: 1.5 }}>{detail}</div>
      </div>
    </Reveal>
  )
}

// ─── Section number label ─────────────────────────────────────────────────────

function SectionLabel({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 16 }}>
      {number} &mdash; {title}
    </div>
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
        sup { font-size: 0.6em; vertical-align: super; color: ${C.textFaint}; margin-left: 1px; }
        .footnote { font-size: 0.68rem; color: ${C.textFaint}; margin-top: 10px; line-height: 1.5; }
        @media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; } }
      `}} />

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-ui)', color: C.text }}>

        {/* ── Nav ── */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>← Back to journeys</Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: '0.8rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Provenance Tracker · Story</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
            <Link href="/learn" style={{ fontSize: '0.78rem', color: C.textMuted }}>Glossary</Link>
            <Link href="/pricing" style={{ fontSize: '0.78rem', color: C.textMuted }}>Pricing</Link>
            <Link href="/team" style={{ fontSize: '0.78rem', color: C.textMuted }}>Team</Link>
          </div>
        </nav>

        {/* ── Hero label ── */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) clamp(24px, 6vw, 80px) 0' }}>
          <Reveal>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.clay, marginBottom: 20 }}>
              The origin story
            </div>
          </Reveal>
        </div>

        {/* ────────────────────────────────────────────────────────────────────
            Section 1 — Origin
        ──────────────────────────────────────────────────────────────────── */}
        <Section id="origin" accent={C.clay}>
          <Reveal>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 5.5vw, 4rem)', fontWeight: 400, color: C.text, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 32 }}>
              A gift for a curator
            </h1>
          </Reveal>
          <Reveal delay={80}>
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: C.textMuted, lineHeight: 1.8, maxWidth: 620 }}>
              A friend debuted curating at the National Gallery, London. His dream: curate all the
              great museums — the Louvre, the National Gallery, and beyond. He&apos;d travel between
              cities and say:{' '}
              <em style={{ color: C.text, fontStyle: 'italic' }}>
                &ldquo;that painting was here last time — where did it go?&rdquo;
              </em>{' '}
              This platform began as an answer to that question.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <p style={{ fontSize: 'clamp(0.9rem, 1.7vw, 1rem)', color: C.textFaint, lineHeight: 1.75, maxWidth: 560, marginTop: 24 }}>
              Built by a data professional working in insurance — someone who understood that
              unlike electronics, art <em>appreciates</em> with documented provenance. Inspired by
              FlightRadar24: invisible journeys, made legible to anyone with a browser.
            </p>
          </Reveal>
        </Section>

        {/* ────────────────────────────────────────────────────────────────────
            Section 2 — The Problem
        ──────────────────────────────────────────────────────────────────── */}
        <Section id="problem" accent={C.textFaint}>
          <Reveal>
            <SectionLabel number="02" title="The problem" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 400, color: C.text, lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: 32 }}>
              What nobody tracks
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)', color: C.textMuted, lineHeight: 1.8, maxWidth: 620 }}>
              Museum records stop at acquisition. Dealer records are buried in archives. Exhibition
              loans are conflated with ownership. Gaps are hidden, not shown. Yet a documented
              custody chain can determine the outcome of a restitution claim — or the hammer price
              at auction.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <p style={{ fontSize: 'clamp(0.9rem, 1.7vw, 1rem)', color: C.textFaint, lineHeight: 1.75, maxWidth: 560, marginTop: 24 }}>
              The Washington Principles on Nazi-Confiscated Art (1998) obligate 44 signatory
              countries to identify ownership gaps between 1933 and 1945. No public tool shows
              those gaps clearly and honestly. This one does.
            </p>
          </Reveal>
        </Section>

        {/* ────────────────────────────────────────────────────────────────────
            Section 3 — The Product
        ──────────────────────────────────────────────────────────────────── */}
        <Section id="product" accent={C.gold}>
          <Reveal>
            <SectionLabel number="03" title="The product" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 400, color: C.text, lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: 32 }}>
              The hidden journey,<br />made visible
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <p style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)', color: C.textMuted, lineHeight: 1.8, maxWidth: 620, marginBottom: 36 }}>
              Pick any work. The globe draws the custody chain. The sidebar merges records from
              five sources into one dated timeline, each entry stamped with its source. Each gap
              is shown — never filled.
            </p>
          </Reveal>

          {/* Arc legend */}
          <Reveal delay={100}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 40, padding: '16px 20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              {[
                { color: C.gold,               label: 'Custody transfer',  sub: 'Legal title changed — ownership arc' },
                { color: C.sage,               label: 'Exhibition loan',   sub: 'Temporary move — title unchanged' },
                { color: 'rgba(180,130,60,1)', label: 'Dealer trail',      sub: 'Getty Provenance Index transaction' },
              ].map(({ color, label, sub }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'inline-block', width: 28, height: 2, background: color, borderRadius: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{label}</div>
                    <div style={{ fontSize: '0.67rem', color: C.textFaint, lineHeight: 1.3 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Data-flow diagram */}
          <Reveal delay={140}>
            <div style={{ marginBottom: 44 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 14 }}>
                How 5 sources become one timeline
              </div>
              <svg viewBox="0 0 680 104" width="100%" style={{ maxWidth: 680, display: 'block', overflow: 'visible' }}>
                {[
                  { x: 60,  label: 'Met',      sub: 'Open API' },
                  { x: 157, label: 'AIC',      sub: 'Open API' },
                  { x: 254, label: 'Rijks',    sub: 'Linked Art' },
                  { x: 351, label: 'Wikidata', sub: 'SPARQL' },
                  { x: 448, label: 'GPI',      sub: 'CC0 CSV' },
                ].map(({ x, label, sub }) => (
                  <g key={label}>
                    <rect x={x - 40} y={4} width={80} height={38} rx={6}
                      fill={C.surface} stroke={C.border} strokeWidth={1} />
                    <text x={x} y={20} textAnchor="middle" fill={C.textMuted} fontSize={9.5} fontWeight={600} style={{ fontFamily: 'inherit' }}>{label}</text>
                    <text x={x} y={33} textAnchor="middle" fill={C.textFaint} fontSize={7.5} style={{ fontFamily: 'inherit' }}>{sub}</text>
                    <line x1={x} y1={42} x2={x} y2={56} stroke={C.border} strokeWidth={1} />
                    <line x1={x} y1={56} x2={578} y2={76} stroke={C.borderMid} strokeWidth={0.8} strokeDasharray="3,2.5" />
                  </g>
                ))}
                {/* Merge/timeline node */}
                <rect x={534} y={66} width={88} height={32} rx={6}
                  fill="rgba(212,168,83,0.08)" stroke={C.gold} strokeWidth={1} />
                <text x={578} y={80} textAnchor="middle" fill={C.gold} fontSize={9.5} fontWeight={700} style={{ fontFamily: 'inherit' }}>Timeline</text>
                <text x={578} y={91} textAnchor="middle" fill={C.textFaint} fontSize={7.5} style={{ fontFamily: 'inherit' }}>normalised · sorted</text>
              </svg>
              <p style={{ fontSize: '0.68rem', color: C.textFaint, marginTop: 10, lineHeight: 1.55, maxWidth: 580 }}>
                Each API returns a different JSON schema. All records are normalised to a shared{' '}
                <code style={{ fontFamily: 'monospace', fontSize: '0.9em', color: C.textMuted }}>ProvenanceEvent</code>{' '}
                interface, geocoded, deduplicated by year and event type, confidence-scored,
                and sorted chronologically into one timeline.
              </p>
            </div>
          </Reveal>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <StatCard number="5" label="Live data sources" detail="Met · AIC · Rijksmuseum · Wikidata · Getty GPI" delay={0} />
            <StatCard number="4,388" label="Dealer records indexed" detail="Knoedler (1872–1970) + Goupil & Cie (1846–1919) · CC0" delay={120} />
            <StatCard number="100,000+" label="WWII-era works unresolved" detail="Art Loss Register estimate · Washington Principles 1998" delay={240} />
          </div>
        </Section>

        {/* ────────────────────────────────────────────────────────────────────
            Section 4 — The Agent Team
        ──────────────────────────────────────────────────────────────────── */}
        <Section id="agents" accent={C.sage}>
          <Reveal>
            <SectionLabel number="04" title="How it's built" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 400, color: C.text, lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: 32 }}>
              Agents that work<br />while you sleep
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)', color: C.textMuted, lineHeight: 1.8, maxWidth: 620, marginBottom: 32 }}>
              This was the first project built with a full AI agent team. 7 specialist agents
              work in parallel overnight. Every commit passes a credibility gate: no invented data,
              no custody-as-loan conflation, no faked coordinates. The honesty gate blocks the
              commit if anything fails.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
              {[
                { label: 'art-historian',        color: C.gold },
                { label: 'provenance-data',      color: C.sage },
                { label: 'provenance-globe',     color: C.clay },
                { label: 'provenance-strategy',  color: C.textMuted },
                { label: 'provenance-story',     color: C.textMuted },
                { label: 'design-director',      color: C.textMuted },
                { label: 'honesty-review ★',     color: C.gold },
              ].map(({ label, color }) => (
                <div key={label} style={{ padding: '6px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: '0.72rem', color, fontFamily: "'Courier New', monospace", background: C.surface }}>
                  {label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div style={{ display: 'inline-block', padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: '0.75rem', color: C.textFaint, fontFamily: "'Courier New', monospace" }}>
              Built with Claude agent team on Max.
            </div>
          </Reveal>
        </Section>

        {/* ────────────────────────────────────────────────────────────────────
            Section 5 — Vision
        ──────────────────────────────────────────────────────────────────── */}
        <Section id="vision">
          <Reveal>
            <SectionLabel number="05" title="Vision" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 400, color: C.text, lineHeight: 1.15, letterSpacing: '-0.01em', marginBottom: 32 }}>
              Beyond Western museums
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.2vw, 1.3rem)', color: C.text, fontStyle: 'italic', display: 'block', marginBottom: 12 }}>
                직지심체요절
              </span>
              <p style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)', color: C.textMuted, lineHeight: 1.8, maxWidth: 620 }}>
                The Jikji, printed in 1377, is the world&apos;s oldest surviving metal-type
                book<sup>²</sup> — predating Gutenberg&apos;s Bible by 78 years. It sits today
                in the Biblioth&egrave;que nationale de France in Paris. It has never returned
                to Korea. This platform could one day be the place where that journey is
                documented, disputed, and understood. Art lost under colonialism deserves the
                same rigour as a Monet with a WWII gap.
              </p>
              <p className="footnote">
                ² UNESCO Memory of the World register, 2001 · BnF catalogue ref. Coréen 109
              </p>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div style={{ borderLeft: `2px solid ${C.clay}`, paddingLeft: 24, marginTop: 40, marginBottom: 56 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 400, fontStyle: 'italic', color: C.text, lineHeight: 1.5 }}>
                Provenance is not just history. It is evidence.
              </p>
            </div>
          </Reveal>
          <Reveal delay={240}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/" className="demo-cta" style={{ display: 'inline-block', padding: '13px 28px', background: C.clay, color: '#fff', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.03em', transition: 'opacity 0.2s' }}>
                Explore the collection &rarr;
              </Link>
              <Link href="/learn" className="demo-cta-ghost" style={{ display: 'inline-block', padding: '13px 28px', border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 8, fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.02em', transition: 'border-color 0.2s, color 0.2s' }}>
                How the data works &rarr;
              </Link>
            </div>
          </Reveal>
        </Section>

        {/* ── Footer ── */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px clamp(24px, 6vw, 80px) 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: '0.72rem', color: C.textFaint }}>
            Sources: Met · AIC · Rijksmuseum · Wikidata · Getty GPI · BnF · Art Loss Register
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/demo/source" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
              Full source doc &rarr;
            </Link>
            <Link href="/pricing" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
              Pricing &rarr;
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
