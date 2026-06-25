/**
 * SourceBadge — colored tier pill (MET / AIC / RIJKS / Wikidata / RKD / GPI / EUR).
 * Extracted verbatim from StoriesApp.tsx (no visual change).
 */
import { GAL } from '@/lib/design-tokens'
import { tierLabel } from './timeline'

export function SourceBadge({ source }: { source: string }) {
  const label = tierLabel(source)
  const isGPI = label === 'GPI'
  const isRKD = label === 'RKD'
  return (
    <span style={{
      background: isGPI ? 'rgba(124,92,191,0.12)' : isRKD ? 'rgba(74,122,106,0.12)' : 'rgba(160,120,48,0.10)',
      color: isGPI ? '#9b7fe0' : isRKD ? GAL.sage : GAL.gold,
      border: isGPI ? '1px solid rgba(124,92,191,0.30)' : isRKD ? '1px solid rgba(74,122,106,0.28)' : '1px solid rgba(160,120,48,0.25)',
      borderRadius: 4, padding: '2px 7px', fontSize: '0.625rem', fontFamily: 'var(--font-ui)',
      fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}
