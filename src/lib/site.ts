/**
 * Canonical site identity — one fact, one home.
 *
 * Consumed by root metadata (layout.tsx), sitemap.ts, robots.ts, and every
 * JSON-LD block. Override the URL per environment with NEXT_PUBLIC_SITE_URL
 * (e.g. when a custom domain lands) — never hardcode the host anywhere else.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://provenance-tracker-tan.vercel.app'

export const SITE_NAME = 'Provenance Tracker'
