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
  accentColor,
  accentSide = 'left',
  style,
}: {
  children: React.ReactNode
  palette?: PaletteName
  hover?: boolean
  padding?: string
  /** Adds a colored accent border — top (2px, for a labeled/tagged card) or left (3px, for a list-row entry). */
  accentColor?: string
  accentSide?: 'top' | 'left'
  style?: CSSProperties
}) {
  const C = resolvePalette(palette)
  const accent = accentColor
    ? accentSide === 'top'
      ? { borderTop: `2px solid ${accentColor}` }
      : { borderLeft: `3px solid ${accentColor}` }
    : {}
  return (
    <div
      className={hover ? 'ui-card-hover' : undefined}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding,
        ...accent,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
