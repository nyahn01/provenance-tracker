/**
 * Eyebrow — the small-caps section label (timeline-hero spec §1).
 * One home for the letter-spacing/size/weight combo previously restated
 * ~97 times as literals.
 */
import { resolvePalette, type PaletteName } from './palette'

export function Eyebrow({
  children,
  palette = 'marketing',
  color,
  as: Tag = 'div',
  marginBottom = 16,
}: {
  children: React.ReactNode
  palette?: PaletteName
  /** Override color (e.g. gold for emphasized section heads). */
  color?: string
  as?: 'div' | 'h2' | 'h3' | 'span'
  marginBottom?: number
}) {
  const C = resolvePalette(palette)
  return (
    <Tag
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: color ?? C.textFaint,
        marginBottom,
      }}
    >
      {children}
    </Tag>
  )
}
