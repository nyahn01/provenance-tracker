/**
 * Palette resolution for the ui/ primitives.
 *
 * One prop, three palettes (they coexist on purpose — see design-tokens.ts):
 * 'marketing' (static pages, default) · 'obs' (dark app chrome) · 'gal'
 * (light detail panel). Primitives never restate a hex; they resolve here.
 */
import { OBS, GAL, MARKETING } from '@/lib/design-tokens'

export type PaletteName = 'marketing' | 'obs' | 'gal'

export interface PaletteShape {
  bg: string
  surface: string
  border: string
  borderMid: string
  text: string
  textMuted: string
  textFaint: string
  gold: string
  clay: string
  sage: string
}

export function resolvePalette(name: PaletteName = 'marketing'): PaletteShape {
  if (name === 'obs') return OBS
  if (name === 'gal') return GAL
  return MARKETING
}
