/**
 * Design tokens — single JS source of truth for color palettes consumed in TS/TSX.
 *
 * ⚠️  DEDUPE-ONLY MODULE. Every value here is byte-identical to what the app
 *     renders TODAY. Changing a value here changes rendered pixels. Converging
 *     the known drift (see below) is a SEPARATE, design-reviewed task — do not
 *     "tidy" values in this file.
 *
 * Mirrors the CSS custom properties in `src/app/globals.css` (--obs-* / --gal-*)
 * and the Tailwind theme in `tailwind.config.ts`. Three palettes coexist on
 * purpose; they are NOT interchangeable:
 *
 *   OBS        — the observatory (dark) app chrome used by StoriesApp + the globe.
 *   GAL        — the gallery (light) palette used inside the provenance detail panel.
 *   MARKETING  — the slightly-lighter dark palette used by the static marketing
 *                pages (/team, /learn, /pricing, /demo, /demo/source, /feedback).
 *
 * KNOWN DRIFT (intentionally preserved — do not unify without design review):
 *   • OBS.surface   #131110  ≠  MARKETING.surface   #111010
 *   • OBS.borderMid #3d3228  ≠  MARKETING.borderMid #3a3028
 *   • OBS.textFaint #5c5449  ≠  MARKETING.textFaint #5a5248
 *   • GAL.sage      #4a7a6a  ≠  globals.css --gal-sage #4a6b5e  (JS value is what renders)
 *   • /team uses MARKETING with sage overridden to #4a7a6a (see usage note below).
 *
 * The globe trio (ocean/land/border) is governed by the GLOBE CONTRACT in
 * draft/TOMORROW.md — these are the values that actually render, NOT the stale
 * globe-* block in draft/CLAUDE.md.
 */

// ─── Observatory (dark) — app chrome + globe ─────────────────────────────────
export const OBS = {
  bg: '#0a0908', surface: '#131110', border: '#2a2218', borderMid: '#3d3228',
  text: '#f6f1e8', textMuted: '#9a8f85', textFaint: '#5c5449',
  clay: '#c87855', gold: '#d4a853', sage: '#6f8d7d',
  globeOcean: '#060504', globeLand: '#7a5828', globeBorder: '#a87848',
} as const

// ─── Gallery (light) — provenance detail panel ───────────────────────────────
export const GAL = {
  bg: '#f7f4ee', surface: '#ffffff', surface2: '#ede9e2', border: '#d8d2c8', borderMid: '#b8afa3',
  text: '#1a1714', textMuted: '#6b6460', textFaint: '#9e9790',
  clay: '#b06840', sage: '#4a7a6a', gold: '#a07830',
} as const

// ─── Marketing (dark, lighter surfaces) — static pages ───────────────────────
// Superset of every marketing `C` object. Pages reference only the keys they
// need; unused keys are harmless. /team must override sage:
//   const C = { ...MARKETING, sage: '#4a7a6a' }
export const MARKETING = {
  bg: '#0a0908', surface: '#111010', surface2: '#161413',
  border: '#2a2218', borderMid: '#3a3028',
  text: '#f6f1e8', textMuted: '#9a8f85', textFaint: '#5a5248',
  gold: '#d4a853', sage: '#6f8d7d', clay: '#c87855',
  gap: '#9a8f85',     // learn/page.tsx — matches EV_STYLES.gap color
  purple: '#9b7fe0',  // team/page.tsx — dealer/agent accent
} as const

// ─── Semantic layer (additive) ───────────────────────────────────────────────
// New names mapped to EXISTING rendered literals (CONFIDENCE_DOT, EV_STYLES,
// RISK in StoriesApp.tsx). Provided for adoption during the Phase 3 redesign;
// these do not yet replace the inline literals. No new colors are introduced.
export const accent = {
  primaryObs: OBS.clay,   // #c87855
  primaryGal: GAL.clay,   // #b06840
  gold: OBS.gold,         // #d4a853
  sage: OBS.sage,         // #6f8d7d
  dealer: '#7c5cbf',      // EV_STYLES.dealer
  dealerSoft: '#9b7fe0',  // marketing purple
} as const

export const state = {
  // success ≈ sage / acquisition / CLEAR
  success: GAL.sage,                  // #4a7a6a
  successDot: 'rgba(100,180,100,0.8)', // CONFIDENCE_DOT.high
  // warning ≈ gold / REVIEW / medium
  warning: GAL.gold,                  // #a07830
  warningDot: 'rgba(200,160,60,0.8)',  // CONFIDENCE_DOT.medium
  // error / flag ≈ clay / FLAG
  error: GAL.clay,                    // #b06840
  // faint / low / gap
  faintDot: 'rgba(154,143,133,0.5)',   // CONFIDENCE_DOT.low
  gap: '#9a8f85',                      // EV_STYLES.gap
} as const

// ─── Globe trio (GLOBE CONTRACT — draft/TOMORROW.md) ─────────────────────────
export const globe = {
  ocean: '#060504',   // canvas fill literal in StoriesApp globe init — DO NOT change
  land: '#7a5828',
  border: '#a87848',
} as const
