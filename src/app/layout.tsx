import type { Metadata } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
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
    <html lang="en" className={cormorantGaramond.variable}>
      <head>
        {/* UI grotesque — Pretendard stays CDN-loaded for now. Self-hosting it via
            next/font/local is a separate, larger follow-up (needs sourcing the
            actual woff2 files and confirming the OFL license terms). */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
          rel="stylesheet"
        />
      </head>
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
