/**
 * SourceLine — a full-citation source list ("Source: label · label · label"),
 * each with a direct link when available. Extracted from case/[slug]/page.tsx
 * so ChainOfCustodyTimeline can reuse it for case-study nodes, which carry an
 * array of full legal/archival citations (CaseSource[]) rather than the single
 * museum-tier string SourceBadge renders for live provenance data.
 */
import { GAL } from '@/lib/design-tokens'
import type { CaseSource } from '@/lib/types'

export function SourceLine({ sources }: { sources: CaseSource[] }) {
  return (
    <div style={{ marginTop: 8, fontSize: '0.72rem', color: GAL.textFaint, lineHeight: 1.5, fontFamily: 'var(--font-ui)' }}>
      <span style={{
        display: 'inline-block', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: GAL.textFaint, border: `1px solid ${GAL.border}`,
        borderRadius: 3, padding: '1px 5px', marginRight: 8, verticalAlign: 'middle',
      }}>Source</span>
      {sources.map((s, i) => (
        <span key={i}>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: GAL.textMuted, borderBottom: `1px solid ${GAL.border}`, textDecoration: 'none' }}>
              {s.label}
            </a>
          ) : (
            <span>{s.label}</span>
          )}
          {i < sources.length - 1 ? <span style={{ color: GAL.textFaint }}> · </span> : null}
        </span>
      ))}
    </div>
  )
}
