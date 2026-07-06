/**
 * Callout — the gold-tinted panel every essay page hand-rolled (about, method,
 * learn, support), each with slightly drifted values (border opacity 0.18 vs
 * 0.20 vs 0.3, radius 8 vs 10 vs 12) and no shared component. Standardizes on
 * one set of values (rgba tint derived from the actual gold token, not a
 * restated hex — see `tint()` below) instead of four near-identical inline
 * style objects.
 *
 * `pulse` reproduces the "gate/key" breathing box-shadow both about/page.tsx
 * and method/page.tsx defined under different keyframe names for the same
 * effect — one keyframe (globals.css `.callout-pulse`) instead of two.
 */
import type { CSSProperties } from 'react'
import { resolvePalette, type PaletteName } from './palette'

/** #RRGGBB → "r,g,b" for building an alpha-tinted rgba() from a token, never a restated literal. */
function rgbTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

export function Callout({
  children,
  palette = 'marketing',
  pulse = false,
  padding = '24px 28px',
  style,
}: {
  children: React.ReactNode
  palette?: PaletteName
  pulse?: boolean
  padding?: string
  style?: CSSProperties
}) {
  const C = resolvePalette(palette)
  const rgb = rgbTriplet(C.gold)
  return (
    <div
      className={pulse ? 'callout-pulse' : undefined}
      style={{
        background: `rgba(${rgb},0.04)`,
        border: `1px solid rgba(${rgb},0.20)`,
        borderRadius: 12,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
