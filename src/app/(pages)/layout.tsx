/**
 * (pages) route group — the shared shell for every scrolling page.
 *
 * Owns the three things every page used to fight for individually with a
 * <style dangerouslySetInnerHTML> block: background, base text color, and the
 * UI font. Scroll is native (globals.css no longer hides overflow); SiteNav
 * and SiteFooter come from the root layout. URLs are unchanged — route groups
 * don't affect paths.
 */
import { MARKETING } from '@/lib/design-tokens'

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
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
