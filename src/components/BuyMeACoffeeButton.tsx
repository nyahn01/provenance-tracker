'use client'

/**
 * Floating "Buy me a coffee" widget — suppressed on `/embed/*`. An iframed
 * page showing on someone else's site shouldn't carry a floating donation
 * widget for a project the visitor may not even know the name of.
 */
import Script from 'next/script'
import { usePathname } from 'next/navigation'

export function BuyMeACoffeeButton() {
  const pathname = usePathname()
  if (pathname?.startsWith('/embed')) return null

  return (
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
  )
}
