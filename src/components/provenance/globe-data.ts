/**
 * Globe data helpers — city geocoding and arc construction for the 3D globe.
 * Extracted verbatim from StoriesApp.tsx (no behavioral change). Colors are
 * passed in by the caller so this module stays presentation-agnostic; the
 * amber dealer-trail constants live here because they are intrinsic to the
 * dealer-arc semantics.
 */
import type { LocationEntry, GettyRecord } from '@/lib/types'

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

export interface GlobeArc { startLat: number; startLng: number; endLat: number; endLng: number; color: string; altitude: number; label: string }

export function buildArcs(locations: LocationEntry[], color: string, altitude: number): GlobeArc[] {
  const arcs: GlobeArc[] = []
  for (let i = 0; i < locations.length - 1; i++) {
    const a = locations[i], b = locations[i + 1]
    if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) continue
    if (a.lat === b.lat && a.lng === b.lng) continue
    arcs.push({ startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng, color, altitude, label: `${a.name} → ${b.name}` })
  }
  return arcs
}

// Dealer arcs: seller → buyer within each GPI record (lower altitude, dimmer, smaller stroke)
export const AMBER_ARC = 'rgba(180,130,60,0.55)'
export const AMBER_DOT = 'rgba(180,130,60,0.70)'

export function buildDealerArcs(records: GettyRecord[]): GlobeArc[] {
  const arcs: GlobeArc[] = []
  const seen = new Set<string>()
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
      color: AMBER_ARC, altitude: 0.12,
      label: `Dealer: ${sellerCity} → ${buyerCity}${r.saleDate ? ` (${r.saleDate.slice(0, 4)})` : ''}`,
    })
  }
  return arcs
}
