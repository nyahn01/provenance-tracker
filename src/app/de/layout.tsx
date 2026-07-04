/**
 * /de/* — shared shell for the German-language pages.
 *
 * Mirrors (pages)/layout.tsx's background/font shell (same MARKETING tokens,
 * same SiteNav/SiteFooter from the root layout). The root layout's single
 * <html lang="en"> can't be made conditional per-route in a shared Server
 * Component root layout — Next.js nested layouts render inside <body>, not
 * around it — so this wraps German content in an element-level `lang="de"`
 * override instead. A minor, accepted limitation (screen readers and SEO
 * tooling respect element-level lang; Google's language targeting relies on
 * hreflang, not <html lang>) — same spirit as the documented drift already
 * called out in design-tokens.ts.
 */
import type { Metadata } from 'next'
import { MARKETING } from '@/lib/design-tokens'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: { locale: 'de_DE' },
}

export default function GermanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      lang="de"
      style={{
        minHeight: '100vh',
        background: MARKETING.bg,
        color: MARKETING.text,
        fontFamily: 'var(--font-ui)',
      }}
    >
      {children}
    </div>
  )
}
