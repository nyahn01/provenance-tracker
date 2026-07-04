/**
 * /de/case/[slug] — German-language restitution case-study deep-dive.
 *
 * Mirrors /case/[slug] (src/app/(pages)/case/[slug]/page.tsx) structurally.
 * generateStaticParams is scoped to allTranslatedCaseSlugs() — only slugs
 * with a German prose overlay in case-studies.de.ts get a /de page; facts
 * (dates, holders, places, kind, citation labels/URLs) render exactly as in
 * case-studies.ts, since they are proper nouns/legal citations, not prose.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MARKETING as C } from '@/lib/design-tokens'
import { getCaseTranslated, allTranslatedCaseSlugs, CASE_STUDIES } from '@/lib/case-studies'
import { JsonLd } from '@/components/JsonLd'
import { PageShell } from '@/components/ui'
import { SITE_URL } from '@/lib/site'
import type { CaseSource, CaseCustodyEntry } from '@/lib/types'

export function generateStaticParams() {
  return allTranslatedCaseSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const c = getCaseTranslated(slug, 'de')
  if (!c) return { title: 'Fallstudie nicht gefunden — Provenance Tracker' }
  return {
    title: `${c.title} — Restitutionsfall — Provenance Tracker`,
    description: c.summary.slice(0, 180),
    alternates: {
      languages: { en: `${SITE_URL}/case/${slug}`, de: `${SITE_URL}/de/case/${slug}` },
    },
  }
}

// Visual treatment per custody-entry kind. Colors come ONLY from design tokens.
const KIND_STYLE: Record<
  CaseCustodyEntry['kind'],
  { dot: string; label: string; tint: string }
> = {
  custody: { dot: C.gold, label: 'Besitz', tint: 'rgba(212,168,83,0.10)' },
  coerced: { dot: C.clay, label: 'Erzwungene Übertragung', tint: 'rgba(200,120,85,0.10)' },
  gap: { dot: C.gap, label: 'Lücke', tint: 'rgba(154,143,133,0.08)' },
  restitution: { dot: C.sage, label: 'Restitution', tint: 'rgba(111,141,125,0.10)' },
}

function SourceLine({ sources }: { sources: CaseSource[] }) {
  return (
    <div className="src-line">
      <span className="src-tag">Quelle</span>
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

export default async function CaseStudyPageDe({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const c = getCaseTranslated(slug, 'de')
  if (!c) notFound()
  const translatedSlugs = allTranslatedCaseSlugs()
  const otherCases = Object.values(CASE_STUDIES).filter(o => o.slug !== c.slug && translatedSlugs.includes(o.slug))

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `${c.title} — eine dokumentierte Restitution`,
          description: c.summary,
          url: `${SITE_URL}/de/case/${c.slug}`,
          inLanguage: 'de',
          about: {
            '@type': 'VisualArtwork',
            name: c.title,
            creator: { '@type': 'Person', name: c.artist },
            dateCreated: c.created,
            artMedium: c.medium,
          },
          citation: c.references.filter(r => r.url).map(r => r.url),
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .case-page a { text-decoration: none; }
        .src-line { margin-top: 12px; font-size: 0.72rem; color: ${C.textFaint}; line-height: 1.5; }
        .src-tag { display: inline-block; font-size: 0.58rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${C.textFaint}; border: 1px solid ${C.border}; border-radius: 3px; padding: 1px 5px; margin-right: 8px; vertical-align: middle; }
        .src-item a { color: ${C.textMuted}; border-bottom: 1px solid ${C.border}; }
        .src-item a:hover { color: ${C.text}; border-bottom-color: ${C.borderMid}; }
        .src-sep { color: ${C.textFaint}; }
        .entry-card:hover { border-color: ${C.borderMid} !important; }
      `,
        }}
      />

      <div className="case-page">
        <PageShell>
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
              Dokumentierte Restitution · NS-Zeit (1933–1945)
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

            {/* Aktueller Stand — datiert, keine Live-Behauptung */}
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
                Stand
              </span>
              <span style={{ fontSize: '0.85rem', color: C.text, lineHeight: 1.5 }}>
                {c.currentStatusAsOf}
              </span>
            </div>
          </div>

          {/* Legende */}
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

          {/* Besitzkette */}
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
              Besitzkette (Eigentum)
            </h2>
            <p
              style={{
                fontSize: '0.8rem',
                color: C.textMuted,
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Rechtmäßiges Eigentum im zeitlichen Verlauf. Ausstellungsleihgaben sind unten
              gesondert aufgeführt — eine Leihgabe erscheint niemals in dieser Kette.
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
                        Ort nicht dokumentiert
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

          {/* Lücken — ehrlich dargestellt */}
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
                Dokumentierte Lücken
              </h2>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: C.textMuted,
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                Zeiträume, in denen die rechtmäßige Aufzeichnung fehlt oder wissentlich
                gefälscht wurde. Als Lücken dargestellt, niemals beschönigt.
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

          {/* Ausstellungsleihgaben — strikt getrennt vom Besitz */}
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
                Ausstellungsleihgaben (keine Besitzänderung)
              </h2>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: C.textMuted,
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                Das Werk wurde hier vorübergehend gezeigt. Eine Leihgabe ist keine
                Eigentumsübertragung und zählt niemals zur oben stehenden Besitzkette.
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

          {/* Quellen */}
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
              Primärquellen &amp; weiterführende Literatur
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

          {/* Andere Fallstudien — internes Verweisnetz */}
          {otherCases.length > 0 && (
            <section style={{ marginTop: 40, marginBottom: 40 }}>
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: C.textFaint,
                  marginBottom: 16,
                }}
              >
                Weitere dokumentierte Restitutionen
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {otherCases.map(o => (
                  <Link
                    key={o.slug}
                    href={`/de/case/${o.slug}`}
                    style={{
                      display: 'block',
                      padding: '14px 18px',
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      color: C.text,
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: 3 }}>{o.title} →</div>
                    <div style={{ fontSize: '0.75rem', color: C.textFaint }}>{o.artist} · {o.created}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Fußnavigation */}
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
              Restitution ist die Oberfläche mit den höchsten Anforderungen an Genauigkeit.
              Jede Tatsache oben ist belegt; Lücken werden als Lücken dargestellt.
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/learn#provenance-gap"
                style={{
                  fontSize: '0.72rem',
                  color: C.textMuted,
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: 1,
                }}
              >
                Was ist eine Provenienzlücke? (auf Englisch) →
              </Link>
              <Link
                href={`/case/${c.slug}`}
                style={{
                  fontSize: '0.72rem',
                  color: C.textMuted,
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: 1,
                }}
              >
                In English →
              </Link>
            </div>
          </div>
        </PageShell>
      </div>
    </>
  )
}
