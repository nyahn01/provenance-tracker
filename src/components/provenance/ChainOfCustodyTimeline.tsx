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
import { useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent } from 'react'
import type { LocationEntry, ExhibitionLoan, GapEntry, GettyRecord, ArtworkMeta } from '@/lib/types'
import { GAL, accent, motion } from '@/lib/design-tokens'
import { buildChainLayout, buildChainScale, CAPTION_MIN_YEARS, type ChainLayout, type ChainNode, type ChainGap, type SaleAnnotation } from './chain-timeline'
import { sourceRecordUrl } from './timeline'
import { SourceCard } from './SourceCard'
import { SourceLine } from './SourceLine'
import { ConfidenceDot } from './ConfidenceDot'

interface ChainOfCustodyTimelineProps {
  /**
   * A pre-built layout (case-study pages: `buildCaseChainLayout(case)`) bypasses
   * `locations`/`exhibitions`/`gettyRecords`/`gaps`/`artist`/`creationYear`
   * entirely — pass either `layout` OR the museum-data props, never both.
   */
  layout?: ChainLayout
  locations?: LocationEntry[]
  exhibitions?: ExhibitionLoan[]
  gettyRecords?: GettyRecord[]
  gaps?: GapEntry[]
  artist?: string | null
  creationYear?: number | null
  /** Unused in case-study mode (case sources carry their own direct links). */
  artwork?: Pick<ArtworkMeta, 'id' | 'source'>
}

const CONFIDENCE_LABEL: Record<ChainNode['confidence'], string> = {
  high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence',
}

/**
 * Case-study kind → dot/tag color. `coerced`→clay and `gap`→gap-neutral are an
 * already-shipping exception to "clay is interaction-only" for this one honesty-
 * critical content type (case-studies.ts's own KIND_STYLE, unchanged by this
 * reuse) — not a new deviation introduced here.
 */
const CASE_KIND_STYLE: Record<NonNullable<ChainNode['caseKind']>, { color: string; label: string }> = {
  custody: { color: GAL.gold, label: 'Custody' },
  coerced: { color: GAL.clay, label: 'Coerced transfer' },
  gap: { color: GAL.gapWeave, label: 'Gap in legitimate title' },
  restitution: { color: GAL.sage, label: 'Restitution' },
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
  node: ChainNode; tag: string; tagColor: string; artwork?: Pick<ArtworkMeta, 'id' | 'source'>
}) {
  // Case-study nodes carry full citations (caseSources) and never a museum
  // record URL — artwork is never passed for them, so skip this lookup.
  const recordUrl = node.caseSources || !artwork ? null : sourceRecordUrl(node.sourceUrl, node.source, artwork)
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', letterSpacing: '-0.01em', color: GAL.text }}>{node.year}</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tagColor }}>{tag}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.95rem', fontWeight: 500, color: GAL.text, marginTop: 4, lineHeight: 1.35 }}>{node.who}</div>
      {node.where ? (
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: GAL.textMuted, marginTop: 1 }}>
          {node.where}{node.unmapped && <span style={{ color: GAL.textFaint, fontStyle: 'italic' }}> — no coordinates in source</span>}
        </div>
      ) : node.caseSources && (
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: GAL.textFaint, marginTop: 1, fontStyle: 'italic' }}>
          Location not documented
        </div>
      )}
      {node.detail && <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: GAL.textMuted, marginTop: 3, lineHeight: 1.4 }}>{node.detail}</div>}
      {node.sales?.map((s, i) => <div key={i}><SaleTag sale={s} /></div>)}
      {node.caseSources ? (
        <SourceLine sources={node.caseSources} />
      ) : (
        // SourceCard folds the badge + record link into one hover/focus-
        // disclosed control (ADR 0006 follow-up #2) — calm at rest, full
        // attribution on inspection, instead of an always-visible "record ↗".
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8 }}>
          <SourceCard source={node.source} recordUrl={recordUrl} />
          <span title={CONFIDENCE_LABEL[node.confidence]}><ConfidenceDot confidence={node.confidence} /></span>
        </div>
      )}
    </>
  )
}

