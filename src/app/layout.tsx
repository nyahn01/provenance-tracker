import type { Metadata } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
import localFont from 'next/font/local'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { BuyMeACoffeeButton } from '@/components/BuyMeACoffeeButton'
import { SITE_URL, SITE_NAME } from '@/lib/site'

// Self-hosted at build time (no runtime request to fonts.googleapis.com) and
// exposed as the same --font-display custom property every component already
// reads via var(--font-display) — see docs/DESIGN_SYSTEM.md §2a. Weights/styles
// are a superset of what's used (the previous <link> loaded italic only at
// 400/500; next/font applies one weight list to every requested style, so all
// four weights load for both — unused combinations aren't fetched by the
// browser, only declared).
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
})

// UI grotesque, self-hosted at build time — same zero-ripple approach as the
// display serif above: `variable` targets the pre-existing --font-ui custom
// property every component already reads via var(--font-ui). Weight list is
// exactly the four weights used anywhere in src/ (grep for `fontWeight:`),
// no italic (Pretendard ships no italic face; components that set
// fontStyle: 'italic' on --font-ui already got the browser's synthetic
// oblique under the old CDN link, since that link didn't declare one
// either — same fallback behavior, not a regression). Files are the same
// woff2s vendored for the pitch deck (presentation/vendor/pretendard),
// OFL-1.1 — see ./fonts/pretendard/LICENSE.txt.
const pretendard = localFont({
  src: [
    { path: './fonts/pretendard/Pretendard-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/pretendard/Pretendard-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/pretendard/Pretendard-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/pretendard/Pretendard-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-ui',
})

const DESCRIPTION =
  'Documented chains of custody for famous paintings — every fact sourced, every gap shown honestly.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
    // A real German legal notice + one translated case study exist at /de —
    // this signals German content is available site-wide without claiming a
    // fully bilingual homepage (which has no German version).
    alternateLocale: ['de_DE'],
    title: SITE_NAME,
    description: DESCRIPTION,
    // Default social image; per-work pages override with their own hero.
    // Public-domain work, credited on-page (honesty rule).
    images: ['/works/water-lilies.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DESCRIPTION,
    images: ['/works/water-lilies.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${pretendard.variable}`}>
      <body
        className="antialiased"
        style={{
          backgroundColor: 'var(--obs-bg)',
          color: 'var(--obs-text)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <a href="#main" className="skip-link">Skip to content</a>
        <SiteNav />
        {/* `display: contents` keeps this landmark layout-neutral — it generates no
            box, so the full-bleed globe and the marketing pages render unchanged,
            while giving the skip link a focus target and a single <main> landmark.
            tabIndex=-1 lets the skip link move focus here without making it tabbable. */}
        <main id="main" tabIndex={-1} style={{ display: 'contents' }}>
          {children}
        </main>
        <SiteFooter />
        <BuyMeACoffeeButton />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
