/**
 * Globe data helpers — city geocoding and arc construction for the 3D globe.
 * Extracted verbatim from StoriesApp.tsx (no behavioral change). Colors are
 * passed in by the caller so this module stays presentation-agnostic; the
 * amber dealer-trail constants live here because they are intrinsic to the
 * dealer-arc semantics.
 *
 * buildLabels: additive labels layer (issue #52). Deduplicates by lat/lng key
 * so each geographic node shows exactly one label regardless of how many arc
 * tiers touch it. Nodes with null coordinates are never emitted.
 *
 * buildGapArcs / arcStyleForConfidence: confidence-honest arcs + gap glyph
 * (issue #124, Option A of #121). Per-datum style only — same hue as before,
 * stroke/dash/opacity vary with LocationEntry.confidence. A GapEntry with
 * null coordinates is never drawn (see countUnresolvedGaps) — that's a
 * corner-badge concern, never a synthetic endpoint.
 */
import type { LocationEntry, ExhibitionLoan, GettyRecord, GapEntry } from '@/lib/types'

// ─── City coordinate lookup (for Getty dealer city dots) ─────────────────────
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'paris': { lat: 48.8566, lng: 2.3522 }, 'london': { lat: 51.5074, lng: -0.1278 },
  'new york': { lat: 40.7128, lng: -74.006 }, 'chicago': { lat: 41.8781, lng: -87.6298 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 }, 'brussels': { lat: 50.8503, lng: 4.3517 },
  'berlin': { lat: 52.52, lng: 13.405 }, 'boston': { lat: 42.3601, lng: -71.0589 },
  'philadelphia': { lat: 39.9526, lng: -75.1652 }, 'washington': { lat: 38.9072, lng: -77.0369 },
  'san francisco': { lat: 37.7749, lng: -122.4194 }, 'los angeles': { lat: 34.0522, lng: -118.2437 },
  'vienna': { lat: 48.2082, lng: 16.3738 }, 'zurich': { lat: 47.3769, lng: 8.5417 },
  'geneva': { lat: 46.2044, lng: 6.1432 }, 'munich': { lat: 48.1351, lng: 11.582 },
  'hamburg': { lat: 53.5511, lng: 9.9937 }, 'rome': { lat: 41.9028, lng: 12.4964 },
  'florence': { lat: 43.7696, lng: 11.2558 }, 'madrid': { lat: 40.4168, lng: -3.7038 },
  'st. petersburg': { lat: 59.9311, lng: 30.3609 }, 'moscow': { lat: 55.7558, lng: 37.6173 },
  'pittsburgh': { lat: 40.4406, lng: -79.9959 }, 'minneapolis': { lat: 44.9778, lng: -93.265 },
  'detroit': { lat: 42.3314, lng: -83.0458 }, 'cleveland': { lat: 41.4993, lng: -81.6944 },
  'toronto': { lat: 43.6532, lng: -79.3832 }, 'montreal': { lat: 45.5017, lng: -73.5673 },
  'tokyo': { lat: 35.6762, lng: 139.6503 }, 'seoul': { lat: 37.5665, lng: 126.978 },
}

export function cityCoords(locationStr: string | null): { lat: number; lng: number } | null {
  if (!locationStr) return null
  const key = locationStr.toLowerCase().split(',')[0].trim()
  return CITY_COORDS[key] ?? null
}

export interface GlobeArc {
  startLat: number; startLng: number; endLat: number; endLng: number
  color: string; altitude: number; label: string
  /** Stroke width — narrower for lower confidence and for the gap tier. */
  stroke: number
  dashLength: number
  /** Wider gap ⇒ sparser dash ⇒ lower confidence (or the broken gap tier). */
  dashGap: number
  /** 0 renders a static, un-animated dash pattern (used by the gap tier only). */
  dashAnimateTime: number
}

type ArcConfidence = LocationEntry['confidence']

const CONFIDENCE_RANK: Record<NonNullable<ArcConfidence>, number> = { low: 0, medium: 1, high: 2 }

