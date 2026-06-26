'use client'

/**
 * SiteNav — a sticky global top bar for cross-page navigation.
 *
 * Renders on every page EXCEPT the full-screen globe home (`/`), which has its
 * own hero + footer nav and where a top bar would half-overlap the detail panel.
 * Sticky (not fixed) so it occupies flow space on the scrolling marketing pages
 * and never overlaps their content. Mirrors the footer-link styling in
 * StoriesApp and uses the shared design tokens.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OBS } from '@/lib/design-tokens'

const LINKS: { href: string; label: string; accent?: boolean }[] = [
  { href: '/', label: 'Explore' },
  { href: '/learn', label: 'Learn' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/team', label: 'How it\'s built' },
  { href: '/feedback', label: 'Feedback', accent: true },
]

export function SiteNav() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '0 clamp(16px, 4vw, 32px)', height: 52,
        background: 'rgba(10,9,8,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${OBS.border}`,
      }}
    >
      <Link href="/" style={{
        fontFamily: 'var(--font-ui)', fontSize: '0.72rem', fontWeight: 600,
        letterSpacing: '0.16em', textTransform: 'uppercase', color: OBS.clay,
        textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        Provenance Tracker
      </Link>
      <div className="nav-links" style={{
        display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.5vw, 24px)',
        overflowX: 'auto', whiteSpace: 'nowrap',
      }}>
        {LINKS.map(l => {
          const active = pathname === l.href
          return (
            <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined}
              style={{
                fontFamily: 'var(--font-ui)', fontSize: '0.8rem',
                color: l.accent ? OBS.clay : active ? OBS.text : OBS.textMuted,
                fontWeight: l.accent || active ? 600 : 400,
                textDecoration: 'none', whiteSpace: 'nowrap',
                borderBottom: active ? `1px solid ${OBS.clay}` : '1px solid transparent',
                paddingBottom: 2,
              }}>
              {l.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
