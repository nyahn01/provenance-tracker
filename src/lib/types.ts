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
  source: 'met' | 'aic'
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
  source: 'met' | 'aic'
  title: string
  artist: string
  date: string
  thumbnail: string | null
  /** Museum's OWN location field only — never a cross-museum "on view" claim. */
  geoLocation: string | null
}

export interface LocationEntry {
  name: string
  lat: number | null
  lng: number | null
  startDate: string | null
  endDate: string | null
  /** Provenance of the fact itself, e.g. "Wikidata P276", "Met API", "AIC API". */
  source: string
}

export interface GapEntry {
  from: string | null
  to: string | null
  note: string
}

export interface ProvenanceResponse {
  artwork: ArtworkMeta
  /** Chain of CUSTODY only — owners/locations over time. This is the journey (the arcs). */
  locations: LocationEntry[]
  /** Exhibition LOANS — the work was shown here and returned. NOT custody changes. */
  exhibitions: LocationEntry[]
  gaps: GapEntry[]
  /** true when the custody chain is thin (< 2 mapped locations). */
  hasGap: boolean
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
