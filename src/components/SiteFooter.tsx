'use client'

/**
 * SiteFooter — the global footer for every scrolling page.
 *
 * Returns null on the full-screen globe home (`/`), which owns its own footer
 * content inside the landing column — the same pattern as SiteNav. Extracted
 * from layout.tsx when the global overflow model flipped (pages scroll
 * natively; the home opts into full-screen).
 */
import { usePathname } from 'next/navigation'
import { OBS, MARKETING } from '@/lib/design-tokens'

export function SiteFooter() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <footer
      style={{
        textAlign: 'center',
        padding: '10px 16px',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.65rem',
        color: MARKETING.textFaint,
        background: MARKETING.bg,
        borderTop: `1px solid ${MARKETING.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <a
        href="https://buymeacoffee.com/nyahn"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: OBS.gold, textDecoration: 'none' }}
      >
        ☕ Buy me a coffee
      </a>
      <span style={{ color: MARKETING.border }}>·</span>
      <span>© 2026 Nayoung Ahn · All rights reserved</span>
    </footer>
  )
}
