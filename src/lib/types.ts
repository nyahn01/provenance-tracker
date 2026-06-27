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
