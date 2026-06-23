/**
 * Single source of truth for the data contract shared across API routes and UI.
 *
 * RULE: routes and components import shapes from HERE — never redefine them
 * locally and never let one side invent a shape the other doesn't implement.
 * This file is what makes the front-end and back-end speak the same language.
 */

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchResult {
  /** Globally unique within this API: "<source>-<raw id>" */
  id: string
  source: 'met' | 'aic' | 'rijks' | 'europeana'
  title: string
  artist: string
  date: string
  thumbnail: string | null
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  /** Human-readable list of upstream data sources consulted */
  sources: string[]
  cached?: boolean
}

// ─── Provenance ──────────────────────────────────────────────────────────────

export interface ArtworkMeta {
  id: string
  source: 'met' | 'aic' | 'rijks' | 'europeana'
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
