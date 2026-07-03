'use client'

/**
 * SiteNav — a sticky global top bar for cross-page navigation.
 *
 * Hidden on the immersive globe landing (`/` with no work open) — a top bar
 * there would compete with the full-bleed hero. Once a work opens on desktop/
 * tablet, ProvenanceDetail is a real full-width content view (#134), so the
 * nav should be back — its absence is what #160 flagged ("works like a page
 * but opens as a side panel with no merit"). StoriesApp toggles the
 * `--site-nav-display` custom property (desktop/tablet only, never on the
 * mobile drawer) rather than lifting `inStory` through React state: a shared
 * context or router-searchParams round trip would either force a Suspense
 * boundary onto every statically-generated page that renders this nav (a
 * useSearchParams read here de-opts those routes from static rendering) or add
 * a new cross-tree context just to flip one boolean. `usePathname()` alone is
 * enough for every OTHER route, since only `/` has this landing-vs-open-work
 * ambiguity at one URL.
 * z-index sits above ProvenanceDetail's full-width panel (150) so it paints on
 * top instead of being covered; the panel's own top offset makes room for it
 * (see ProvenanceDetail.tsx).
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OBS } from '@/lib/design-tokens'

const LINKS: { href: string; label: string; accent?: boolean }[] = [
  { href: '/', label: 'Explore' },
  { href: '/learn', label: 'Learn' },
  { href: '/method', label: 'Method' },
  { href: '/insights', label: 'Insights' },
  { href: '/case/adele-bloch-bauer-i', label: 'Case study' },
  { href: '/support', label: 'Support' },
  { href: '/about', label: 'About' },
  { href: '/feedback', label: 'Feedback', accent: true },
]

export function SiteNav() {
  const pathname = usePathname()
  const onHome = pathname === '/'

  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'sticky', top: 0, zIndex: 160,
        // On every other route this is always 'flex'. On `/` it defers to the
        // CSS var StoriesApp sets — 'flex' once a work is open (desktop/tablet
        // only), 'none' on the pure landing view.
        display: onHome ? 'var(--site-nav-display, none)' : 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: 16,
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
