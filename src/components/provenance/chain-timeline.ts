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
import type { LocationEntry, ExhibitionLoan, GettyRecord, GapEntry, RestitutionCase, CaseSource, CaseCustodyEntry } from '@/lib/types'
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
  /**
   * Case-study-only: full legal/archival citations (a restitution case's
   * CaseSource[]), never set for real museum-sourced nodes. When present,
   * ChainOfCustodyTimeline renders the multi-citation SourceLine list instead
   * of the single-tier SourceBadge — a case's sources are court rulings and
   * museum object pages, not one museum-API tier.
   */
  caseSources?: CaseSource[]
  /**
   * Case-study-only: the entry's honesty classification (custody/coerced/gap/
   * restitution) — drives the spine dot and tag color instead of the generic
   * custodyTag() used for museum LocationEntry data. Never set otherwise.
   */
  caseKind?: CaseCustodyEntry['kind']
}

/** A documented gap (`GapEntry`) placed in the custody sequence. */
export interface ChainGap extends GapEntry {
  /** Index into `ChainLayout.custody` this gap immediately follows. -1 = before the first dated custody node. */
  afterIndex: number
  openStart: boolean
  openEnd: boolean
  /**
   * Case-study-only: citations for this gap. When present, ChainOfCustodyTimeline
   * renders them instead of the "Help complete the record" feedback CTA, which
   * is meant for the live interactive explorer's crowd-sourcing flow, not a
   * documented historical case's gap.
   */
  caseSources?: CaseSource[]
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

// ─── To-scale time axis (docs/design/timeline-hero-spec.md §4.1/§4.3) ─────────
// The spine is a real TIME axis, not just a sequence: the empty space after an
// event is proportional to the years until the next one, and a documented gap is
// drawn to its measured span — so a long undocumented silence physically dwarfs a
// two-year hand-off (the honesty requirement: never compress a gap to a point).
//
// "To scale, softly bounded": a strictly linear axis lets a 250-year span shove
// everything off-screen, so px = clamp(min, years × PX_PER_YEAR, max). The clamp
// keeps the mapping MONOTONIC (a bigger interval is always ≥ a smaller one) and
// museum-legible. This is a presentation choice, disclosed in ADR 0006 — it never
// invents a date: an event or gap with no parseable year falls back to a fixed
// dignified step, never a guessed interval.
const PX_PER_YEAR = 2.4
const MIN_STEP = 16      // px — empty space between two adjacent dated events (floor)
const MAX_STEP = 200     // px — ceiling for a non-gap interval (soft bound)
const GAP_MIN = 56       // px — a documented gap always reads as substantial
const GAP_MAX = 320      // px — ceiling for a to-scale gap
const GAP_UNKNOWN_PX = 72 // px — open-ended / undated gap: fixed, dignified, not guessed
const TIGHT = 8          // px — spacer after an event that a gap already follows
export const CAPTION_MIN_YEARS = 15 // only annotate the empty span at/above this

/** A year usable for scaling — excludes the -1 / 9999 "unknown" sentinels. */
function scaleYear(sortKey: number): number | null {
  return sortKey > 0 && sortKey < 9000 ? sortKey : null
}

function clamp(lo: number, v: number, hi: number): number {
  return Math.max(lo, Math.min(v, hi))
}

export interface ChainScale {
  /** Empty px to leave after custody[i] (tight when a gap already follows it). */
  spacerPx: number[]
  /** Whole years from custody[i] to custody[i+1], or null when unknown / last. */
  intervalYears: (number | null)[]
  /** Measured px height for each gap band, keyed by the gap object. */
  gapHeightPx: Map<ChainGap, number>
}

/** Measured height (px) for a single gap band, drawn to its span when known. */
function gapHeight(g: ChainGap): number {
  if (g.openStart || g.openEnd) return GAP_UNKNOWN_PX
  const from = yearOf(g.from)
  const to = yearOf(g.to)
  if (from == null || to == null || to < from) return GAP_UNKNOWN_PX
  return clamp(GAP_MIN, (to - from) * PX_PER_YEAR, GAP_MAX)
}

/**
 * Compute the proportional vertical rhythm for a built {@link ChainLayout}. Pure
 * and deterministic (same inputs → same px), so the SSG HTML matches hydration.
 * Degenerate input (0–1 dated events) collapses to a uniform MIN_STEP rhythm —
 * i.e. the pre-axis behavior — so a single-record work never breaks.
 */
export function buildChainScale(custody: ChainNode[], gaps: ChainGap[]): ChainScale {
  const gapHeightPx = new Map<ChainGap, number>()
  for (const g of gaps) gapHeightPx.set(g, gapHeight(g))

  const spacerPx: number[] = []
  const intervalYears: (number | null)[] = []
  for (let i = 0; i < custody.length; i++) {
    const followedByGap = gaps.some(g => g.afterIndex === i)
    const yA = scaleYear(custody[i].sortKey)
    const yB = i + 1 < custody.length ? scaleYear(custody[i + 1].sortKey) : null
    const years = yA != null && yB != null && yB >= yA ? yB - yA : null
    intervalYears.push(years)
    // A gap already carries the space between i and i+1 — keep the node itself
    // tight so the interval isn't counted twice.
    if (followedByGap) spacerPx.push(TIGHT)
    else if (i === custody.length - 1) spacerPx.push(0)
    else spacerPx.push(years != null ? clamp(MIN_STEP, years * PX_PER_YEAR, MAX_STEP) : MIN_STEP)
  }

  return { spacerPx, intervalYears, gapHeightPx }
}

// ─── Case-study adapter ────────────────────────────────────────────────────────
// Reshapes a RestitutionCase (case-studies.ts) into the same ChainLayout shape
// the interactive explorer uses, so /case/[slug] can reuse ChainOfCustodyTimeline's
// mature spine/scale/motion/keyboard shell instead of a bespoke card stack — the
// project's own "highest-stakes honesty surface" deserves its best timeline, not
// a separate, weaker one. This is a SEPARATE path from buildChainLayout (which
// merges live museum Location/Exhibition/Getty records): case data is already
// structured and needs no merging, only reshaping.
//
// Honesty: dates are never invented. yearOf() extracts a leading year from the
// case's own (often deliberately imprecise) date/span strings exactly as the
// museum path does — an entry with no parseable year falls back to the existing
// "unknown" sentinel (-1 leading / 9999 trailing) rather than a guess.

/** Extract up to two 4-digit years from a span string like "1939–1945" or "1912–1925 (…)". */
function yearsInSpan(span: string): [string | null, string | null] {
  const years = span.match(/\d{4}/g)
  return [years?.[0] ?? null, years?.[1] ?? null]
}

export function buildCaseChainLayout(c: RestitutionCase): ChainLayout {
  const custody: ChainNode[] = c.custody.map((e, i): ChainNode => {
    const y = yearOf(e.date)
    return {
      year: e.date,
      sortKey: y ?? (i === 0 ? -1 : 9999),
      type: 'custody',
      who: e.holder,
      where: e.place ?? undefined,
      detail: e.detail,
      source: e.sources[0]?.label ?? '',
      sourceUrl: e.sources[0]?.url ?? undefined,
      confidence: 'high',
      lane: 'custody',
      anchorIndex: -1,
      caseSources: e.sources,
      caseKind: e.kind,
    }
  })

  const loans: ChainNode[] = c.exhibitions.map((x): ChainNode => {
    const y = yearOf(x.date) ?? 9999
    return {
      year: x.date,
      sortKey: y,
      type: 'exhibition',
      who: x.venue,
      detail: x.detail,
      source: x.sources[0]?.label ?? '',
      sourceUrl: x.sources[0]?.url ?? undefined,
      confidence: 'high',
      lane: 'loan',
      anchorIndex: anchorTo(custody, y),
      caseSources: x.sources,
    }
  })

  const gaps: ChainGap[] = c.gaps.map((g): ChainGap => {
    const [from, to] = yearsInSpan(g.span)
    const fromYear = yearOf(from)
    return {
      from, to, note: g.note,
      afterIndex: fromYear != null ? anchorTo(custody, fromYear) : -1,
      openStart: from == null,
      openEnd: to == null,
      caseSources: g.sources,
    }
  })

  return { custody, loans, unmatchedSales: [], gaps }
}
