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
import { MARKETING as C, GAL } from '@/lib/design-tokens'
import { getCase, allCaseSlugs, allTranslatedCaseSlugs, CASE_STUDIES } from '@/lib/case-studies'
import { buildCaseChainLayout } from '@/components/provenance/chain-timeline'
import { ChainOfCustodyTimeline } from '@/components/provenance/ChainOfCustodyTimeline'
import { JsonLd } from '@/components/JsonLd'
import { PageShell, FooterNav, CTALink, Card, Callout } from '@/components/ui'
import { SITE_URL } from '@/lib/site'

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
  const hasGerman = allTranslatedCaseSlugs().includes(slug)
  return {
    title: `${c.title} — Restitution case study — Provenance Tracker`,
    description: c.summary.slice(0, 180),
    ...(hasGerman && {
      alternates: {
        languages: { en: `${SITE_URL}/case/${slug}`, de: `${SITE_URL}/de/case/${slug}` },
      },
    }),
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const c = getCase(slug)
  if (!c) notFound()
  const otherCases = Object.values(CASE_STUDIES).filter(o => o.slug !== c.slug)
  const hasGerman = allTranslatedCaseSlugs().includes(slug)

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `${c.title} — a documented restitution`,
          description: c.summary,
          url: `${SITE_URL}/case/${c.slug}`,
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
      {/* One remaining page-specific rule — the reference-list/other-cases links
          below rely on this reset (ChainOfCustodyTimeline styles its own links inline). */}
      <style dangerouslySetInnerHTML={{ __html: `.case-page a { text-decoration: none; }` }} />

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
            <Card
              padding="14px 18px"
              style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'baseline' }}
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
            </Card>
          </div>

          {/* Chain of custody — reuses the same mature timeline the interactive
              explorer and /work/[slug] use (spine, to-scale axis, gap bands,
              loan branches), via a pre-built layout instead of live museum data.
              This surface used to hand-roll its own flat card stack; the
              restitution cases are this project's highest-stakes honesty
              content and deserve the same timeline quality, not a weaker one. */}
          <section style={{ marginBottom: 56, background: GAL.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 'clamp(20px, 4vw, 36px)' }}>
            <ChainOfCustodyTimeline layout={buildCaseChainLayout(c)} />
          </section>

          {/* References */}
          <Callout padding="24px 28px">
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
          </Callout>

          {/* Other case studies — internal link graph */}
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
                Other documented restitutions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {otherCases.map(o => (
                  <Link key={o.slug} href={`/case/${o.slug}`} style={{ color: C.text }}>
                    <Card hover padding="14px 18px">
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: 3 }}>{o.title} →</div>
                      <div style={{ fontSize: '0.75rem', color: C.textFaint }}>{o.artist} · {o.created}</div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <FooterNav
            style={{ marginTop: 56 }}
            note="Restitution is the highest-stakes honesty surface. Every fact above is sourced; gaps are shown as gaps."
          >
            {hasGerman && <CTALink href={`/de/case/${c.slug}`} size="0.72rem">Auf Deutsch →</CTALink>}
            <CTALink href="/learn#provenance-gap" size="0.72rem">What is a provenance gap? →</CTALink>
          </FooterNav>
        </PageShell>
      </div>
    </>
  )
}
