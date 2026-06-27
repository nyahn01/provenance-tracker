/**
 * /case/[slug] — Restitution case-study deep-dive.
 *
 * Renders ONE documented restitution chain end-to-end. Static server component
 * (no client JS). Every fact carries a visible source line; gaps are shown as
 * gaps; ownership (custody) is kept strictly separate from exhibition loans.
 *
 * Honesty rules live in src/lib/case-studies.ts and are enforced by the data
 * shape (CaseSource required on every entry). No live "on view" claims.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MARKETING as C } from '@/lib/design-tokens'
import { getCase, allCaseSlugs } from '@/lib/case-studies'
import type { CaseSource, CaseCustodyEntry } from '@/lib/types'

export function generateStaticParams() {
  return allCaseSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const c = getCase(slug)
  if (!c) return { title: 'Case study not found — Provenance Tracker' }
  return {
    title: `${c.title} — Restitution case study — Provenance Tracker`,
    description: c.summary.slice(0, 180),
  }
}

// Visual treatment per custody-entry kind. Colors come ONLY from design tokens.
const KIND_STYLE: Record<
  CaseCustodyEntry['kind'],
  { dot: string; label: string; tint: string }
> = {
  custody: { dot: C.gold, label: 'Custody', tint: 'rgba(212,168,83,0.10)' },
  coerced: { dot: C.clay, label: 'Coerced transfer', tint: 'rgba(200,120,85,0.10)' },
  gap: { dot: C.gap, label: 'Gap', tint: 'rgba(154,143,133,0.08)' },
  restitution: { dot: C.sage, label: 'Restitution', tint: 'rgba(111,141,125,0.10)' },
}

function SourceLine({ sources }: { sources: CaseSource[] }) {
  return (
    <div className="src-line">
      <span className="src-tag">Source</span>
      {sources.map((s, i) => (
        <span key={i} className="src-item">
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ) : (
            <span>{s.label}</span>
          )}
          {i < sources.length - 1 ? <span className="src-sep"> · </span> : null}
        </span>
      ))}
    </div>
  )
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const c = getCase(slug)
  if (!c) notFound()

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        a { text-decoration: none; }
        .src-line { margin-top: 12px; font-size: 0.72rem; color: ${C.textFaint}; line-height: 1.5; }
        .src-tag { display: inline-block; font-size: 0.58rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${C.textFaint}; border: 1px solid ${C.border}; border-radius: 3px; padding: 1px 5px; margin-right: 8px; vertical-align: middle; }
        .src-item a { color: ${C.textMuted}; border-bottom: 1px solid ${C.border}; }
        .src-item a:hover { color: ${C.text}; border-bottom-color: ${C.borderMid}; }
        .src-sep { color: ${C.textFaint}; }
        .entry-card:hover { border-color: ${C.borderMid} !important; }
      `,
        }}
      />

      <main
        style={{
          minHeight: '100vh',
          background: C.bg,
          fontFamily: 'var(--font-ui)',
          color: C.text,
        }}
      >
        {/* Nav */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: C.bg,
            borderBottom: `1px solid ${C.border}`,
            padding: '14px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Link
            href="/"
            style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}
          >
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
            Provenance Tracker · Restitution case study
          </span>
        </nav>

        <div style={{ maxWidth: 880, margin: '0 auto', padding: '60px 32px 100px' }}>
          {/* Hero */}
          <div style={{ marginBottom: 48 }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: C.textFaint,
                marginBottom: 16,
              }}
            >
              Documented restitution · Nazi era (1933–1945)
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.9rem, 5vw, 3rem)',
                fontWeight: 400,
                color: C.text,
                lineHeight: 1.12,
                marginBottom: 14,
                letterSpacing: '-0.01em',
              }}
            >
              {c.title}
            </h1>
            <div
              style={{
                fontSize: '0.95rem',
                color: C.textMuted,
                marginBottom: 24,
              }}
            >
              {c.artist} · {c.created} · {c.medium}
            </div>
            <p
              style={{
                fontSize: '1rem',
                color: C.textMuted,
                lineHeight: 1.75,
                maxWidth: 640,
              }}
            >
              {c.summary}
            </p>

            {/* Current standing — dated, never a live claim */}
            <div
              style={{
                marginTop: 28,
                padding: '14px 18px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                display: 'flex',
                gap: 12,
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: C.textFaint,
                  flexShrink: 0,
                }}
              >
                Standing
              </span>
              <span style={{ fontSize: '0.85rem', color: C.text, lineHeight: 1.5 }}>
                {c.currentStatusAsOf}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 32,
              padding: '14px 18px',
              background: C.surface2,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
            }}
          >
            {(
              ['custody', 'coerced', 'gap', 'restitution'] as CaseCustodyEntry['kind'][]
            ).map((k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: KIND_STYLE[k].dot,
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '0.76rem', color: C.textMuted }}>
                  {KIND_STYLE[k].label}
                </span>
              </div>
            ))}
          </div>

          {/* Custody chain */}
          <section style={{ marginBottom: 56 }}>
            <h2
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.textFaint,
                marginBottom: 6,
              }}
            >
              Chain of custody (ownership)
            </h2>
            <p
              style={{
                fontSize: '0.8rem',
                color: C.textMuted,
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Legal title over time. Exhibition loans are listed separately below — a
              loan never appears in this chain.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {c.custody.map((e, idx) => {
                const st = KIND_STYLE[e.kind]
                return (
                  <div
                    key={idx}
                    className="entry-card"
                    style={{
                      padding: '20px 24px',
                      background: st.tint,
                      border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${st.dot}`,
                      borderRadius: 10,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 14,
                        flexWrap: 'wrap',
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Courier New', monospace",
                          fontSize: '0.85rem',
                          color: C.text,
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          flexShrink: 0,
                        }}
                      >
                        {e.date}
                      </span>
                      <span
                        style={{
                          fontSize: '0.58rem',
                          fontWeight: 600,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: st.dot,
                          border: `1px solid ${st.dot}`,
                          borderRadius: 3,
                          padding: '1px 6px',
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.98rem',
                        color: C.text,
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                    >
                      {e.holder}
                    </div>
                    {e.place ? (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: C.textFaint,
                          marginBottom: 8,
                        }}
                      >
                        {e.place}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: C.textFaint,
                          marginBottom: 8,
                          fontStyle: 'italic',
                        }}
                      >
                        Location not documented
                      </div>
                    )}
                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: C.textMuted,
                        lineHeight: 1.65,
                      }}
                    >
                      {e.detail}
                    </p>
                    <SourceLine sources={e.sources} />
                  </div>
                )
              })}
            </div>
          </section>

          {/* Gaps — shown honestly */}
          {c.gaps.length > 0 && (
            <section style={{ marginBottom: 56 }}>
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: C.textFaint,
                  marginBottom: 6,
                }}
              >
                Documented gaps
              </h2>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: C.textMuted,
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                Periods where the legitimate record is missing or was knowingly
                falsified. Shown as gaps, never papered over.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {c.gaps.map((g, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '20px 24px',
                      background: 'rgba(154,143,133,0.06)',
                      border: `1px dashed ${C.borderMid}`,
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.85rem',
                        color: C.gap,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      ░ {g.span}
                    </div>
                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: C.textMuted,
                        lineHeight: 1.65,
                      }}
                    >
                      {g.note}
                    </p>
                    <SourceLine sources={g.sources} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Exhibition loans — strictly separate from custody */}
          {c.exhibitions.length > 0 && (
            <section style={{ marginBottom: 56 }}>
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: C.textFaint,
                  marginBottom: 6,
                }}
              >
                Exhibition loans (not custody changes)
              </h2>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: C.textMuted,
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                The work was displayed here temporarily. A loan is not a transfer of
                ownership and is never counted in the custody chain above.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {c.exhibitions.map((x, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '20px 24px',
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${C.sage}`,
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 14,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Courier New', monospace",
                          fontSize: '0.85rem',
                          color: C.text,
                          fontWeight: 600,
                        }}
                      >
                        {x.date}
                      </span>
                      <span style={{ fontSize: '0.95rem', color: C.text, fontWeight: 500 }}>
                        {x.venue}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: C.textMuted,
                        lineHeight: 1.65,
                      }}
                    >
                      {x.detail}
                    </p>
                    <SourceLine sources={x.sources} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* References */}
          <section
            style={{
              padding: '24px 28px',
              background: 'rgba(212,168,83,0.04)',
              border: `1px solid rgba(212,168,83,0.18)`,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.gold,
                marginBottom: 16,
              }}
            >
              Primary sources & further reading
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {c.references.map((r, i) => (
                <li key={i} style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: C.textMuted,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {r.label}
                    </a>
                  ) : (
                    <span style={{ color: C.textMuted }}>{r.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Footer nav */}
          <div
            style={{
              marginTop: 56,
              borderTop: `1px solid ${C.border}`,
              paddingTop: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontSize: '0.72rem', color: C.textFaint }}>
              Restitution is the highest-stakes honesty surface. Every fact above is
              sourced; gaps are shown as gaps.
            </div>
            <Link
              href="/learn#provenance-gap"
              style={{
                fontSize: '0.72rem',
                color: C.textMuted,
                borderBottom: `1px solid ${C.border}`,
                paddingBottom: 1,
              }}
            >
              What is a provenance gap? →
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
