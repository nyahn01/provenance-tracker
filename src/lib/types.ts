/**
 * Single source of truth for the data contract shared across API routes and UI.
 *
 * RULE: routes and components import shapes from HERE — never redefine them
 * locally and never let one side invent a shape the other doesn't implement.
 * This file is what makes the front-end and back-end speak the same language.
 */

// ─── Search ──────────────────────────────────────────────────────────────────

/**
 * Controls which field(s) the scoring logic should prioritise.
 *
 * - 'all':    default behaviour — title and artist both contribute equally.
 * - 'artist': surname / full-name query; artist matches are weighted much
 *             higher so "Monet" surfaces Monet's works, not works about Monet.
 * - 'title':  the user is looking for a specific painting title; artist
 *             matches are demoted so first-name false-positives don't surface.
 */
export type SearchByMode = 'all' | 'artist' | 'title'

export interface SearchResult {
  /** Globally unique within this API: "<source>-<raw id>" */
  id: string
  source: 'met' | 'aic' | 'rijks' | 'europeana' | 'wikidata' | 'cleveland'
  title: string
  artist: string
  date: string
  thumbnail: string | null
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  /** Which field(s) were prioritised when scoring results. */
  searchBy: SearchByMode
  /** Human-readable list of upstream data sources consulted */
  sources: string[]
  cached?: boolean
}

// ─── Provenance ──────────────────────────────────────────────────────────────

export interface ArtworkMeta {
  id: string
  source: 'met' | 'aic' | 'rijks' | 'europeana' | 'wikidata' | 'cleveland'
  title: string
  artist: string
  date: string
  thumbnail: string | null
  /** Museum's OWN location field only — never a cross-museum "on view" claim. */
  geoLocation: string | null
}

export interface LocationEntry {
  name: string
  /** Full named entity that held the work: person, gallery, or museum name. */
  institution?: string
  lat: number | null
  lng: number | null
  startDate: string | null
  endDate: string | null
  /** Provenance of the fact itself, e.g. "Wikidata P276", "Met API", "AIC API". */
  source: string
  /**
   * Source-level confidence in this entry:
   * - high:   explicit date + record from AIC/Met direct records or Getty GPI with price
   * - medium: location known but date is approximate (e.g. Wikidata P276)
   * - low:    inferred from prose without explicit dates
   */
  confidence?: 'high' | 'medium' | 'low'
  /**
   * Optional visible annotation shown under the location on the timeline —
   * e.g. to disclose that a specific place was corroborated from a secondary
   * source when the primary `source` only names a country/region. Never used
   * to invent a date; see `confidence` for that fact's certainty tier.
   */
  note?: string
}

/**
 * A documented exhibition loan extracted from provenance or exhibition prose.
 * Extends LocationEntry with loan-specific fields.
 *
 * Honesty note: a loan is NOT a change of custody. Do not conflate with
 * the ownership LocationEntry chain. Source must cite the prose field it came from.
 */
export interface ExhibitionLoan {
  /** Canonical city name resolved from prose (geocoder match). */
  name: string
  /** Full institution name as it appears in the prose, if identifiable. */
  institution?: string
  lat: number | null
  lng: number | null
  startDate: string | null
  endDate: string | null
  /** Prose field this loan was extracted from, e.g. "AIC exhibition history", "Met provenance prose". */
  source: string
  confidence?: 'high' | 'medium' | 'low'
  /**
   * The loan trigger keyword found in the prose: "on loan", "loaned", "borrowed".
   * Null when extracted from dedicated exhibition_history prose (trigger implicit).
   */
  loanMarker?: 'on loan' | 'loaned' | 'borrowed' | null
  /**
   * Verbatim excerpt from the prose that generated this loan entry.
   * Kept short (≤120 chars) for evidence display. Never fabricated.
   */
  excerpt?: string
}

export interface GapEntry {
  from: string | null
  to: string | null
  note: string
}

export interface GettyRecord {
  piRecordNo: string | null
  artist: string | null
  title: string | null
  entryDate: string | null
  saleDate: string | null
  seller: string | null
  sellerLocation: string | null
  buyer: string | null
  buyerLocation: string | null
  purchasePrice: string | null
  salePrice: string | null
  transaction: string | null
  notes: string | null
  sourceUrl: string | null
  sourceLabel: string
}

