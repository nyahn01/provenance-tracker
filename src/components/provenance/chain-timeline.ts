/**
 * Pure layout logic for ChainOfCustodyTimeline (docs/design/timeline-hero-spec.md
 * §4.1–4.3, ADR 0004). Builds on `buildUnifiedTimeline` (timeline.ts) — the single
 * source of truth for event derivation (artist-origin ordering, held-until
 * inference, confidence, sourcing) — and adds what that function doesn't do:
 * partition events into custody vs. loan lanes, FOLD documented dealer sales into
 * the custody entry they created (so a sale annotates an owner instead of
 * appearing as a duplicate card), and place each documented gap in the sequence.
 *
 * Honesty: this module never invents a date. A gap with a null `from`/`to` is
 * marked `openStart`/`openEnd` rather than guessing a bound; `afterIndex` is
 * derived only from dates already present on custody events. A sale is folded
 * into a custody owner ONLY on a real name match — never fabricated.
 */
import type { LocationEntry, ExhibitionLoan, GettyRecord, GapEntry } from '@/lib/types'
import { buildUnifiedTimeline, sameName, type ProvenanceEvent } from './timeline'

export type ChainLane = 'custody' | 'loan'

/** A documented dealer transaction folded into the custody owner it created. */
export interface SaleAnnotation {
  year: string
  /** "seller → buyer" trail, when known. */
  via?: string
  price?: string
  source: string
  sourceUrl?: string
}

/** One event positioned on the chain-of-custody timeline. */
export interface ChainNode extends ProvenanceEvent {
  lane: ChainLane
  /**
   * For loan nodes: index into `ChainLayout.custody` this node visually anchors
   * to (the custody point it branches from and returns to, per §4.1). -1 when it
   * precedes every dated custody node.
   */
  anchorIndex: number
  /** Documented sales folded into this custody owner (dedup — see buildChainLayout). */
  sales?: SaleAnnotation[]
}

/** A documented gap (`GapEntry`) placed in the custody sequence. */
export interface ChainGap extends GapEntry {
  /** Index into `ChainLayout.custody` this gap immediately follows. -1 = before the first dated custody node. */
  afterIndex: number
  openStart: boolean
  openEnd: boolean
}

export interface ChainLayout {
  custody: ChainNode[]
  loans: ChainNode[]
  /** Dealer sales that could NOT be matched to a named custody owner — kept as
   *  their own honest entries rather than dropped. Most sales fold into custody. */
  unmatchedSales: ChainNode[]
  gaps: ChainGap[]
}

function laneOf(type: ProvenanceEvent['type']): ChainLane | 'dealer' | null {
  if (type === 'exhibition') return 'loan'
  if (type === 'dealer') return 'dealer'
  if (type === 'gap') return null
  return 'custody' // custody | gift | acquisition — the unbroken ownership spine
}

/** Anchor a non-custody event (or a gap) to the last custody node dated at or before it. */
function anchorTo(custody: ChainNode[], sortKey: number): number {
  let idx = -1
  for (let i = 0; i < custody.length; i++) {
    if (custody[i].sortKey <= sortKey) idx = i
  }
  return idx
}

function yearOf(date: string | null): number | null {
  if (!date) return null
  const m = date.match(/\d{4}/)
  return m ? parseInt(m[0], 10) : null
}

export function buildChainLayout(
  locations: LocationEntry[],
  exhibitions: ExhibitionLoan[],
  gettyRecords: GettyRecord[],
  gaps: GapEntry[],
  artist?: string | null,
  creationYear?: number | null,
): ChainLayout {
  const merged = buildUnifiedTimeline(locations, exhibitions, gettyRecords, artist, creationYear)

  const custody: ChainNode[] = []
  const loans: ChainNode[] = []
  const dealers: ChainNode[] = []
  for (const ev of merged) {
    const lane = laneOf(ev.type)
    if (lane === 'custody') custody.push({ ...ev, lane: 'custody', anchorIndex: -1 })
    else if (lane === 'loan') loans.push({ ...ev, lane: 'loan', anchorIndex: -1 })
    else if (lane === 'dealer') dealers.push({ ...ev, lane: 'custody', anchorIndex: -1 })
  }

  // Anchor loans to the custody point they branch from.
  for (const l of loans) l.anchorIndex = anchorTo(custody, l.sortKey)

  // Fold each dealer sale into the custody owner it created (dedup): a sale whose
  // buyer/holder name matches a custody owner within a small date window becomes an
  // annotation on that owner instead of a duplicate card. Unmatched sales are kept.
  const unmatchedSales: ChainNode[] = []
  for (const d of dealers) {
    const match = custody.find(c =>
      sameName(c.who, d.who) && Math.abs(c.sortKey - d.sortKey) <= 2,
    )
    const sale: SaleAnnotation = {
      year: d.year, via: d.detail, price: d.price, source: d.source, sourceUrl: d.sourceUrl,
    }
    if (match) {
      ;(match.sales ??= []).push(sale)
    } else {
      unmatchedSales.push({ ...d, anchorIndex: anchorTo(custody, d.sortKey) })
    }
  }

  const chainGaps: ChainGap[] = gaps.map(g => {
    const fromYear = yearOf(g.from)
    return {
      ...g,
      afterIndex: fromYear != null ? anchorTo(custody, fromYear) : -1,
      openStart: g.from == null,
      openEnd: g.to == null,
    }
  })

  return { custody, loans, unmatchedSales, gaps: chainGaps }
}
