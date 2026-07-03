/**
 * /embed/work/[slug] — a lightweight, iframe-able chain-of-custody timeline
 * for one featured work (issue #151).
 *
 * Same static, committed-data-only generation as /work/[slug] (zero runtime
 * cost) — it reuses the exact same chain/gaps computation so the embed can
 * never show a "friendlier" story than the real page. Honesty rule: no
 * simplified/prettified variant that hides gaps or drops source badges.
 *
 * Minimal chrome only: no SiteNav/SiteFooter/BMC button (suppressed for
 * `/embed/*` in those components) — this page is meant to sit inside someone
 * else's page, not compete with it. `noindex` because /work/[slug] is the
 * canonical, indexable version of this content.
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { GAL } from '@/lib/design-tokens'
import { getFeaturedBySlug, allWorkSlugs } from '@/lib/featured'
import { getFeaturedChain } from '@/lib/featured-chains'
import { searchGetty } from '@/lib/getty'
import { ChainOfCustodyTimeline } from '@/components/provenance/ChainOfCustodyTimeline'
import { CTALink } from '@/components/ui'
import { SITE_URL } from '@/lib/site'
import type { GapEntry } from '@/lib/types'

export function generateStaticParams() {
  return allWorkSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const work = getFeaturedBySlug(slug)
  if (!work) return { title: 'Work not found — Provenance Tracker' }
  return {
    title: `${work.title} — chain of custody (embed) — Provenance Tracker`,
    description: work.hook,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/work/${work.slug}` },
  }
}

export default async function EmbedWorkPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const work = getFeaturedBySlug(slug)
  if (!work) notFound()

  const chain = getFeaturedChain(work.source, work.id) ?? []
  const gettyRecords = searchGetty(work.artist, work.title, 20)
  // Same thin-chain rule as /work/[slug] and /api/provenance.
  const located = chain.filter(l => l.lat !== null && l.lng !== null)
  const gaps: GapEntry[] =
    located.length < 2
      ? [{ from: null, to: null, note: 'No documented chain of custody found in our sources. Help complete the record.' }]
      : []
  const creationYear = (() => {
    const m = work.year.match(/\d{4}/)
    return m ? parseInt(m[0], 10) : null
  })()

  return (
    <div style={{ minHeight: '100vh', background: GAL.bg, fontFamily: 'var(--font-ui)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 22px 28px' }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 500, color: GAL.text, marginBottom: 2 }}>
            {work.title}
          </div>
          <div style={{ fontSize: '0.78rem', color: GAL.textFaint }}>
            {work.artist} · {work.year}
          </div>
        </div>

        <ChainOfCustodyTimeline
          locations={chain}
          exhibitions={[]}
          gettyRecords={gettyRecords}
          gaps={gaps}
          artist={work.artist}
          creationYear={creationYear}
          artwork={{ id: `${work.source}-${work.id}`, source: work.source }}
        />

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${GAL.border}` }}>
          <CTALink href={`${SITE_URL}/work/${work.slug}`} external tone="gold" palette="gal" size="0.76rem">
            View the full journey on Provenance Tracker →
          </CTALink>
        </div>
      </div>
    </div>
  )
}