/** The weaker of two endpoints' confidence. An undefined endpoint never degrades the link — it just defers to whichever side actually reports a confidence, never inventing one. */
function weakerConfidence(a: ArcConfidence, b: ArcConfidence): ArcConfidence {
  if (!a) return b
  if (!b) return a
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b
}

function arcDashLengthForAltitude(altitude: number): number {
  return altitude <= 0.12 ? 0.02 : 0.015
}

/**
 * Stroke/dash-gap/opacity for a custody or exhibition arc, keyed off its
 * confidence — same hue as before (only stroke width, dash gap, and opacity
 * vary). No confidence recorded ⇒ renders exactly as it did before this
 * feature: absence of a confidence rating is never treated as "low".
 */
export function arcStyleForConfidence(confidence: ArcConfidence, altitude: number): { stroke: number; dashGap: number; opacity: number } {
  const baseStroke = altitude <= 0.12 ? 0.35 : 0.6
  const baseDashGap = altitude <= 0.12 ? 0.025 : 0.015
  if (confidence === 'medium') return { stroke: baseStroke * 0.85, dashGap: baseDashGap * 2, opacity: 0.75 }
  if (confidence === 'low') return { stroke: baseStroke * 0.6, dashGap: baseDashGap * 3.5, opacity: 0.5 }
  return { stroke: baseStroke, dashGap: baseDashGap, opacity: 1 }
}

/** hex (e.g. "#d4a853") → the same color with alpha baked in; opacity 1 returns the hex unchanged so unstyled/high-confidence arcs render pixel-identical to before this feature. */
function withAlpha(hex: string, opacity: number): string {
  if (opacity >= 1) return hex
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

export function buildArcs(locations: LocationEntry[], color: string, altitude: number): GlobeArc[] {
  const arcs: GlobeArc[] = []
  const dashLength = arcDashLengthForAltitude(altitude)
  for (let i = 0; i < locations.length - 1; i++) {
    const a = locations[i], b = locations[i + 1]
    if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) continue
    if (a.lat === b.lat && a.lng === b.lng) continue
    const style = arcStyleForConfidence(weakerConfidence(a.confidence, b.confidence), altitude)
    arcs.push({
      startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng,
      color: withAlpha(color, style.opacity), altitude, label: `${a.name} → ${b.name}`,
      stroke: style.stroke, dashLength, dashGap: style.dashGap, dashAnimateTime: 10000,
    })
  }
  return arcs
}

/**
 * Gap tier (Option A, item 2): a documented custody gap whose two named
 * neighbors are BOTH already resolved to real coordinates in `locations`
 * renders as a broken, un-animated arc — visually distinct from the three
 * custody/loan/dealer tiers. A GapEntry that can't resolve both ends (most
 * are `from: null, to: null` today) is skipped here entirely; see
 * `countUnresolvedGaps` for the corner-badge count instead.
 */
export function buildGapArcs(locations: LocationEntry[], gaps: GapEntry[], color: string): GlobeArc[] {
  const arcs: GlobeArc[] = []
  for (const gap of gaps) {
    if (!gap.from || !gap.to) continue
    const from = locations.find(l => l.name === gap.from && l.lat != null && l.lng != null)
    const to = locations.find(l => l.name === gap.to && l.lat != null && l.lng != null)
    if (!from || !to) continue
    arcs.push({
      startLat: from.lat as number, startLng: from.lng as number,
      endLat: to.lat as number, endLng: to.lng as number,
      color, altitude: 0.24, label: `Undocumented gap: ${gap.from} → ${gap.to}`,
      stroke: 0.4, dashLength: 0.01, dashGap: 0.05, dashAnimateTime: 0,
    })
  }
  return arcs
}

/** Count of GapEntry records with no resolvable coordinates — these surface as a corner badge, never a drawn arc with an invented endpoint. */
export function countUnresolvedGaps(gaps: GapEntry[]): number {
  return gaps.filter(g => !g.from || !g.to).length
}

