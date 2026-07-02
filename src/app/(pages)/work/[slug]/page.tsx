/**
 * /work/[slug] — static, crawlable landing page for one featured work.
 *
 * Statically generated from committed data only (featured.ts +
 * featured-provenance.json + the Getty seed files) — zero runtime API cost,
 * and the custody chain prerenders to plain HTML search engines can read
 * (ADR 0005). Exhibition loans and the map reveal are runtime features of the
 * interactive explorer and are deliberately NOT duplicated here; the page says
 * so instead of pretending to be the full record.
 *
 * Honesty rules: image is public-domain and credited; every chain node carries
 * a source badge (ChainOfCustodyTimeline enforces this); no live "where is it
 * now" claims — the chain ends on its last dated, sourced entry.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MARKETING as C, GAL } from '@/lib/design-tokens'
import { FEATURED_WORKS, getFeaturedBySlug, allWorkSlugs } from '@/lib/featured'
import { getFeaturedChain } from '@/lib/featured-chains'
import { searchGetty } from '@/lib/getty'
import { ChainOfCustodyTimeline } from '@/components/provenance/ChainOfCustodyTimeline'
import { JsonLd } from '@/components/JsonLd'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { SITE_URL } from '@/lib/site'
import type { GapEntry } from '@/lib/types'

export function generateStaticParams() {
  return allWorkSlugs().map(slug => ({ slug }))
}

function chainSummary(slug: string): string {
  const work = getFeaturedBySlug(slug)
  const chain = work ? getFeaturedChain(work.source, work.id) : undefined
  if (!work || !chain || chain.length === 0) return ''
  const first = chain[0]
  const last = chain[chain.length - 1]
  const start = first.startDate ? `${first.institution ?? first.name}, ${first.startDate}` : (first.institution ?? first.name)
  const end = last.institution ?? last.name
  return `Documented chain of custody from ${start} to ${end} — every entry sourced, gaps shown honestly.`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const work = getFeaturedBySlug(slug)
  if (!work) return { title: 'Work not found — Provenance Tracker' }
  const description = chainSummary(slug) || work.hook
  return {
    title: `${work.title} — ${work.artist} · Provenance — Provenance Tracker`,
    description,
    openGraph: {
      title: `${work.title} — ${work.artist}`,
      description,
      type: 'article',
      images: [work.localSrc],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${work.title} — ${work.artist}`,
      description,
      images: [work.localSrc],
    },
  }
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const work = getFeaturedBySlug(slug)
  if (!work) notFound()

  const chain = getFeaturedChain(work.source, work.id) ?? []
  const gettyRecords = searchGetty(work.artist, work.title, 20)
  // Same thin-chain rule as /api/provenance: under 2 mapped entries is an honest gap.
  const located = chain.filter(l => l.lat !== null && l.lng !== null)
  const gaps: GapEntry[] =
    located.length < 2
      ? [{ from: null, to: null, note: 'No documented chain of custody found in our sources. Help complete the record.' }]
      : []
  const creationYear = (() => {
    const m = work.year.match(/\d{4}/)
    return m ? parseInt(m[0], 10) : null
  })()
  const others = FEATURED_WORKS.filter(f => f.slug !== work.slug)

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'VisualArtwork',
          name: work.title,
          creator: { '@type': 'Person', name: work.artist },
          dateCreated: work.year,
          image: `${SITE_URL}${work.localSrc}`,
          url: `${SITE_URL}/work/${work.slug}`,
          description: work.hook,
          creditText: work.credit,
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        a { text-decoration: none; }
        .other-work:hover { border-color: ${C.borderMid} !important; }
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
            Provenance Tracker · Featured work
          </span>
        </nav>

        <div style={{ maxWidth: 880, margin: '0 auto', padding: '60px 32px 100px' }}>
          {/* Hero */}
          <div style={{ marginBottom: 48 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={work.localSrc}
              alt={`${work.title} by ${work.artist}`}
              style={{
                width: '100%',
                maxHeight: 520,
                objectFit: 'contain',
                objectPosition: 'left',
                borderRadius: 10,
                background: C.surface,
                marginBottom: 10,
                display: 'block',
              }}
            />
            <div style={{ fontSize: '0.68rem', color: C.textFaint, marginBottom: 28 }}>{work.credit}</div>
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
              {work.title}
            </h1>
            <div style={{ fontSize: '0.95rem', color: C.textMuted, marginBottom: 24 }}>
              {work.artist} · {work.year}
            </div>
            <p style={{ fontSize: '1rem', color: C.textMuted, lineHeight: 1.75, maxWidth: 640 }}>
              {work.hook}
            </p>
          </div>

          {/* Chain of custody — the gallery (light) panel, same palette as the detail view */}
          <section
            style={{
              background: GAL.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 'clamp(20px, 4vw, 36px)',
              marginBottom: 24,
            }}
          >
            <ChainOfCustodyTimeline
              locations={chain}
              exhibitions={[]}
              gettyRecords={gettyRecords}
              gaps={gaps}
              artist={work.artist}
              creationYear={creationYear}
              artwork={{ id: `${work.source}-${work.id}`, source: work.source }}
            />
          </section>

          {/* Honest scope note + CTA into the interactive explorer */}
          <div
            style={{
              padding: '18px 22px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              marginBottom: 56,
            }}
          >
            <p style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.65, marginBottom: 12 }}>
              This page shows the documented ownership chain and dealer sale records from
              committed, sourced data. Exhibition loans and the map view live in the
              interactive explorer — a loan is never shown as a change of custody.
            </p>
            <Link
              href={`/?work=${work.slug}`}
              style={{
                fontSize: '0.82rem',
                color: C.gold,
                fontWeight: 600,
                borderBottom: `1px solid ${C.gold}`,
                paddingBottom: 1,
              }}
            >
              Open in the interactive explorer →
            </Link>
          </div>

          {/* Other featured journeys — internal link graph */}
          <section style={{ marginBottom: 56 }}>
            <h2
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.textFaint,
                marginBottom: 18,
              }}
            >
              More featured journeys
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {others.map(f => (
                <Link
                  key={f.slug}
                  href={`/work/${f.slug}`}
                  className="other-work"
                  style={{
                    padding: '14px 16px',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ fontSize: '0.9rem', color: C.text, fontWeight: 500, marginBottom: 3 }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: C.textFaint }}>
                    {f.artist} · {f.year}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Newsletter */}
          <section style={{ marginBottom: 56 }}>
            <h2
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.textFaint,
                marginBottom: 14,
              }}
            >
              Follow the research
            </h2>
            <NewsletterSignup />
          </section>

          {/* Footer nav */}
          <div
            style={{
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
              Every fact above carries a source; gaps are shown as gaps.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <Link
                href="/case/adele-bloch-bauer-i"
                style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}
              >
                A full restitution chain →
              </Link>
              <Link
                href="/method"
                style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}
              >
                How this is sourced →
              </Link>
              <Link
                href="/learn"
                style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}
              >
                Provenance glossary →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
