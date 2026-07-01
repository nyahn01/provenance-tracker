'use client'

/**
 * ChainOfCustodyTimeline — the chronological chain-of-custody timeline
 * (docs/design/timeline-hero-spec.md §4.1–4.4, ADR 0004). Stage 1 of #115: this
 * component is built to the full hero spec but is integrated here into the
 * existing detail panel (a ~460px gallery sidebar) rather than the landing hero
 * — that swap is Stage 2. On a wide host it lays out horizontally per the spec;
 * in the current narrow panel it renders as the spec's own mobile fallback
 * (vertical stack, top = earliest).
 *
 * Honesty (spec §7): no line/animation bridges a gap — every `GapEntry` renders
 * as an explicit, labeled span, drawn to scale where dates allow. Loans branch
 * off the custody spine and return to it without ever advancing it. Every node
 * carries a source badge. Reduced motion falls back to the global
 * `@media (prefers-reduced-motion: reduce)` rule in globals.css.
 */
import { useEffect, useRef, useState } from 'react'
import type { LocationEntry, ExhibitionLoan, GapEntry, GettyRecord, ArtworkMeta } from '@/lib/types'
import { OBS, motion, accent } from '@/lib/design-tokens'
import { buildChainLayout, type ChainNode, type ChainGap } from './chain-timeline'
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
  /** Identifies the work for building a deep link to its own source record. */
  artwork: Pick<ArtworkMeta, 'id' | 'source'>
}

type Tag = 'CUSTODY' | 'LOAN' | 'SALE'

interface LaneItem { node: ChainNode; tag: Tag; tagColor: string; key: string }

const CONFIDENCE_LABEL: Record<ChainNode['confidence'], string> = {
  high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence',
}

