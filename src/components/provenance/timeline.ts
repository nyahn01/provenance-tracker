/**
 * Unified timeline logic — merges custody locations, exhibition loans, and Getty
 * dealer records into a single sorted, confidence-scored event list. Extracted
 * verbatim from StoriesApp.tsx (no behavioral change).
 */
import type { LocationEntry, ExhibitionLoan, GettyRecord, ArtworkMeta } from '@/lib/types'

export function tierLabel(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('met') || s.includes('metropolitan')) return 'MET'
  if (s.includes('aic') || s.includes('art institute')) return 'AIC'
  if (s.includes('rijks')) return 'RIJKS'
  if (s.includes('wikidata')) return 'Wikidata'
  if (s.includes('rkd')) return 'RKD'
  if (s.includes('getty') || s.includes('knoedler') || s.includes('gpi') || s.includes('goupil')) return 'GPI'
  if (s.includes('europeana')) return 'EUR'
  return source.toUpperCase().slice(0, 12)
}

/**
 * Full human-readable institution name for a source tier label, used in the
 * source-citation hover/focus card. Honesty: this names the institution that
 * documents the fact, never a "current location" claim.
 */
export function sourceInstitution(source: string): string {
  switch (tierLabel(source)) {
    case 'MET':      return 'The Metropolitan Museum of Art'
    case 'AIC':      return 'Art Institute of Chicago'
    case 'RIJKS':    return 'Rijksmuseum'
    case 'Wikidata': return 'Wikidata'
    case 'RKD':      return 'RKD — Netherlands Institute for Art History'
    case 'GPI':      return 'Getty Provenance Index'
    case 'EUR':      return 'Europeana'
    default:         return source
  }
}

/**
 * Deep link to the source RECORD for a timeline event, where one exists.
 *
 * Honesty: links to the public record that carries the provenance fact — the
 * museum object page (where the provenance prose lives), the Wikidata entity,
 * or the source-supplied record URL (GPI/RKD already carry their own). Returns
 * null when no stable public record URL can be built — the card then shows the
 * institution as attribution without a fabricated link.
 *
 * @param eventUrl per-event URL already on the event (GPI ledger, RKD record)
 * @param source   tier label of the event's source
 * @param artwork  the work, whose `id` is "<source>-<rawId>"
 */
export function sourceRecordUrl(
  eventUrl: string | undefined,
  source: string,
  artwork: Pick<ArtworkMeta, 'id' | 'source'>,
): string | null {
  // Event-level record URL (Getty ledger, RKD record) always wins — it is the
  // most specific link to the exact fact.
  if (eventUrl) return eventUrl

  const label = tierLabel(source)
  // The fact-bearing record for a museum-prose event is that work's object page.
  // Only build it when the event's tier matches the work's owning institution —
  // a Wikidata location fact on a Met work links to the Met object page; a
  // cross-source label we can't anchor to a record returns null (shown as plain
  // attribution, never a guessed link).
  const rawId = artwork.id.includes('-') ? artwork.id.slice(artwork.id.indexOf('-') + 1) : artwork.id
  if (!rawId) return null

  switch (artwork.source) {
    case 'met':
      if (label === 'MET') return `https://www.metmuseum.org/art/collection/search/${rawId}`
      break
    case 'aic':
      if (label === 'AIC') return `https://www.artic.edu/artworks/${rawId}`
      break
    case 'cleveland':
      // Cleveland's own record page documents its provenance prose.
      if (label === 'CLEVELAND') return `https://www.clevelandart.org/art/${rawId}`
      break
    case 'wikidata':
      if (label === 'Wikidata' && /^Q\d+$/.test(rawId)) return `https://www.wikidata.org/wiki/${rawId}`
      break
    case 'rijks':
      if (label === 'RIJKS') return `https://www.rijksmuseum.nl/en/collection/${rawId}`
      break
  }
  return null
}

export interface ProvenanceEvent {
  year: string
  sortKey: number
  type: 'dealer' | 'custody' | 'gift' | 'acquisition' | 'exhibition' | 'gap'
  who: string
  where?: string
  detail?: string
  price?: string
  source: string
  sourceUrl?: string
  /** Confidence level for this event, derived from the originating data source. */
  confidence: 'high' | 'medium' | 'low'
}

export function extractYear(date?: string): number {
  if (!date) return 9999
  const m = date.match(/\d{4}/)
  return m ? parseInt(m[0]) : 9999
}

export function fmtYear(date?: string): string {
  if (!date) return '?'
  const m = date.match(/(\d{4})/)
  return m ? m[1] : date.slice(0, 10)
}

// Check if any gap in the custody chain overlaps the WWII risk period (1933–1945).
// Returns the full gap window (not clamped to the period) for accurate reporting.
export function detectWWIIGap(locations: LocationEntry[]): { gapStart: number; gapEnd: number } | null {
  if (locations.length < 2) return null
  const dated = locations
    .map(l => ({ yr: l.startDate ? parseInt(l.startDate.slice(0, 4), 10) : NaN }))
    .filter(l => !isNaN(l.yr))
    .sort((a, b) => a.yr - b.yr)
  for (let i = 0; i < dated.length - 1; i++) {
    const gapStart = dated[i].yr, gapEnd = dated[i + 1].yr
    if (gapEnd - gapStart > 1 && gapStart < 1945 && gapEnd > 1933) return { gapStart, gapEnd }
  }
  return null
}

