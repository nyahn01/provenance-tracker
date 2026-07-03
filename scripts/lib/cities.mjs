/**
 * Shared scripts-side gazetteer — the ONE city table for the curation pipeline
 * (curate.mjs, preparse-provenance.mjs, discover-works.mjs, promote-work.mjs).
 *
 * Runtime mirror: src/lib/geocode.ts owns the same table for the API routes
 * (scripts can't import TS). Drift is guarded by a subset assertion in
 * tests/geocode-drift.test.ts — if you add a city HERE, add it THERE too.
 * (globe-data.ts CITY_COORDS is intentionally a smaller dealer-dot set — not
 * this table.)
 *
 * A place not in this table resolves to null coords — the entry still shows in
 * the timeline, it just isn't mapped. Honest behavior: never invent a coordinate.
 */

export const CITIES = {
  paris: { lat: 48.8566, lng: 2.3522 }, london: { lat: 51.5074, lng: -0.1278 },
  'new york': { lat: 40.7128, lng: -74.006 }, chicago: { lat: 41.8781, lng: -87.6298 },
  amsterdam: { lat: 52.3676, lng: 4.9041 }, brussels: { lat: 50.8503, lng: 4.3517 },
  'the hague': { lat: 52.0705, lng: 4.3007 }, rotterdam: { lat: 51.9244, lng: 4.4777 },
  antwerp: { lat: 51.2194, lng: 4.4025 }, bruges: { lat: 51.2093, lng: 3.2247 },
  madrid: { lat: 40.4168, lng: -3.7038 }, barcelona: { lat: 41.3874, lng: 2.1686 },
  lisbon: { lat: 38.7223, lng: -9.1393 }, florence: { lat: 43.7696, lng: 11.2558 },
  rome: { lat: 41.9028, lng: 12.4964 }, venice: { lat: 45.4408, lng: 12.3155 },
  milan: { lat: 45.4642, lng: 9.19 }, naples: { lat: 40.8518, lng: 14.2681 },
  vienna: { lat: 48.2082, lng: 16.3738 }, berlin: { lat: 52.52, lng: 13.405 },
  munich: { lat: 48.1351, lng: 11.582 }, cologne: { lat: 50.9375, lng: 6.9603 },
  dresden: { lat: 51.0504, lng: 13.7373 }, 'st petersburg': { lat: 59.9311, lng: 30.3609 },
  'saint petersburg': { lat: 59.9311, lng: 30.3609 }, moscow: { lat: 55.7558, lng: 37.6173 },
  geneva: { lat: 46.2044, lng: 6.1432 }, zurich: { lat: 47.3769, lng: 8.5417 },
  basel: { lat: 47.5596, lng: 7.5886 }, copenhagen: { lat: 55.6761, lng: 12.5683 },
  stockholm: { lat: 59.3293, lng: 18.0686 }, oslo: { lat: 59.9139, lng: 10.7522 },
  dublin: { lat: 53.3498, lng: -6.2603 }, edinburgh: { lat: 55.9533, lng: -3.1883 },
  prague: { lat: 50.0755, lng: 14.4378 }, budapest: { lat: 47.4979, lng: 19.0402 },
  warsaw: { lat: 52.2297, lng: 21.0122 }, athens: { lat: 37.9838, lng: 23.7275 },
  istanbul: { lat: 41.0082, lng: 28.9784 }, cairo: { lat: 30.0444, lng: 31.2357 },
  washington: { lat: 38.9072, lng: -77.0369 }, 'washington dc': { lat: 38.9072, lng: -77.0369 },
  boston: { lat: 42.3601, lng: -71.0589 }, philadelphia: { lat: 39.9526, lng: -75.1652 },
  'los angeles': { lat: 34.0522, lng: -118.2437 }, 'san francisco': { lat: 37.7749, lng: -122.4194 },
  detroit: { lat: 42.3314, lng: -83.0458 }, toronto: { lat: 43.6532, lng: -79.3832 },
  montreal: { lat: 45.5017, lng: -73.5673 }, 'mexico city': { lat: 19.4326, lng: -99.1332 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 }, tokyo: { lat: 35.6762, lng: 139.6503 },
  kyoto: { lat: 35.0116, lng: 135.7681 }, beijing: { lat: 39.9042, lng: 116.4074 },
  shanghai: { lat: 31.2304, lng: 121.4737 }, taipei: { lat: 25.033, lng: 121.5654 },
  'hong kong': { lat: 22.3193, lng: 114.1694 },
  // French towns that appear in provenance records
  provins: { lat: 48.5597, lng: 3.2972 },
  // US towns that appear in provenance records
  'lake forest': { lat: 42.2597, lng: -87.8398 },
  naugatuck: { lat: 41.4854, lng: -73.0504 },
  // Spanish towns that appear in provenance records
  toledo: { lat: 39.8628, lng: -4.0273 },
  'el pardo': { lat: 40.5273, lng: -3.7702 },
  escorial: { lat: 40.5885, lng: -4.1379 },
  // German/Polish town (historic German name as recorded in the source)
  breslau: { lat: 51.1079, lng: 17.0385 },
}

const SORTED = Object.keys(CITIES).sort((a, b) => b.length - a.length)

// Canonical display names where title-casing the key gets it wrong.
export const DISPLAY = {
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

export function titleCaseCity(key) {
  return DISPLAY[key] ?? key.replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Resolve a free-text place string to its gazetteer key + coordinates, or null.
 * Longest key first so "new york" wins over a stray "york".
 */
export function geocodeKey(place) {
  if (!place) return null
  const s = String(place).toLowerCase()
  for (const key of SORTED) if (s.includes(key)) return { key, ...CITIES[key] }
  return null
}
