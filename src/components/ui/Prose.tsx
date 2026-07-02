/**
 * Prose — body copy at the reading measure. Muted by default (the palettes'
 * body-text convention on every existing page).
 */
import { resolvePalette, type PaletteName } from './palette'

export function Prose({
  children,
  palette = 'marketing',
  muted = true,
  maxWidth = 640,
  size = '1rem',
  marginBottom,
}: {
  children: React.ReactNode
  palette?: PaletteName
  muted?: boolean
  maxWidth?: number
  size?: string
  marginBottom?: number
}) {
  const C = resolvePalette(palette)
  return (
    <p
      style={{
        fontSize: size,
        color: muted ? C.textMuted : C.text,
        lineHeight: 1.7,
        maxWidth,
        marginBottom,
      }}
    >
      {children}
    </p>
  )
}
