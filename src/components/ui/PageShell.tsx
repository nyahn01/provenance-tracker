/**
 * PageShell — the centered content column every page used to hand-roll.
 * Server-safe. Width defaults to the 880px reading column; pass 1100 for
 * grid-heavy pages. Vertical padding matches the pre-existing page rhythm.
 */
import type { CSSProperties } from 'react'

export function PageShell({
  width = 880,
  style,
  children,
}: {
  width?: number
  style?: CSSProperties
  children: React.ReactNode
}) {
  return (
    <div style={{ maxWidth: width, margin: '0 auto', padding: '60px 32px 100px', ...style }}>
      {children}
    </div>
  )
}
