'use client'

/**
 * WorkCard — one featured work in the landing collection grid.
 *
 * The image is a navigation thumbnail (cover-cropped); the artwork itself is
 * presented uncropped in the detail views. The chain fact is computed from the
 * committed custody data — a real, sourced number, never marketing copy.
 * Hover is the .landing-work-card CSS class (no JS style mutation).
 */
import type { FeaturedWork } from '@/lib/featured'
import { getFeaturedChain } from '@/lib/featured-chains'
import { OBS } from '@/lib/design-tokens'

/** "6 documented custody entries · 1906–1933" — from the committed chain only. */
function chainFact(work: FeaturedWork): string | null {
  const chain = getFeaturedChain(work.source, work.id)
  if (!chain || chain.length === 0) return null
  const years = chain
    .flatMap(e => [e.startDate, e.endDate])
    .filter((d): d is string => !!d)
    .map(Number)
  const span = years.length >= 2 ? ` · ${Math.min(...years)}–${Math.max(...years)}` : ''
  return `${chain.length} documented custody entr${chain.length === 1 ? 'y' : 'ies'}${span}`
}

export function WorkCard({
  work,
  lead = false,
  onSelect,
}: {
  work: FeaturedWork
  /** Poster-lead treatment: spans 2 columns on wide screens, taller image. */
  lead?: boolean
  onSelect: (work: FeaturedWork) => void
}) {
  const fact = chainFact(work)
  return (
    <button
      onClick={() => onSelect(work)}
      className={`landing-work-card${lead ? ' landing-lead' : ''}`}
      style={{
        textAlign: 'left',
        padding: 0,
        border: `1px solid ${OBS.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        background: OBS.surface,
        cursor: 'pointer',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={work.localSrc}
        alt={work.title}
        loading={lead ? 'eager' : 'lazy'}
        decoding="async"
        width={lead ? 720 : 320}
        height={lead ? 320 : 200}
        onError={e => { e.currentTarget.style.visibility = 'hidden' }}
        style={{
          width: '100%',
          height: lead ? 320 : 200,
          objectFit: 'cover',
          display: 'block',
          background: OBS.globeLand,
        }}
      />
      <div style={{ padding: lead ? '18px 20px 20px' : '14px 16px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: lead ? '1.6rem' : '1.25rem', color: OBS.text, lineHeight: 1.15 }}>
          {work.title}
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: OBS.textMuted, marginTop: 3 }}>
          {work.artist} · {work.year}
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: OBS.textFaint, marginTop: 10, lineHeight: 1.45 }}>
          {work.hook}
        </div>
        {fact && (
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: OBS.gold, marginTop: 10, letterSpacing: '0.04em' }}>
            {fact}
          </div>
        )}
      </div>
    </button>
  )
}
