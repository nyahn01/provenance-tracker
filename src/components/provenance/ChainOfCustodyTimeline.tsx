'use client'

/**
 * ChainOfCustodyTimeline — a continuous, linear chain-of-custody timeline
 * (docs/design/timeline-hero-spec.md §4.1–4.4, ADR 0004).
 *
 * One vertical spine, top = earliest. Custody is the unbroken thread (a dot on
 * the spine). A documented dealer SALE is folded into the custody owner it
 * created (an inline annotation — see buildChainLayout), so the same owner never
 * appears twice. A LOAN branches off the spine and is labelled "not a change of
 * ownership". A documented gap is drawn on the spine. Same linear form at every
 * width (no kanban row). Warm gallery palette (GAL) to match the detail view.
 *
 * Honesty (spec §7): no line/animation bridges a gap; loans never advance the
 * custody thread; every node carries a source badge; a sale folds into custody
 * only on a real name match, never a fabricated one.
 */
import type { CSSProperties } from 'react'
import type { LocationEntry, ExhibitionLoan, GapEntry, GettyRecord, ArtworkMeta } from '@/lib/types'
import { GAL, accent } from '@/lib/design-tokens'
import { buildChainLayout, type ChainNode, type ChainGap, type SaleAnnotation } from './chain-timeline'
import { sourceRecordUrl } from './timeline'
import { SourceBadge } from './SourceBadge'
import { ConfidenceDot } from './ConfidenceDot'

interface ChainOfCustodyTimelineProps {
  locations: LocationEntry[]
  exhibitions: ExhibitionLoan[]
  gettyRecords: GettyRecord[]
  gaps: GapEntry[]
  artist?: string | null
  creationYear?: number | null
  artwork: Pick<ArtworkMeta, 'id' | 'source'>
}

const CONFIDENCE_LABEL: Record<ChainNode['confidence'], string> = {
  high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence',
}

const eyebrow = {
  fontFamily: 'var(--font-ui)', fontSize: '0.68rem', fontWeight: 600,
  letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: GAL.textFaint,
}

const SPINE_LEFT = 8      // px — spine x-position within the padded list
const DOT = 13            // px — custody dot diameter

function SaleTag({ sale }: { sale: SaleAnnotation }) {
  const via = sale.via ? sale.via : 'documented sale'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 7,
      padding: '4px 9px', borderRadius: 5, fontFamily: 'var(--font-ui)', fontSize: '0.75rem',
      background: 'rgba(108,74,168,0.08)', border: '1px solid rgba(108,74,168,0.26)', color: accent.dealer,
    }}>
      <span aria-hidden style={{ fontSize: '0.7rem' }}>◆</span>
      <span>Sale · {via}{sale.price ? ` · ${sale.price}` : ''}</span>
      {sale.sourceUrl && (
        <a href={sale.sourceUrl} target="_blank" rel="noopener noreferrer"
          style={{ color: accent.dealer, opacity: 0.75, textDecoration: 'none' }}>· {sale.source} ↗</a>
      )}
    </span>
  )
}

function EventBody({ node, tag, tagColor, artwork }: {
  node: ChainNode; tag: string; tagColor: string; artwork: Pick<ArtworkMeta, 'id' | 'source'>
}) {
  const recordUrl = sourceRecordUrl(node.sourceUrl, node.source, artwork)
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', letterSpacing: '-0.01em', color: GAL.text }}>{node.year}</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tagColor }}>{tag}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.95rem', fontWeight: 500, color: GAL.text, marginTop: 4, lineHeight: 1.35 }}>{node.who}</div>
      {node.where && (
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: GAL.textMuted, marginTop: 1 }}>
          {node.where}{node.unmapped && <span style={{ color: GAL.textFaint, fontStyle: 'italic' }}> — no coordinates in source</span>}
        </div>
      )}
      {node.detail && <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: GAL.textMuted, marginTop: 3, lineHeight: 1.4 }}>{node.detail}</div>}
      {node.sales?.map((s, i) => <div key={i}><SaleTag sale={s} /></div>)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8 }}>
        <SourceBadge source={node.source} />
        <span title={CONFIDENCE_LABEL[node.confidence]}><ConfidenceDot confidence={node.confidence} /></span>
        {recordUrl && (
          <a href={recordUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: GAL.textFaint, textDecoration: 'none', borderBottom: `1px solid ${GAL.border}` }}>
            record ↗
          </a>
        )}
      </div>
    </>
  )
}

function GapBand({ gap }: { gap: ChainGap }) {
  const years = gap.openStart && gap.openEnd ? 'undocumented'
    : gap.openStart ? `until ${gap.to}`
    : gap.openEnd ? `${gap.from} onward`
    : `${gap.from}–${gap.to}`
  return (
    <div role="group" aria-label={`Provenance gap, ${years}. ${gap.note}`}
      style={{
        padding: '12px 14px', borderRadius: 8, fontFamily: 'var(--font-ui)',
        background: `repeating-linear-gradient(135deg, ${GAL.surface2} 0 6px, transparent 6px 12px)`,
        border: `1px dashed ${GAL.borderMid}`,
      }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={eyebrow}>Provenance gap</span>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.05rem', color: GAL.text }}>{years}</span>
      </div>
      <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: GAL.textMuted, lineHeight: 1.5, margin: '5px 0 0' }}>
        {gap.note}{' '}
        <a href="/feedback" style={{ color: GAL.clay, textDecoration: 'none', borderBottom: `1px solid ${GAL.border}`, fontStyle: 'normal' }}>Help complete the record →</a>
      </p>
    </div>
  )
}

