/**
 * Card — the surface+border+radius panel every page hand-rolled.
 * `hover` applies the .ui-card-hover class (globals.css) — hover states are
 * CSS, never JS style mutation.
 */
import type { CSSProperties } from 'react'
import { resolvePalette, type PaletteName } from './palette'

export function Card({
  children,
  palette = 'marketing',
  hover = false,
  padding = '24px 28px',
  style,
}: {
  children: React.ReactNode
  palette?: PaletteName
  hover?: boolean
  padding?: string
  style?: CSSProperties
}) {
  const C = resolvePalette(palette)
  return (
    <div
      className={hover ? 'ui-card-hover' : undefined}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
