/**
 * CTALink — the "label →" link row used across every page.
 * Tones: gold (primary next-step), clay (accent action), muted (secondary).
 */
import Link from 'next/link'
import { resolvePalette, type PaletteName } from './palette'

export function CTALink({
  href,
  children,
  tone = 'muted',
  palette = 'marketing',
  external = false,
  size = '0.78rem',
}: {
  href: string
  children: React.ReactNode
  tone?: 'gold' | 'clay' | 'muted'
  palette?: PaletteName
  external?: boolean
  size?: string
}) {
  const C = resolvePalette(palette)
  const color = tone === 'gold' ? C.gold : tone === 'clay' ? C.clay : C.textMuted
  const style = {
    fontSize: size,
    color,
    fontWeight: tone === 'muted' ? 400 : 600,
    textDecoration: 'none',
    borderBottom: `1px solid ${tone === 'gold' ? C.gold : C.border}`,
    paddingBottom: 1,
  } as const

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} style={style}>
      {children}
    </Link>
  )
}
