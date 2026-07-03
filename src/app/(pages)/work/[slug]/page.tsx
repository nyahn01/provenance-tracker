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
import { PageShell, DisplayHeading, Prose, Card, CTALink, Section } from '@/components/ui'
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
      <PageShell>
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
            <DisplayHeading size="title" marginBottom={14}>{work.title}</DisplayHeading>
            <div style={{ fontSize: '0.95rem', color: C.textMuted, marginBottom: 24 }}>
              {work.artist} · {work.year}
            </div>
            <Prose>{work.hook}</Prose>
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
          <Card padding="18px 22px" style={{ marginBottom: 56 }}>
            <Prose size="0.85rem" maxWidth={720} marginBottom={12}>
              This page shows the documented ownership chain and dealer sale records from
              committed, sourced data. Exhibition loans and the map view live in the
              interactive explorer — a loan is never shown as a change of custody.
            </Prose>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <CTALink href={`/?work=${work.slug}`} tone="gold" size="0.82rem">
                Open in the interactive explorer →
              </CTALink>
              <CTALink href="/insights#network" size="0.82rem">
                This dealer world in aggregate →
              </CTALink>
            </div>
          </Card>

          {/* Other featured journeys — internal link graph */}
          <Section eyebrow="More featured journeys">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {others.map(f => (
                <Link key={f.slug} href={`/work/${f.slug}`} style={{ textDecoration: 'none' }}>
                  <Card hover padding="14px 16px" style={{ height: '100%' }}>
                    <div style={{ fontSize: '0.9rem', color: C.text, fontWeight: 500, marginBottom: 3 }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: C.textFaint }}>
                      {f.artist} · {f.year}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Section>

          {/* Newsletter */}
          <Section eyebrow="Follow the research">
            <NewsletterSignup />
          </Section>

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
              <CTALink href="/case/adele-bloch-bauer-i" size="0.72rem">A full restitution chain →</CTALink>
              <CTALink href="/method" size="0.72rem">How this is sourced →</CTALink>
              <CTALink href="/learn" size="0.72rem">Provenance glossary →</CTALink>
            </div>
          </div>
      </PageShell>
    </>
  )
}
