/**
 * Deterministic gazetteer geocoder for the major art-world cities.
 *
 * Why a static table instead of a geocoding API: it's fast, free, cache-free,
 * and predictable for the cities that actually appear in provenance/exhibition
 * records. A place we don't know resolves to null coords — the entry still shows
 * in the timeline, it just isn't mapped on the globe. That is the honest behavior
 * (we never invent a coordinate).
 */

export interface GeoPoint {
  lat: number
  lng: number
}

const CITIES: Record<string, GeoPoint> = {
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
  'new york': { lat: 40.7128, lng: -74.006 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  amsterdam: { lat: 52.3676, lng: 4.9041 },
  brussels: { lat: 50.8503, lng: 4.3517 },
  'the hague': { lat: 52.0705, lng: 4.3007 },
  rotterdam: { lat: 51.9244, lng: 4.4777 },
  antwerp: { lat: 51.2194, lng: 4.4025 },
  bruges: { lat: 51.2093, lng: 3.2247 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  barcelona: { lat: 41.3874, lng: 2.1686 },
  lisbon: { lat: 38.7223, lng: -9.1393 },
  florence: { lat: 43.7696, lng: 11.2558 },
  rome: { lat: 41.9028, lng: 12.4964 },
  venice: { lat: 45.4408, lng: 12.3155 },
  milan: { lat: 45.4642, lng: 9.19 },
  naples: { lat: 40.8518, lng: 14.2681 },
  vienna: { lat: 48.2082, lng: 16.3738 },
  berlin: { lat: 52.52, lng: 13.405 },
  munich: { lat: 48.1351, lng: 11.582 },
  cologne: { lat: 50.9375, lng: 6.9603 },
  dresden: { lat: 51.0504, lng: 13.7373 },
  'st petersburg': { lat: 59.9311, lng: 30.3609 },
  'saint petersburg': { lat: 59.9311, lng: 30.3609 },
  moscow: { lat: 55.7558, lng: 37.6173 },
  geneva: { lat: 46.2044, lng: 6.1432 },
  zurich: { lat: 47.3769, lng: 8.5417 },
  basel: { lat: 47.5596, lng: 7.5886 },
  copenhagen: { lat: 55.6761, lng: 12.5683 },
  stockholm: { lat: 59.3293, lng: 18.0686 },
  oslo: { lat: 59.9139, lng: 10.7522 },
  dublin: { lat: 53.3498, lng: -6.2603 },
  edinburgh: { lat: 55.9533, lng: -3.1883 },
  prague: { lat: 50.0755, lng: 14.4378 },
  budapest: { lat: 47.4979, lng: 19.0402 },
  warsaw: { lat: 52.2297, lng: 21.0122 },
  athens: { lat: 37.9838, lng: 23.7275 },
  istanbul: { lat: 41.0082, lng: 28.9784 },
  cairo: { lat: 30.0444, lng: 31.2357 },
  washington: { lat: 38.9072, lng: -77.0369 },
  'washington dc': { lat: 38.9072, lng: -77.0369 },
  boston: { lat: 42.3601, lng: -71.0589 },
  philadelphia: { lat: 39.9526, lng: -75.1652 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  detroit: { lat: 42.3314, lng: -83.0458 },
  toronto: { lat: 43.6532, lng: -79.3832 },
  montreal: { lat: 45.5017, lng: -73.5673 },
  'mexico city': { lat: 19.4326, lng: -99.1332 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  kyoto: { lat: 35.0116, lng: 135.7681 },
  beijing: { lat: 39.9042, lng: 116.4074 },
  shanghai: { lat: 31.2304, lng: 121.4737 },
  taipei: { lat: 25.033, lng: 121.5654 },
  'hong kong': { lat: 22.3193, lng: 114.1694 },
  // French towns that appear in provenance records
  provins: { lat: 48.5597, lng: 3.2972 },
  // US towns that appear in provenance records
  'lake forest': { lat: 42.2597, lng: -87.8398 },
}

/**
 * Resolve a free-text place string to coordinates, or null if unknown.
 * Strategy: lowercase, then check if any known city name appears in the string
 * (handles "Paris, France" / "23 Boulevard des Italiens, Paris" / "Chicago, IL").
 * Longer city names are matched first so "new york" wins over a stray "york".
 */
const SORTED = Object.keys(CITIES).sort((a, b) => b.length - a.length)

// Canonical display names for the rare cases title-casing the key gets wrong.
const DISPLAY: Record<string, string> = {
  'new york': 'New York',
  'the hague': 'The Hague',
  'st petersburg': 'St Petersburg',
  'saint petersburg': 'St Petersburg',
  'los angeles': 'Los Angeles',
  'san francisco': 'San Francisco',
  'washington dc': 'Washington',
  'mexico city': 'Mexico City',
  'buenos aires': 'Buenos Aires',
  'hong kong': 'Hong Kong',
}

function titleCase(key: string): string {
  return DISPLAY[key] ?? key.replace(/\b\w/g, c => c.toUpperCase())
}

export function geocode(place: string | null | undefined): GeoPoint | null {
  if (!place) return null
  const s = place.toLowerCase()
  for (const city of SORTED) {
    if (s.includes(city)) return CITIES[city]
  }
  return null
}

/** Like geocode, but also returns the canonical city name that matched. */
export function geocodeNamed(
  place: string | null | undefined,
): { name: string; lat: number; lng: number } | null {
  if (!place) return null
  const s = place.toLowerCase()
  for (const city of SORTED) {
    if (s.includes(city)) return { name: titleCase(city), ...CITIES[city] }
  }
  return null
}