export interface ProvenanceResponse {
  artwork: ArtworkMeta
  /** Chain of CUSTODY only — owners/locations over time. This is the journey (the arcs). */
  locations: LocationEntry[]
  /** Exhibition LOANS — the work was shown here and returned. NOT custody changes. */
  exhibitions: ExhibitionLoan[]
  gaps: GapEntry[]
  /** true when the custody chain is thin (< 2 mapped locations). */
  hasGap: boolean
  /** Raw institutional provenance prose (AIC tier-A source), shown verbatim as evidence. */
  provenanceText?: string
  /** Historical art market transactions from Getty Provenance Index (Knoedler + Goupil). */
  gettyRecords?: GettyRecord[]
  /** Dutch/Flemish provenance records from RKD Netherlands Art Institute. */
  rkdRecords?: import('./rkd').RkdRecord[]
}

// ─── Case study (restitution deep-dive) ──────────────────────────────────────

/**
 * A single source citation rendered as a visible line beneath every case-study
 * fact. Honesty rule: no fact ships without one of these. `url` links to the
 * primary record (court ruling, museum page, archive) — never a paraphrase
 * without attribution.
 */
export interface CaseSource {
  /** Short label shown on screen, e.g. "U.S. Supreme Court, 03-1136 (2004)". */
  label: string
  /** Link to the primary record. Null only when the source is offline/print. */
  url: string | null
}

/**
 * One dated link in a restitution custody chain. This is OWNERSHIP only —
 * exhibition loans live in `CaseExhibition` and are never mixed in here.
 *
 * `kind` drives the visual treatment:
 *  - custody:   legal title held by a named party
 *  - coerced:   title transfer under Nazi-era duress / confiscation (flagged)
 *  - gap:       no documented legitimate ownership for this span — shown as a gap
 *  - restitution: a ruling/transfer that returned title to the rightful heirs
 */
export interface CaseCustodyEntry {
  /** Display date or span, e.g. "1907", "1938–1945", verbatim from sources. */
  date: string
  /** Who held (or was found to rightfully hold) the work. */
  holder: string
  /** Where the work physically was, if documented. Null when unknown. */
  place: string | null
  kind: 'custody' | 'coerced' | 'gap' | 'restitution'
  /** Plain-language description of what happened — sourced, never speculative. */
  detail: string
  /** Citations backing this entry. At least one is required. */
  sources: CaseSource[]
}

/**
 * An exhibition loan in the case study — shown separately so a loan is never
 * read as a change of custody.
 */
export interface CaseExhibition {
  date: string
  venue: string
  detail: string
  sources: CaseSource[]
}

/** A documented provenance gap in the case (the honest "we don't / didn't know"). */
export interface CaseGap {
  span: string
  note: string
  sources: CaseSource[]
}

/** Top-level shape for one restitution case-study page. */
export interface RestitutionCase {
  slug: string
  title: string
  artist: string
  created: string
  medium: string
  /** One-line standing of the work today, with a dated source (no live claims). */
  currentStatusAsOf: string
  summary: string
  custody: CaseCustodyEntry[]
  exhibitions: CaseExhibition[]
  gaps: CaseGap[]
  /** Sources for the case as a whole (further reading / primary archives). */
  references: CaseSource[]
}

/**
 * A translated-language overlay for one RestitutionCase — prose fields only.
 * Facts (dates, holders, places, `kind`, citation labels/URLs in CaseSource)
 * live ONLY in RestitutionCase and are never duplicated here: they are proper
 * nouns/legal citations, not prose, and re-keying them per locale would risk
 * drift between language versions of the same case.
 */
export interface RestitutionCaseTranslation {
  summary: string
  currentStatusAsOf: string
  /** Indexed 1:1 with RestitutionCase.custody — same array length, same order. */
  custodyDetail: string[]
  exhibitionDetail: string[]
  gapNote: string[]
}

// ─── Collection-level insights (Getty GPI + featured chains) ────────────────

/**
 * A price string parsed from a GPI ledger field. Currencies are NEVER
 * converted or mixed on one axis (honesty rule) — the currency travels with
 * the amount so every consumer must handle it explicitly.
 */
export interface ParsedPrice {
  amount: number
  currency: 'USD' | 'GBP' | 'FRF' | 'DEM' | 'unknown'
}

/** Getty transactions in one year, split by recorded outcome. */
export interface YearActivity {
  year: number
  sold: number
  unsold: number
  other: number
}

/** One artist's transaction activity over time (for small multiples). */
export interface ArtistActivity {
  artist: string
  total: number
  years: YearActivity[]
}

/**
 * A USD amount restated in a later year's purchasing power via a published CPI
 * series (issue #241). Additive only — the as-recorded amount is never replaced.
 * `estimated` is true when `fromYear` predates the series' official-CPI cutoff,
 * i.e. it rests on a historical reconstruction rather than measured CPI.
 */