function GapBand({ gap, heightPx }: { gap: ChainGap; heightPx?: number }) {
  const years = gap.openStart && gap.openEnd ? 'undocumented'
    : gap.openStart ? `until ${gap.to}`
    : gap.openEnd ? `${gap.from} onward`
    : `${gap.from}–${gap.to}`
  return (
    <div role="group" aria-label={`Provenance gap, ${years}. ${gap.note}`}
      style={{
        // Drawn to scale (spec §4.3): the weave stretches to the gap's measured
        // span, so a long silence is physically larger than a short one. The label
        // stays at the top; the empty span below reads as the undocumented years.
        minHeight: heightPx, padding: '12px 14px', borderRadius: 8, fontFamily: 'var(--font-ui)',
        // The gap weave (spec §2): texture in the gapWeave neutral, never a data hue.
        background: `repeating-linear-gradient(135deg, ${GAL.gapWeave}55 0 6px, transparent 6px 12px)`,
        border: `1px dashed ${GAL.borderMid}`,
      }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={eyebrow}>Provenance gap</span>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.05rem', color: GAL.text }}>{years}</span>
      </div>
      <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: GAL.textMuted, lineHeight: 1.5, margin: '5px 0 0' }}>
        {gap.note}
        {!gap.caseSources && (
          <>{' '}<a href="/feedback" style={{ color: GAL.clay, textDecoration: 'none', borderBottom: `1px solid ${GAL.border}`, fontStyle: 'normal' }}>Help complete the record →</a></>
        )}
      </p>
      {/* Case-study gaps cite their sources instead of inviting a crowd-sourced
          fix — a documented historical gap isn't something a visitor "completes." */}
      {gap.caseSources && <SourceLine sources={gap.caseSources} />}
    </div>
  )
}

