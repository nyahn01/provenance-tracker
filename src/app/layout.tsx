import type { Metadata } from 'next'
import Script from 'next/script'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { SiteNav } from '@/components/SiteNav'

export const metadata: Metadata = {
  title: 'Provenance Tracker',
  description: 'Where the world\'s greatest art has been',
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
        className="antialiased overflow-hidden"
        style={{
          backgroundColor: 'var(--obs-bg)',
          color: 'var(--obs-text)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <SiteNav />
        {children}
        {/* Visible on marketing pages (their style tag sets body overflow:auto).
            Clipped by body overflow-hidden on the full-screen globe — handled there separately. */}
        <footer style={{
          textAlign: 'center',
          padding: '10px 16px',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.65rem',
          color: '#6b5f54',
          background: '#0a0908',
          borderTop: '1px solid #1e1a16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}>
          <a
            href="https://buymeacoffee.com/nyahn"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#d4a853', textDecoration: 'none' }}
          >
            ☕ Buy me a coffee
          </a>
          <span style={{ color: '#2a2218' }}>·</span>
          <span>© 2026 Nayoung Ahn · All rights reserved</span>
        </footer>
        <Script
          src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
          data-name="bmc-button"
          data-slug="nyahn"
          data-color="#FFDD00"
          data-emoji=""
          data-font="Comic"
          data-text="Buy me a coffee"
          data-outline-color="#000000"
          data-font-color="#000000"
          data-coffee-color="#ffffff"
          strategy="afterInteractive"
        />
        <SpeedInsights />
      </body>
    </html>
  )
}