export interface InflationAdjustment {
  fromYear: number
  toYear: number
  adjustedAmount: number
  estimated: boolean
}

/** Median USD sale price for one year (Knoedler only; n = bucket size, shown). */
export interface PriceYearStat {
  year: number
  medianUsd: number
  n: number
  /** Null when the year falls outside the CPI series. */
  inflationAdjusted: InflationAdjustment | null
}

/**
 * Where one amount sits in the ledger's own distribution FOR ITS OWN CURRENCY.
 *
 * This is the honest way to answer "was that a lot?" without converting. A franc
 * purchase is ranked only against other franc purchases, a dollar sale only
 * against other dollar sales, so the two currencies never share a scale and no
 * exchange rate is implied. `n` is the population it was ranked against, and it
 * is always shown: a rank out of 40 records means less than a rank out of 1,700.
 */
export interface PriceRank {
  /** 0–100, the share of the population at or below this amount. */
  percentile: number
  /** Population size this was ranked against. */
  n: number
  /** Which pool: purchases and sales are ranked separately. */
  side: 'purchase' | 'sale'
  currency: ParsedPrice['currency']
}

/**
 * One francs-bought → dollars-sold Knoedler record. Prices are the VERBATIM
 * ledger strings — never converted between currencies. The two ranks say where
 * each amount sits among its OWN currency's records, which is comparison
 * without conversion.
 */
export interface ArbitragePair {
  piRecordNo: string | null
  title: string | null
  artist: string | null
  year: number | null
  purchase: string
  sale: string
  /** Null when the currency's population is too small to rank against honestly. */
  purchaseRank: PriceRank | null
  saleRank: PriceRank | null
  /** The dollar `sale` figure restated in present-day dollars. Never applied to `purchase` (francs) — no franc CPI series is in the repo. */
  saleAdjusted: InflationAdjustment | null
  sourceUrl: string | null
  sourceLabel: string
}

/** A counted seller→buyer relationship from the Knoedler stock books. */
export interface DealerLink {
  seller: string
  buyer: string
  count: number
}

/** Deterministic rank-based layout for the bipartite dealer ribbons. */
export interface BipartiteNode {
  name: string
  count: number
  /** 0..1 vertical position, rank-based — no force simulation, no pseudo-geometry. */
  y: number
}

export interface BipartiteLayout {
  sellers: BipartiteNode[]
  buyers: BipartiteNode[]
  links: DealerLink[]
  /** Honest exclusions: totals beyond the shown top-N / min-link threshold. */
  totalSellers: number
  totalBuyers: number
  minLinkCount: number
}

/** One weighted custody transition between two mapped cities (featured chains). */
export interface PipelineFlow {
  fromName: string
  toName: string
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  count: number
}

export interface PipelineCity {
  name: string
  lat: number
  lng: number
  count: number
}

export interface PipelineData {
  flows: PipelineFlow[]
  cities: PipelineCity[]
  /** Transitions that could not be drawn (missing coordinates) — stated, never hidden. */
  excludedCount: number
  totalEntries: number
  workCount: number
}

// ─── Newsletter (Buttondown) ─────────────────────────────────────────────────

export interface NewsletterSubscribeBody {
  email?: string
  /** Honeypot — must stay empty; bots that fill it get a silent fake success. */
  website?: string
}

export interface NewsletterSubscribeResponse {
  ok: boolean
  /** 'email' when the newsletter service is unconfigured/unreachable — the UI shows a mailto fallback. */
  fallback?: 'email'
  error?: string
}

// ─── Reconcile (Claude) ──────────────────────────────────────────────────────

export interface TimelineEntry {
  date: string | null
  location: string
  confidence: 'confirmed' | 'uncertain' | 'gap'
  note: string | null
}

export interface ReconcileRequest {
  artwork: string
  locations: Array<{
    name: string
    startDate: string | null
    endDate: string | null
    source: string
  }>
  rawProvenance: string
}

export interface ReconcileResponse {
  timeline: TimelineEntry[]
  conflicts: string[]
  warnings: string[]
  cached?: boolean
}

// ─── Feedback routing ────────────────────────────────────────────────────────

/** The categories the in-app feedback form offers. */
export type FeedbackCategory = 'bug' | 'data-correction' | 'feature' | 'ux' | 'general'

/** Agent domains a feedback item can be routed to (the label is `agent:<domain>`). */
export type AgentDomain =
  | 'provenance-globe'
  | 'design-director'
  | 'provenance-strategy'
  | 'provenance-data'