export function ChainOfCustodyTimeline({
  layout, locations, exhibitions, gettyRecords, gaps, artist, creationYear, artwork,
}: ChainOfCustodyTimelineProps) {
  const { custody, loans, unmatchedSales, gaps: chainGaps } = layout
    ?? buildChainLayout(locations ?? [], exhibitions ?? [], gettyRecords ?? [], gaps ?? [], artist, creationYear)
  // Case mode (layout passed directly) uses its own kind-driven legend (custody/
  // coerced/gap/restitution) instead of the museum-explorer legend (custody/loan/
  // sale/gap) — the two content types have different honesty categories to show.
  const isCaseMode = layout != null
  // To-scale time axis (spec §4.1/§4.3): proportional spacing + gaps drawn to span.
  const { spacerPx, intervalYears, gapHeightPx } = buildChainScale(custody, chainGaps)
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

  // Keyboard step-through: a roving tabIndex over every event in visual order
  // (leading gaps → each custody node → its sales/loans/gaps → the next node).
  // Only the active step sits in the natural Tab order; Left/Up and Right/Down
  // move between steps; Enter/Space hands focus to the step's first link or
  // button (the source citation), so a keyboard user reaches the same
  // attribution a mouse user gets by hovering. The visible ring is the
  // sitewide `:focus-visible` rule (globals.css) — no new CSS.
  const [activeStep, setActiveStep] = useState(0)
  const stepRefs = useRef<(HTMLElement | null)[]>([])
  let stepIndex = 0

  function focusStep(i: number) {
    const clamped = Math.max(0, Math.min(i, stepRefs.current.length - 1))
    stepRefs.current[clamped]?.focus()
    setActiveStep(clamped)
  }

  function stepProps(ariaLabel?: string) {
    const idx = stepIndex++
    return {
      ref: (el: HTMLElement | null) => { stepRefs.current[idx] = el },
      tabIndex: idx === activeStep ? 0 : -1,
      ...(ariaLabel ? { role: 'group' as const, 'aria-label': ariaLabel } : {}),
      onFocus: (e: FocusEvent) => { e.stopPropagation(); setActiveStep(idx) },
      // A sale/loan/gap step is nested inside its custody <li>, which is itself a
      // step — stop propagation so the keydown doesn't also fire the ancestor's
      // handler (which would immediately undo the just-made move).
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); focusStep(idx + 1) }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); focusStep(idx - 1) }
        else if (e.key === 'Enter' || e.key === ' ') {
          const target = stepRefs.current[idx]?.querySelector<HTMLElement>('a[href], button')
          if (target) { e.preventDefault(); e.stopPropagation(); target.focus() }
        }
      },
    }
  }

  // A faint interval measure centered in the proportional empty span — the light
  // reference that makes the to-scale spacing legible AS an axis (a Tufte
  // micro-annotation), shown only for spans worth calling out (spec §4.1).
  const intervalCaption: CSSProperties = {
    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
    fontFamily: 'var(--font-ui)', fontSize: '0.6rem', letterSpacing: '0.08em',
    color: GAL.textFaint, whiteSpace: 'nowrap',
  }

  // One spine dot + its content block. The dot anchors to the <li> gutter, so it
  // must NOT live inside the animated (transformed) content div — a CSS transform
  // makes that div the containing block, which would shift `left` by the li's
  // padding and drop the dot on top of the year text (the #156 overlap bug).
  const dotStyle = (fill: string, border: string): CSSProperties => ({
    position: 'absolute', left: SPINE_LEFT - DOT / 2, top: 4,
    width: DOT, height: DOT, borderRadius: '50%', background: fill, border: `2px solid ${border}`,
  })

  // The sale ◆ (legend: "Sale — how custody changed"). A standalone sale block is
  // itself transformed (it animates), so it is its own containing block: offset
  // the marker back from its content-box origin (at paddingLeft) to the spine.
  const SALE_MARK = DOT - 2
  const saleMarkStyle: CSSProperties = {
    position: 'absolute', left: SPINE_LEFT - (SPINE_LEFT + 22) - SALE_MARK / 2, top: 6,
    width: SALE_MARK, height: SALE_MARK, background: accent.dealer, transform: 'rotate(45deg)', borderRadius: 2,
  }

  // "The chain assembles" (spec §3): each event fades up oldest→newest with a
  // 90ms stagger; a gap holds an extra 250ms beat before the chain resumes.
  // Delays are computed in render order from props — deterministic, so the SSG
  // HTML matches hydration and stays fully crawlable. Reduced-motion collapses
  // both duration AND delay via the global kill switch in globals.css.
  let assembleDelay = 0
  const assemble = (isGap = false): CSSProperties => {
    const style: CSSProperties = {
      animation: `fade-up ${motion.dur.event}ms ${motion.ease.standard} both`,
      animationDelay: `${assembleDelay}ms`,
    }
    assembleDelay += motion.stagger.chain + (isGap ? motion.stagger.gapBeat : 0)
    return style
  }

  return (
    <section aria-label="Chain of custody timeline">
      <div style={{ ...eyebrow, marginBottom: 12 }}>Chain of custody</div>

      {/* Legend — identity is never colour-alone (each item is labelled). */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '0 0 22px', fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: GAL.textMuted }}>
        {isCaseMode ? (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${CASE_KIND_STYLE.custody.color}`, background: GAL.bg }} /> {CASE_KIND_STYLE.custody.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${CASE_KIND_STYLE.coerced.color}`, background: GAL.bg }} /> {CASE_KIND_STYLE.coerced.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${CASE_KIND_STYLE.gap.color}`, background: GAL.bg }} /> {CASE_KIND_STYLE.gap.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${CASE_KIND_STYLE.restitution.color}`, background: GAL.bg }} /> {CASE_KIND_STYLE.restitution.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 11, height: 11, borderRadius: '50%', background: GAL.sage }} /> Loan (not a move)</span>
          </>
        ) : (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${GAL.gold}`, background: GAL.bg }} /> Custody</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 11, height: 11, borderRadius: '50%', background: GAL.sage }} /> Loan (not a move)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ color: accent.dealer }}>◆</span> Sale — how custody changed</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><i style={{ width: 13, height: 11, borderRadius: 2, border: `1px dashed ${GAL.borderMid}`, background: `repeating-linear-gradient(135deg, ${GAL.surface2} 0 3px, transparent 3px 6px)` }} /> Gap</span>
          </>
        )}
      </div>

      {/* The spine + ordered events. The dots/spine live in the left gutter; each
          li pads its content clear of them so the year text never sits under a dot. */}
      <ol style={{ position: 'relative', listStyle: 'none', margin: 0, padding: 0 }}>
        {/* spine line */}
        <span aria-hidden style={{ position: 'absolute', left: SPINE_LEFT - 1, top: 6, bottom: 10, width: 2, background: GAL.borderMid }} />

        {leadingGaps.map((g, i) => (
          <li key={`lead-${i}`} style={{ position: 'relative', paddingLeft: SPINE_LEFT + 22, paddingBottom: 22, ...assemble(true) }} {...stepProps()}><GapBand gap={g} heightPx={gapHeightPx.get(g)} /></li>
        ))}

        {custody.map((node, i) => {
          const attachedLoans = loans.filter(l => l.anchorIndex === i)
          const attachedSales = unmatchedSales.filter(s => s.anchorIndex === i)
          const following = chainGaps.filter(g => g.afterIndex === i)
          // Proportional empty span to the next event — but only when no gap
          // follows (a gap already carries that span, drawn to scale).
          const gapFollows = following.length > 0
          const years = intervalYears[i]
          const showCaption = !gapFollows && years != null && years >= CAPTION_MIN_YEARS
          const kindStyle = node.caseKind ? CASE_KIND_STYLE[node.caseKind] : null
          const dotColor = kindStyle?.color ?? GAL.gold
          const tag = kindStyle?.label ?? custodyTag(node)
          return (
            <li key={`c-${i}`} style={{ position: 'relative', paddingLeft: SPINE_LEFT + 22 }} {...stepProps(`${node.year}, ${tag}. ${node.who}${node.where ? `, ${node.where}` : ''}.`)}>
              {/* Gutter dot anchors to the <li> (non-transformed), never inside the animated div. */}
              <span aria-hidden style={dotStyle(GAL.bg, dotColor)} />
              <div style={assemble()}>
                <EventBody node={node} tag={tag} tagColor={dotColor} artwork={artwork} />
              </div>

              {attachedSales.map((s, si) => (
                <div key={`s-${si}`} style={{ position: 'relative', marginTop: 14, ...assemble() }} {...stepProps(`${s.year}, sale. ${s.who}.`)}>
                  <span aria-hidden style={saleMarkStyle} />
                  <EventBody node={s} tag="Sale" tagColor={accent.dealer} artwork={artwork} />
                </div>
              ))}

              {attachedLoans.map((l, li) => (
                // Gutter dot anchors to this non-animated wrapper — same reason as the
                // custody dot (#156): a div carrying assemble()'s fade-up animation
                // keeps `transform` applied (animation-fill-mode "both"), which makes
                // it its own containing block and throws off an absolutely-positioned
                // child's `left`. The dot sits on the branch's own dashed line (not the
                // main spine) — the loan track visibly branches off custody (spec §4.2).
                <div key={`l-${li}`} style={{ position: 'relative', marginTop: 14 }} {...stepProps(`${l.year}, loan, not a change of ownership. ${l.who}${l.where ? `, ${l.where}` : ''}.`)}>
                  <span aria-hidden style={{ position: 'absolute', left: 17, top: 6, width: 12, height: 12, borderRadius: '50%', background: GAL.sage }} />
                  <div style={{ ...branchGap, ...assemble() }}>
                    <EventBody node={l} tag="Loan · not a move" tagColor={GAL.sage} artwork={artwork} />
                  </div>
                </div>
              ))}

              {following.map((g, gi) => (
                <div key={`g-${gi}`} style={{ marginTop: 14, ...assemble(true) }} {...stepProps()}><GapBand gap={g} heightPx={gapHeightPx.get(g)} /></div>
              ))}

              {/* Proportional spacer — the empty span IS the elapsed time (spec §4.1). */}
              <div aria-hidden style={{ position: 'relative', height: spacerPx[i] }}>
                {showCaption && <span style={intervalCaption}>{years} years</span>}
              </div>
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