export function ChainOfCustodyTimeline({
  locations, exhibitions, gettyRecords, gaps, artist, creationYear, artwork,
}: ChainOfCustodyTimelineProps) {
  const { custody, loans, unmatchedSales, gaps: chainGaps } = buildChainLayout(locations, exhibitions, gettyRecords, gaps, artist, creationYear)
  const isEmpty = custody.length === 0 && loans.length === 0 && unmatchedSales.length === 0 && chainGaps.length === 0

  if (isEmpty) {
    return (
      <div style={{ padding: 18, borderRadius: 8, background: GAL.surface, border: `1px dashed ${GAL.borderMid}`, fontFamily: 'var(--font-ui)' }}>
        <span style={eyebrow}>Provenance gap</span>
        <p style={{ fontSize: '0.82rem', color: GAL.textMuted, lineHeight: 1.55, margin: '10px 0 8px' }}>
          No documented custody records for this work yet.
        </p>
        <a href="/feedback" style={{ fontSize: '0.75rem', color: GAL.clay, textDecoration: 'none', borderBottom: `1px solid ${GAL.border}` }}>
          Help complete the record →
        </a>
      </div>
    )
  }

  const leadingGaps = chainGaps.filter(g => g.afterIndex === -1)
  const branchGap = { marginLeft: 22, borderLeft: `2px dashed ${GAL.sage}`, paddingLeft: 12 }

  // One spine dot + its content block.
  const dotStyle = (fill: string, border: string): CSSProperties => ({
    position: 'absolute', left: SPINE_LEFT - DOT / 2, top: 4,
    width: DOT, height: DOT, borderRadius: '50%', background: fill, border: `2px solid ${border}`,
  })

  return (
    <section aria-label="Chain of custody timeline">
      <div style={{ ...eyebrow, marginBottom: 12 }}>Chain of custody</div>

      {/* Legend — identity is never colour-alone (each item is labelled). */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '0 0 22px', fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: GAL.textMuted }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${GAL.gold}`, background: GAL.bg }} /> Custody</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 11, height: 11, borderRadius: '50%', background: GAL.sage }} /> Loan (not a move)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ color: accent.dealer }}>◆</span> Sale — how custody changed</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 13, height: 11, borderRadius: 2, border: `1px dashed ${GAL.borderMid}`, background: `repeating-linear-gradient(135deg, ${GAL.surface2} 0 3px, transparent 3px 6px)` }} /> Gap</span>
      </div>

      {/* The spine + ordered events. The dots/spine live in the left gutter; each
          li pads its content clear of them so the year text never sits under a dot. */}
      <ol style={{ position: 'relative', listStyle: 'none', margin: 0, padding: 0 }}>
        {/* spine line */}
        <span aria-hidden style={{ position: 'absolute', left: SPINE_LEFT - 1, top: 6, bottom: 10, width: 2, background: GAL.borderMid }} />

        {leadingGaps.map((g, i) => (
          <li key={`lead-${i}`} style={{ position: 'relative', paddingLeft: SPINE_LEFT + 22, paddingBottom: 22 }}><GapBand gap={g} /></li>
        ))}

        {custody.map((node, i) => {
          const attachedLoans = loans.filter(l => l.anchorIndex === i)
          const attachedSales = unmatchedSales.filter(s => s.anchorIndex === i)
          const following = chainGaps.filter(g => g.afterIndex === i)
          return (
            <li key={`c-${i}`} style={{ position: 'relative', paddingLeft: SPINE_LEFT + 22, paddingBottom: 22 }}>
              <span aria-hidden style={dotStyle(GAL.bg, GAL.gold)} />
              <EventBody node={node} tag={custodyTag(node)} tagColor={GAL.gold} artwork={artwork} />

              {attachedSales.map((s, si) => (
                <div key={`s-${si}`} style={{ position: 'relative', marginTop: 14 }}>
                  <EventBody node={s} tag="Sale" tagColor={accent.dealer} artwork={artwork} />
                </div>
              ))}

              {attachedLoans.map((l, li) => (
                <div key={`l-${li}`} style={{ position: 'relative', marginTop: 14, ...branchGap }}>
                  <span aria-hidden style={{ position: 'absolute', left: -24, top: 6, width: 12, height: 12, borderRadius: '50%', background: GAL.sage }} />
                  <EventBody node={l} tag="Loan · not a move" tagColor={GAL.sage} artwork={artwork} />
                </div>
              ))}

              {following.map((g, gi) => (
                <div key={`g-${gi}`} style={{ marginTop: 14 }}><GapBand gap={g} /></div>
              ))}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function custodyTag(node: ChainNode): string {
  if (node.detail === 'Origin — the artist') return 'Custody · origin'
  const t = node.type
  if (t === 'gift') return 'Custody · bequest'
  if (t === 'acquisition') return 'Custody · acquired'
  return 'Custody'
}
