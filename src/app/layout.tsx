import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { BuyMeACoffeeButton } from '@/components/BuyMeACoffeeButton'
import { SITE_URL, SITE_NAME } from '@/lib/site'

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
    <html lang="en">
      <head>
        {/* UI grotesque */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
          rel="stylesheet"
        />
        {/* Display serif — Cormorant Garamond */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
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
