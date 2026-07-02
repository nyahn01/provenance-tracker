/**
 * DisplayHeading — the Cormorant Garamond serif heading ramp
 * (timeline-hero spec §1: serif = the archival voice).
 *   hero    — landing/page hero
 *   title   — detail-page h1
 *   section — in-page serif section head
 */
import { resolvePalette, type PaletteName } from './palette'

const SIZES = {
  hero: 'clamp(2rem, 5vw, 3.2rem)',
  title: 'clamp(1.9rem, 5vw, 3rem)',
  section: 'clamp(1.3rem, 3vw, 1.7rem)',
} as const

export function DisplayHeading({
  children,
  size = 'title',
  level = 1,
  palette = 'marketing',
  marginBottom = 20,
}: {
  children: React.ReactNode
  size?: keyof typeof SIZES
  level?: 1 | 2 | 3
  palette?: PaletteName
  marginBottom?: number
}) {
  const C = resolvePalette(palette)
  const Tag = `h${level}` as const
  return (
    <Tag
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: SIZES[size],
        fontWeight: 400,
        color: C.text,
        lineHeight: 1.12,
        letterSpacing: '-0.01em',
        marginBottom,
      }}
    >
      {children}
    </Tag>
  )
}
