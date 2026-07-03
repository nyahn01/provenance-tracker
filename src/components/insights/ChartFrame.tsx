/**
 * ChartFrame — the shared chrome for every insight chart.
 *
 * Enforces two honesty invariants structurally:
 *  1. every figure carries a visible source line (sourceLabel + n);
 *  2. thin/empty data renders an emptyNote instead of a broken chart.
 *
 * Server component, MARKETING palette. Charts render their SVG as children.
 */
import { MARKETING as C } from '@/lib/design-tokens'

export function ChartFrame({
  eyebrow,
  title,
  sourceLabel,
  n,
  note,
  empty,
  emptyNote,
  children,
  id,
}: {
  eyebrow: string
  title: string
  /** e.g. "Getty GPI — Knoedler Stock Books (1872–1970), CC0 1.0" */
  sourceLabel: string
  /** record count behind the figure */
  n?: number
  /** optional methodology caption above the source line */
  note?: React.ReactNode
  /** when true, render emptyNote instead of children (honest degradation) */
  empty?: boolean
  emptyNote?: string
  children: React.ReactNode
  id?: string
}) {
  return (
    <figure id={id} style={{ margin: '0 0 56px' }}>
      <figcaption style={{ marginBottom: 18 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 8 }}>
          {eyebrow}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', color: C.text, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
          {title}
        </div>
      </figcaption>

      {empty ? (
        <div style={{ padding: '28px 22px', border: `1px dashed ${C.borderMid}`, borderRadius: 10, fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.6 }}>
          {emptyNote ?? 'Not enough data to chart this honestly.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>{children}</div>
      )}

      {note && (
        <div style={{ fontSize: '0.78rem', color: C.textMuted, lineHeight: 1.6, marginTop: 14, maxWidth: 640 }}>
          {note}
        </div>
      )}
      <div style={{ fontSize: '0.68rem', color: C.textFaint, marginTop: 12, lineHeight: 1.5 }}>
        Source: {sourceLabel}
        {typeof n === 'number' && <> · n = {n.toLocaleString('en-US')} records</>}
      </div>
    </figure>
  )
}
