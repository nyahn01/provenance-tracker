import type { Metadata } from 'next'
import './globals.css'

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
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0908] text-[#f6f1e8] font-sans antialiased overflow-hidden">
        {children}
      </body>
    </html>
  )
}
