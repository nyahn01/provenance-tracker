/**
 * Museum exhibition-loan extraction from prose.
 *
 * Parses both dedicated exhibition_history fields and provenance_text fields
 * (the latter contains "on loan to …", "loaned to …", "borrowed by …" clauses).
 *
 * Honesty contract:
 * - Extracts ONLY what the prose states. Never invents dates, places, or institutions.
 * - A loan is NOT a change of custody; ExhibitionLoan is separate from LocationEntry.
 * - loanMarker records how the loan was identified (marker keyword or exhibition field).
 * - excerpt keeps a verbatim snippet for evidence — always from the source text.
 * - Unknown coordinates are kept as null (shown in timeline, never faked on map).
 */

import { geocodeNamed } from './geocode'
import type { ExhibitionLoan } from './types'

// ─── Patterns ────────────────────────────────────────────────────────────────

// Loan-marker keywords that appear in PROVENANCE prose (not exhibition fields).
// Captures "on loan to the Louvre, Paris, 1992–1995" style clauses.
const LOAN_MARKERS: Array<{ keyword: RegExp; type: ExhibitionLoan['loanMarker'] }> = [
  { keyword: /\bon\s+loan\s+to\b/i,  type: 'on loan'  },
  { keyword: /\bloaned\s+to\b/i,     type: 'loaned'   },
  { keyword: /\bborrowed\s+by\b/i,   type: 'borrowed' },
]

// Year and year-range patterns.
const YEAR_RANGE = /\b(1[5-9]\d{2}|20[0-2]\d)\s*[–\-]\s*(1[5-9]\d{2}|20[0-2]\d)\b/
const YEAR_SINGLE = /\b(1[5-9]\d{2}|20[0-2]\d)\b/g

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYears(
  clause: string,
): { startDate: string | null; endDate: string | null } {
  const rangeM = clause.match(YEAR_RANGE)
  if (rangeM) return { startDate: rangeM[1], endDate: rangeM[2] }
  const all = [...clause.matchAll(YEAR_SINGLE)].map(m => m[1])
  if (all.length === 0) return { startDate: null, endDate: null }
  if (all.length === 1) return { startDate: all[0], endDate: null }
  return { startDate: all[0], endDate: all[all.length - 1] }
}

function firstInstitution(clause: string): string | undefined {
  const seg = clause.split(/,\s*/)[0].trim()
  // Discard bare years, very short strings, and numeric-only values.
  if (seg.length > 4 && !/^\d{4}$/.test(seg)) return seg
  return undefined
}

function confidenceFrom(
  hasRange: boolean,
  hasDate: boolean,
  isHighTier: boolean,
): ExhibitionLoan['confidence'] {
  if (hasRange && isHighTier) return 'high'
  if (hasDate && isHighTier) return 'medium'
  return hasDate ? 'medium' : 'low'
}

function dedupKey(loan: ExhibitionLoan): string {
  return `${loan.name}:${loan.startDate ?? ''}:${loan.endDate ?? ''}`
}

// ─── Loan-marker extraction from provenance prose ────────────────────────────

/**
 * Scans provenance prose for loan-marker keywords ("on loan to", "loaned to",
 * "borrowed by") and returns structured ExhibitionLoan entries.
 *
 * This is the tier-A complement to extractExhibitionLoans (which targets the
 * dedicated exhibition_history field). Both paths are merged in the API route.
 */
export function extractProvenanceLoans(
  provenanceProse: string,
  sourceLabel: string,
): ExhibitionLoan[] {
  if (!provenanceProse || provenanceProse.trim().length < 20) return []

  const out: ExhibitionLoan[] = []
  const seen = new Set<string>()
  const isHighTier = /\baic\b|art institute|met(?:ropolitan)?/i.test(sourceLabel)

  // Split on sentence-level separators; keep enough context for date + institution.
  const clauses = provenanceProse.split(/[;\n.]+/).map(c => c.trim()).filter(Boolean)

  for (const clause of clauses) {
    // Find which (if any) loan marker appears in this clause.
    let markerType: ExhibitionLoan['loanMarker'] = null
    for (const { keyword, type } of LOAN_MARKERS) {
      if (keyword.test(clause)) { markerType = type; break }
    }
    if (!markerType) continue

    // Attempt to geocode: take text after the marker keyword to avoid matching
    // the subject of the sentence (e.g. "on loan to [Louvre, Paris]").
    const afterMarker = clause.replace(LOAN_MARKERS.find(m => m.type === markerType)!.keyword, '')
    const city = geocodeNamed(afterMarker) ?? geocodeNamed(clause)
    if (!city) continue

    const { startDate, endDate } = extractYears(clause)
    const institution = firstInstitution(afterMarker.trim()) || firstInstitution(clause)
    const confidence = confidenceFrom(
      !!(startDate && endDate),
      !!startDate,
      isHighTier,
    )

    // Verbatim excerpt (≤120 chars, trimmed).
    const excerpt = clause.length <= 120 ? clause : clause.slice(0, 117) + '…'

    const loan: ExhibitionLoan = {
      name: city.name,
      institution: institution?.trim() || undefined,
      lat: city.lat,
      lng: city.lng,
      startDate,
      endDate,
      source: sourceLabel,
      confidence,
      loanMarker: markerType,
      excerpt,
    }

    const key = dedupKey(loan)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(loan)
  }

  return out
}

// ─── Exhibition-history field extraction ─────────────────────────────────────

/**
 * Extracts structured loans from a dedicated exhibition_history prose field
 * (e.g. AIC's exhibition_history). Each clause is assumed to be a loan entry;
 * no keyword matching is needed. Handles YYYY–YYYY date ranges.
 */
export function extractExhibitionHistoryLoans(
  exhibitionProse: string,
  sourceLabel: string,
): ExhibitionLoan[] {
  if (!exhibitionProse || exhibitionProse.trim().length < 10) return []

  const out: ExhibitionLoan[] = []
  const seen = new Set<string>()
  const isHighTier = /\baic\b|art institute|met(?:ropolitan)?/i.test(sourceLabel)

  const clauses = exhibitionProse.split(/[;\n]+/).map(c => c.trim()).filter(Boolean)

  for (const clause of clauses) {
    const city = geocodeNamed(clause)
    if (!city) continue

    const { startDate, endDate } = extractYears(clause)
    const institution = firstInstitution(clause)
    const confidence = confidenceFrom(
      !!(startDate && endDate),
      !!startDate,
      isHighTier,
    )

    const loan: ExhibitionLoan = {
      name: city.name,
      institution: institution?.trim() || undefined,
      lat: city.lat,
      lng: city.lng,
      startDate,
      endDate,
      source: sourceLabel,
      confidence,
      loanMarker: null, // derived from exhibition field, not a keyword marker
      excerpt: clause.length <= 120 ? clause : clause.slice(0, 117) + '…',
    }

    const key = dedupKey(loan)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(loan)
  }

  return out
}

// ─── Merge helper ─────────────────────────────────────────────────────────────

/**
 * Merge loans from both prose sources, deduplicating by (name, startDate, endDate).
 * Exhibition-history loans (no loanMarker) are preferred over provenance-prose
 * extractions (with loanMarker) for the same entry, since the dedicated field is
 * the more reliable tier-A source.
 */
export function mergeLoans(
  exhibitionLoans: ExhibitionLoan[],
  provenanceLoans: ExhibitionLoan[],
): ExhibitionLoan[] {
  const seen = new Set<string>()
  const out: ExhibitionLoan[] = []

  for (const loan of [...exhibitionLoans, ...provenanceLoans]) {
    const key = dedupKey(loan)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(loan)
  }

  return out
}