// ─── Labels layer (issue #52 — additive, does not touch init) ────────────────

/**
 * A single label entry for globe.gl's labelsData layer.
 * `text` is the city (and, where parseable, country) from the source datum.
 * Only nodes with confirmed lat/lng are emitted — null-coord nodes are
 * silently dropped here so the caller never places a label at (0,0).
 */
export interface GlobeLabel {
  lat: number
  lng: number
  text: string
  color: string
  size: number
}

/**
 * Build a deduplicated set of place labels from all three node tiers:
 * custody locations, exhibition loans, and Getty dealer cities.
 *
 * Priority: custody > exhibition > dealer (first-seen wins on same lat/lng).
 * The `labelColor` value is passed in from the caller so this module never
 * hardcodes a hex (design tokens live in design-tokens.ts, not here).
 */
export function buildLabels(
  custodyLocations: LocationEntry[],
  exhibitions: ExhibitionLoan[],
  gettyRecords: GettyRecord[],
  labelColor: string,
): GlobeLabel[] {
  const seen = new Set<string>()
  const labels: GlobeLabel[] = []

  const addLabel = (lat: number, lng: number, name: string) => {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
    if (seen.has(key)) return
    seen.add(key)
    labels.push({ lat, lng, text: name, color: labelColor, size: 0.45 })
  }

  // Tier 1: custody locations (owner cities) — highest priority
  for (const loc of custodyLocations) {
    if (loc.lat == null || loc.lng == null) continue
    addLabel(loc.lat, loc.lng, loc.name)
  }

  // Tier 2: exhibition loan venues
  for (const ex of exhibitions) {
    if (ex.lat == null || ex.lng == null) continue
    addLabel(ex.lat, ex.lng, ex.name)
  }

  // Tier 3: Getty dealer cities (looked up via CITY_COORDS)
  for (const r of gettyRecords) {
    for (const locStr of [r.sellerLocation, r.buyerLocation]) {
      const coords = cityCoords(locStr)
      if (!coords) continue
      const cityName = (locStr ?? '').split(',')[0].trim()
      addLabel(coords.lat, coords.lng, cityName)
    }
  }

  return labels
}

// Dealer arcs: seller → buyer within each GPI record (lower altitude, dimmer, smaller stroke)
export const AMBER_ARC = 'rgba(180,130,60,0.55)'
export const AMBER_DOT = 'rgba(180,130,60,0.70)'

export function buildDealerArcs(records: GettyRecord[]): GlobeArc[] {
  const arcs: GlobeArc[] = []
  const seen = new Set<string>()
  const altitude = 0.12
  // GettyRecord has no confidence field — styled identically to how dealer
  // arcs always rendered (arcStyleForConfidence(undefined, ...) === the old constants).
  const style = arcStyleForConfidence(undefined, altitude)
  const dashLength = arcDashLengthForAltitude(altitude)
  for (const r of records) {
    const seller = cityCoords(r.sellerLocation)
    const buyer = cityCoords(r.buyerLocation)
    if (!seller || !buyer) continue
    if (seller.lat === buyer.lat && seller.lng === buyer.lng) continue
    const key = `${seller.lat},${seller.lng}|${buyer.lat},${buyer.lng}`
    if (seen.has(key)) continue
    seen.add(key)
    const sellerCity = (r.sellerLocation ?? '').split(',')[0].trim()
    const buyerCity = (r.buyerLocation ?? '').split(',')[0].trim()
    arcs.push({
      startLat: seller.lat, startLng: seller.lng,
      endLat: buyer.lat, endLng: buyer.lng,
      color: AMBER_ARC, altitude,
      label: `Dealer: ${sellerCity} → ${buyerCity}${r.saleDate ? ` (${r.saleDate.slice(0, 4)})` : ''}`,
      stroke: style.stroke, dashLength, dashGap: style.dashGap, dashAnimateTime: 10000,
    })
  }
  return arcs
}
