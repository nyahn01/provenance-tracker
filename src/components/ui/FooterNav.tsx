/**
 * FooterNav — the "borderTop + note + link row" footer every page hand-copied
 * (learn, method, about, support, work/[slug], case/[slug], impressum — 7
 * near-identical implementations). The note and the links differ per page;
 * only the container structure repeats, so that's all this owns — pass the
 * page's own CTALinks (or any node) as children.
 */
import type { CSSProperties } from 'react'
import { resolvePalette, type PaletteName } from './palette'

export function FooterNav({
  note,
  palette = 'marketing',
  children,
  style,
}: {
  note: React.ReactNode
  palette?: PaletteName
  children: React.ReactNode
  style?: CSSProperties
}) {
  const C = resolvePalette(palette)
  return (
    <div
      style={{
        borderTop: `1px solid ${C.border}`,
        paddingTop: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        ...style,
      }}
    >
      <div style={{ fontSize: '0.72rem', color: C.textFaint }}>{note}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  )
}