/**
 * Map a source label to a confidence tier.
 *
 * high:   AIC/Met direct museum records with explicit dates, or Getty GPI records
 *         that carry an explicit date + price (the richest structured evidence we have).
 * medium: Wikidata P276 — location is known but dates are often approximate or absent.
 * low:    prose extracted without explicit dates (deterministic fallback path) or any
 *         other source we can't score higher.
 */
export function sourceConfidence(source: string, hasExplicitDate: boolean): ProvenanceEvent['confidence'] {
  const s = source.toLowerCase()
  if (s === 'gpi') return hasExplicitDate ? 'high' : 'medium'
  if (s.includes('aic') || s.includes('art institute') || s.includes('met') || s.includes('metropolitan') || s.includes('rijks')) {
    return hasExplicitDate ? 'high' : 'low'
  }
  if (s.includes('wikidata')) return 'medium'
  return 'low'
}

export function buildUnifiedTimeline(
  locations: LocationEntry[],
  exhibitions: ExhibitionLoan[],
  gettyRecords: GettyRecord[],
): ProvenanceEvent[] {
  const events: ProvenanceEvent[] = []

  for (const loc of locations) {
    const nameL = loc.name.toLowerCase()
    const instL = (loc.institution ?? '').toLowerCase()
    const combined = nameL + ' ' + instL
    const type: ProvenanceEvent['type'] =
      (combined.includes('bequest') || combined.includes('gift') || combined.includes('donat')) ? 'gift'
      : (combined.includes('museum') || combined.includes('institute') || combined.includes('gallery') || combined.includes('acqui')) ? 'acquisition'
      : 'custody'
    const label = tierLabel(loc.source)
    events.push({
      year: fmtYear(loc.startDate ?? undefined),
      sortKey: extractYear(loc.startDate ?? undefined),
      type,
      who: (loc.institution && loc.institution !== loc.name) ? loc.institution : loc.name,
      where: (loc.institution && loc.institution !== loc.name) ? loc.name : undefined,
      source: label,
      confidence: loc.confidence ?? sourceConfidence(label, loc.startDate != null),
    })
  }

  for (const ex of exhibitions.slice(0, 4)) {
    const label = tierLabel(ex.source)
    events.push({
      year: fmtYear(ex.startDate ?? undefined),
      sortKey: extractYear(ex.startDate ?? undefined),
      type: 'exhibition',
      who: (ex.institution && ex.institution !== ex.name) ? ex.institution : ex.name,
      where: (ex.institution && ex.institution !== ex.name) ? ex.name : undefined,
      detail: 'Exhibition loan — not a custody change',
      source: label,
      confidence: ex.confidence ?? sourceConfidence(label, ex.startDate != null),
    })
  }

  for (const rec of gettyRecords.slice(0, 4)) {
    const dateStr = rec.saleDate ?? rec.entryDate ?? undefined
    const seller = rec.seller ?? ''
    const buyer = rec.buyer ?? ''
    const via = [seller, buyer].filter(Boolean).join(' → ')
    const price = [rec.purchasePrice, rec.salePrice].filter(Boolean).join(' / ') || undefined
    const hasDate = dateStr != null
    const hasPrice = !!(rec.purchasePrice || rec.salePrice)
    events.push({
      year: fmtYear(dateStr),
      sortKey: extractYear(dateStr),
      type: 'dealer',
      who: buyer || seller || 'Knoedler & Co.',
      where: rec.buyerLocation ?? undefined,
      detail: via || undefined,
      price,
      source: 'GPI',
      sourceUrl: rec.sourceUrl ?? undefined,
      confidence: hasDate && hasPrice ? 'high' : hasDate ? 'medium' : 'low',
    })
  }

  events.sort((a, b) => a.sortKey - b.sortKey)
  return events
}

// ─── Event row style helpers ──────────────────────────────────────────────────
export const EV_STYLES: Record<ProvenanceEvent['type'], { icon: string; color: string; bg: string; border: string }> = {
  dealer:      { icon: '→', color: '#7c5cbf', bg: 'rgba(124,92,191,0.07)', border: 'rgba(124,92,191,0.25)' },
  custody:     { icon: '⌂', color: '#a07830', bg: 'rgba(160,120,48,0.06)', border: 'rgba(160,120,48,0.22)' },
  gift:        { icon: '♥', color: '#a07830', bg: 'rgba(160,120,48,0.06)', border: 'rgba(160,120,48,0.22)' },
  acquisition: { icon: '⌂', color: '#4a7a6a', bg: 'rgba(74,122,106,0.07)', border: 'rgba(74,122,106,0.22)' },
  exhibition:  { icon: '↻', color: '#4a7a6a', bg: 'rgba(74,122,106,0.04)', border: 'rgba(74,122,106,0.14)' },
  gap:         { icon: '░', color: '#9a8f85', bg: 'transparent',            border: 'rgba(154,143,133,0.20)' },
}
