'use client'

/**
 * GlobeArcLegend — arc-tier colour key shown as a compact overlay on the globe view.
 *
 * Mounts as a sibling div to GlobeContainer (never inside it) so the GLOBE
 * CONTRACT init pattern is untouched. Colors imported from design-tokens (OBS) —
 * no hex literals here.
 *
 * Honesty: the legend describes arc MEANING only. It does NOT imply live
 * status or "currently on view" claims.
 */

import { OBS } from '@/lib/design-tokens'

interface GlobeArcLegendProps {
  /** Responsive height of the globe area — used to anchor the legend within it. */
  globeHeightPct: string
}

// Dealer-arc amber — matches buildDealerArcs in globe-data.ts and the /learn legend.
// Kept as a file-scoped constant so it can be found quickly when the globe-data
// value changes (the single change also needs to land here and in learn/page.tsx).
const DEALER_ARC_COLOR = 'rgba(180,130,60,0.8)'

export function GlobeArcLegend({ globeHeightPct }: GlobeArcLegendProps) {
  const items = [
    {
      color: OBS.gold,
      label: 'Custody',
      desc: 'Ownership transfer',
    },
    {
      color: OBS.sage,
      label: 'Loan',
      desc: 'Exhibition — owner unchanged',
    },
    {
      color: DEALER_ARC_COLOR,
      label: 'Dealer trail',
      desc: 'Getty GPI record',
    },
  ] as const

  return (
    <div
      role="note"
      aria-label="Globe arc colour guide"
      style={{
        position: 'absolute',
        // Pin to bottom-left of the globe zone
        bottom: `calc(100% - ${globeHeightPct} + 16px)`,
        left: 16,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 12px',
        background: 'rgba(10,9,8,0.72)',
        border: `1px solid ${OBS.border}`,
        borderRadius: 8,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        // Legend is display-only; must not block globe drag/zoom interactions
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: '0.58rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: OBS.textFaint,
          marginBottom: 2,
          fontFamily: 'var(--font-ui)',
        }}
      >
        Arc guide
      </div>
      {items.map(item => (
        <div
          key={item.label}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 18,
              height: 2,
              background: item.color,
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.7rem',
              color: OBS.text,
              fontWeight: 500,
              minWidth: 56,
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.68rem',
              color: OBS.textMuted,
              whiteSpace: 'nowrap',
            }}
          >
            {item.desc}
          </span>
        </div>
      ))}
    </div>
  )
}