function useIsWide(breakpoint = 700) {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`)
    setWide(mq.matches)
    const onChange = () => setWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [breakpoint])
  return wide
}

const eyebrowStyle = {
  fontFamily: 'var(--font-ui)', fontSize: '0.7rem', fontWeight: 600,
  letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: OBS.textFaint,
}

export function ChainOfCustodyTimeline({
  locations, exhibitions, gettyRecords, gaps, artist, creationYear, artwork,
}: ChainOfCustodyTimelineProps) {
  const { custody, loans, dealers, gaps: chainGaps } = buildChainLayout(locations, exhibitions, gettyRecords, gaps, artist, creationYear)
  const isWide = useIsWide()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [assembled, setAssembled] = useState(false)
  const stepRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // "The chain assembles" (spec §3): trigger the CSS transition one tick after
  // mount so nodes fade/draw in oldest→newest instead of arriving pre-assembled.
  // Reduced motion collapses this via the global CSS rule in globals.css.
  useEffect(() => {
    const id = requestAnimationFrame(() => setAssembled(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const custodyItems: LaneItem[] = custody.map((node, i) => ({ node, tag: 'CUSTODY', tagColor: OBS.gold, key: `custody-${i}` }))
  const loanItems: LaneItem[] = loans.map((node, i) => ({ node, tag: 'LOAN', tagColor: OBS.sage, key: `loan-${i}` }))
  const dealerItems: LaneItem[] = dealers.map((node, i) => ({ node, tag: 'SALE', tagColor: accent.dealer, key: `dealer-${i}` }))
  const allItems = [...custodyItems, ...loanItems, ...dealerItems]

  const isEmpty = allItems.length === 0 && chainGaps.length === 0

  // Chronological step order for Arrow-key navigation (§6). Gap "Help complete
  // the record" links keep normal tab order — not part of this roving sequence.
  const stepOrder = [...allItems].sort((a, b) => a.node.sortKey - b.node.sortKey).map(i => i.key)

  // Cumulative "chain assembles" delay (§3): each step advances the clock by
  // `stagger.chain`; a gap additionally holds a ~250ms beat before the next item.
  // Built as one merged, time-ordered pass over nodes + gaps so a gap in the
  // middle of the chain pushes back everything after it, not just itself.
  type Timed = { key: string; sortKey: number; isGap: boolean }
  const timedSequence: Timed[] = [
    ...allItems.map(i => ({ key: i.key, sortKey: i.node.sortKey, isGap: false })),
    ...chainGaps.map((g, gi) => ({
      key: `gap-${gi}`,
      // Position a gap just after the custody node it follows (or at the very
      // start when it precedes every dated node) — never a fabricated date.
      sortKey: g.afterIndex >= 0 ? custody[g.afterIndex].sortKey + 0.5 : -Infinity,
      isGap: true,
    })),
  ].sort((a, b) => a.sortKey - b.sortKey)

  const delayByKey = new Map<string, number>()
  let clock = 0
  for (const item of timedSequence) {
    delayByKey.set(item.key, clock)
    clock += motion.stagger.chain
    if (item.isGap) clock += 250
  }

  function stepTo(fromKey: string, delta: number) {
    const idx = stepOrder.indexOf(fromKey)
    if (idx === -1) return
    const nextKey = stepOrder[idx + delta]
    if (nextKey) stepRefs.current[nextKey]?.focus()
  }

  function StepCard({ item }: { item: LaneItem }) {
    const { node, tag, tagColor, key } = item
    const isSelected = selectedKey === key
    const recordUrl = sourceRecordUrl(node.sourceUrl, node.source, artwork)
    return (
      <button
        ref={el => { stepRefs.current[key] = el }}
        type="button"
        onClick={() => setSelectedKey(s => (s === key ? null : key))}
        onKeyDown={e => {
          const forward = isWide ? 'ArrowRight' : 'ArrowDown'
          const back = isWide ? 'ArrowLeft' : 'ArrowUp'
          if (e.key === forward) { e.preventDefault(); stepTo(key, 1) }
          else if (e.key === back) { e.preventDefault(); stepTo(key, -1) }
        }}
        style={{
          display: 'block', textAlign: 'left', width: '100%', cursor: 'pointer',
          background: OBS.surface, border: `1px solid ${isSelected ? OBS.clay : OBS.border}`,
          borderRadius: 8, padding: 14, fontFamily: 'var(--font-ui)',
          transitionProperty: 'opacity, transform, border-color',
          transitionDuration: `${motion.dur.event}ms`, transitionTimingFunction: motion.ease.standard,
          transitionDelay: `${delayByKey.get(key) ?? 0}ms`,
          opacity: assembled ? 1 : 0, transform: assembled ? 'translateY(0)' : 'translateY(6px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '-0.01em', color: OBS.text }}>
            {node.year}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: tagColor }}>
            {tag}
          </span>
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: OBS.text, lineHeight: 1.4 }}>{node.who}</div>
        {node.where && (
          <div style={{ fontSize: '0.8rem', color: OBS.textMuted, marginTop: 2 }}>
            {node.where}
            {node.unmapped && <span style={{ color: OBS.textFaint, fontStyle: 'italic' }}> — no coordinates in source</span>}
          </div>
        )}
        {node.detail && <div style={{ fontSize: '0.78rem', color: OBS.textMuted, marginTop: 3, lineHeight: 1.4 }}>{node.detail}</div>}
        {node.price && <div style={{ fontSize: '0.72rem', color: OBS.textFaint, marginTop: 3 }}>{node.price}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <SourceBadge source={node.source} />
          <span title={CONFIDENCE_LABEL[node.confidence]}>
            <ConfidenceDot confidence={node.confidence} />
          </span>
          {recordUrl && (
            <a
              href={recordUrl}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ fontSize: '0.68rem', color: OBS.textFaint, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}
            >
              record ↗
            </a>
          )}
        </div>
      </button>
    )
  }

  function GapSpan({ gap, gapKey }: { gap: ChainGap; gapKey: string }) {
    const years = gap.openStart && gap.openEnd ? 'undocumented'
      : gap.openStart ? `until ${gap.to}`
      : gap.openEnd ? `${gap.from} onward`
      : `${gap.from}–${gap.to}`
    // Open-ended gaps fade toward the unknown edge rather than a hard cap (§4.3).
    const fade = gap.openStart
      ? 'linear-gradient(to bottom, transparent, black 45%)'
      : gap.openEnd
      ? 'linear-gradient(to top, transparent, black 45%)'
      : 'none'
    return (
      <div
        role="group"
        aria-label={`Provenance gap, ${years}. ${gap.note}`}
        style={{
          padding: 16, borderRadius: 8, fontFamily: 'var(--font-ui)',
          background: `repeating-linear-gradient(135deg, ${OBS.gapWeave} 0 6px, transparent 6px 12px)`,
          WebkitMaskImage: fade, maskImage: fade,
          border: `1px dashed ${OBS.borderMid}`,
          transitionProperty: 'opacity, transform', transitionDuration: `${motion.dur.event}ms`,
          transitionTimingFunction: motion.ease.standard, transitionDelay: `${delayByKey.get(gapKey) ?? 0}ms`,
          opacity: assembled ? 1 : 0, transform: assembled ? 'translateY(0)' : 'translateY(6px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={eyebrowStyle}>Provenance gap</span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: OBS.text }}>{years}</span>
        </div>
        <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: OBS.textMuted, lineHeight: 1.5, margin: '0 0 8px' }}>{gap.note}</p>
        <a href="/feedback" style={{ fontSize: '0.75rem', color: OBS.clay, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}`, paddingBottom: 1 }}>
          Help complete the record →
        </a>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div style={{ padding: 18, borderRadius: 8, background: OBS.surface, border: `1px dashed ${OBS.borderMid}`, fontFamily: 'var(--font-ui)' }}>
        <span style={eyebrowStyle}>Provenance gap</span>
        <p style={{ fontSize: '0.8rem', color: OBS.textMuted, lineHeight: 1.55, margin: '10px 0 8px' }}>
          No documented custody records for this work yet.
        </p>
        <a href="/feedback" style={{ fontSize: '0.75rem', color: OBS.clay, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
          Help complete the record →
        </a>
      </div>
    )
  }

  const leadingGaps = chainGaps.filter(g => g.afterIndex === -1)

  return (
    <section aria-label="Chain of custody timeline" style={{ background: OBS.surface, border: `1px solid ${OBS.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ ...eyebrowStyle, marginBottom: 14 }}>Chain of custody</div>
      <div style={{ display: 'flex', flexDirection: isWide ? 'row' : 'column', gap: 10, overflowX: isWide ? 'auto' : 'visible' }}>
        {leadingGaps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: isWide ? '0 0 220px' : undefined }}>
            {leadingGaps.map((g, gi) => <GapSpan key={`gap-lead-${gi}`} gap={g} gapKey={`gap-${chainGaps.indexOf(g)}`} />)}
          </div>
        )}
        {custody.map((_, i) => {
          const custodyItem = custodyItems[i]
          const attachedLoans = loanItems.filter(l => l.node.anchorIndex === i)
          const attachedDealers = dealerItems.filter(d => d.node.anchorIndex === i)
          const followingGaps = chainGaps.filter(g => g.afterIndex === i)
          return (
            <div key={custodyItem.key} style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: isWide ? '0 0 240px' : undefined }}>
              <StepCard item={custodyItem} />
              {attachedLoans.map(item => (
                <div key={item.key} style={{ marginLeft: isWide ? 0 : 16, borderLeft: isWide ? 'none' : `2px dashed ${OBS.sage}`, paddingLeft: isWide ? 0 : 10 }}>
                  <StepCard item={item} />
                </div>
              ))}
              {attachedDealers.map(item => (
                <div key={item.key} style={{ marginLeft: isWide ? 0 : 16, borderLeft: isWide ? 'none' : `2px dashed ${accent.dealer}`, paddingLeft: isWide ? 0 : 10 }}>
                  <StepCard item={item} />
                </div>
              ))}
              {followingGaps.map(g => <GapSpan key={`gap-${chainGaps.indexOf(g)}`} gap={g} gapKey={`gap-${chainGaps.indexOf(g)}`} />)}
            </div>
          )
        })}
      </div>
    </section>
  )
}
