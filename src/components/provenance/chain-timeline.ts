/**
 * Pure layout logic for ChainOfCustodyTimeline (docs/design/timeline-hero-spec.md
 * §4.1–4.3, ADR 0004). Builds on `buildUnifiedTimeline` (timeline.ts) — the single
 * source of truth for event derivation (artist-origin ordering, held-until
 * inference, confidence, sourcing) — and adds what that function doesn't do:
 * partition events into the spec's three lanes (custody spine / loan branch /
 * dealer mark) and place each documented gap in the custody sequence.
 *
 * Honesty: this module never invents a date. A gap with a null `from`/`to` is
 * marked `openStart`/`openEnd` rather than guessing a bound; `afterIndex` is
 * derived only from dates already present on custody events.
 */
import type { LocationEntry, ExhibitionLoan, GettyRecord, GapEntry } from '@/lib/types'
import { buildUnifiedTimeline, type ProvenanceEvent } from './timeline'

export type ChainLane = 'custody' | 'loan' | 'dealer'

/** One event positioned on a lane of the chain-of-custody timeline. */
export interface ChainNode extends ProvenanceEvent {
  lane: ChainLane
  /**
   * For loan/dealer nodes: index into `ChainLayout.custody` this node visually
   * anchors to (the custody point it branches from and returns to, per §4.1).
   * -1 when it precedes every dated custody node.
   */
  anchorIndex: number
}

/** A documented gap (`GapEntry`) placed in the custody sequence. */
export interface ChainGap extends GapEntry {
  /** Index into `ChainLayout.custody` this gap immediately follows. -1 = before the first dated custody node. */
  afterIndex: number
  /** `from` was null — the gap fades toward the unknown edge rather than a hard start. */
  openStart: boolean
  /** `to` was null — the gap fades toward the unknown edge rather than a hard end. */
  openEnd: boolean
}

export interface ChainLayout {
  custody: ChainNode[]
  loans: ChainNode[]
  dealers: ChainNode[]
  gaps: ChainGap[]
}

function laneOf(type: ProvenanceEvent['type']): ChainLane | null {
  if (type === 'exhibition') return 'loan'
  if (type === 'dealer') return 'dealer'
  if (type === 'gap') return null // buildUnifiedTimeline never emits this variant today; excluded defensively
  return 'custody' // custody | gift | acquisition — all part of the unbroken ownership spine
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
  for (const ev of merged) {
    if (laneOf(ev.type) === 'custody') custody.push({ ...ev, lane: 'custody', anchorIndex: -1 })
  }

  const loans: ChainNode[] = []
  const dealers: ChainNode[] = []
  for (const ev of merged) {
    const lane = laneOf(ev.type)
    if (lane === 'loan') loans.push({ ...ev, lane, anchorIndex: anchorTo(custody, ev.sortKey) })
    else if (lane === 'dealer') dealers.push({ ...ev, lane, anchorIndex: anchorTo(custody, ev.sortKey) })
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

  return { custody, loans, dealers, gaps: chainGaps }
}
