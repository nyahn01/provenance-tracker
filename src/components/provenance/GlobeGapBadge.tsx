'use client'

/**
 * GlobeGapBadge — non-blocking corner badge for undocumented (null-coordinate)
 * provenance gaps (Globe Option A, item 3 — honesty fix for issue #124).
 *
 * A GapEntry with no coordinates is never drawn on the globe (no synthetic
 * endpoint); this badge is the only on-globe signal that one exists, pointing
 * attention at the sourced gap note already shown in the provenance panel.
 * Mounts as a sibling to GlobeContainer, never inside it (GLOBE CONTRACT).
 */
import { OBS } from '@/lib/design-tokens'

interface GlobeGapBadgeProps {
  /** Count from globe-data.ts's countUnresolvedGaps — renders nothing when 0. */
  count: number
}

export function GlobeGapBadge({ count }: GlobeGapBadgeProps) {
  if (count <= 0) return null
  const label = `${count} undocumented ${count === 1 ? 'gap' : 'gaps'} — see panel`

  return (
    <div
      role="status"
      aria-label={`${label} for this artwork's chain of custody`}
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 5,
        padding: '6px 12px',
        background: 'rgba(10,9,8,0.72)',
        border: `1px solid ${OBS.border}`,
        borderRadius: 999,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.7rem',
        color: OBS.textMuted,
        // Display-only — must not block globe drag/zoom, matching GlobeArcLegend.
        pointerEvents: 'none',
      }}
    >
      {label}
    </div>
  )
}
