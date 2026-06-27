/**
 * GET /api/status
 *
 * A small, honest, machine-readable status surface — so live-ish facts (e.g. how
 * many works are featured, whether a Claude key is configured) have a single
 * derivable home instead of being restated in prose that rots.
 *
 * Honesty: reports only static / derivable facts. It does NOT claim runtime
 * availability it cannot verify — `claudeKeyConfigured` means an API key is present
 * in the environment, NOT that the account has credits or that any call will
 * succeed (a deterministic extraction fallback runs when it doesn't). No source
 * here makes a "currently"/real-time claim.
 */

import { NextResponse } from 'next/server'
import { FEATURED_WORKS } from '@/lib/featured'

// Bump when the honesty contract in CLAUDE.md changes in a way consumers should notice.
const HONESTY_CONTRACT_VERSION = '1.0'

// Tier-labelled source list — mirrors docs/DATA_SOURCES.md (link, don't fork).
const SOURCES = [
  { id: 'aic', label: 'Art Institute of Chicago', tier: 'A', keyless: true },
  { id: 'met', label: 'Metropolitan Museum', tier: 'A', keyless: true },
  { id: 'rijksmuseum', label: 'Rijksmuseum Linked Art', tier: 'A', keyless: true },
  { id: 'getty', label: 'Getty Provenance Index (Knoedler + Goupil)', tier: 'A', keyless: true },
  { id: 'rkd', label: 'RKD Netherlands', tier: 'A', keyless: true },
  { id: 'cleveland', label: 'Cleveland Museum of Art', tier: 'A', keyless: true },
  { id: 'wikidata', label: 'Wikidata SPARQL (P276/P580/P582)', tier: 'B', keyless: true },
  { id: 'europeana', label: 'Europeana', tier: 'B', keyless: false },
] as const

export async function GET() {
  return NextResponse.json({
    name: 'provenance-tracker',
    featuredWorks: FEATURED_WORKS.length,
    sources: SOURCES,
    sourceCount: SOURCES.length,
    honestyContractVersion: HONESTY_CONTRACT_VERSION,
    // Key present in env — NOT a claim about credits or runtime success.
    claudeKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    europeanaKeyConfigured: Boolean(process.env.EUROPEANA_API_KEY),
    note: 'Static/derivable facts only. See docs/DATA_SOURCES.md and docs/WORKFLOW_STAGES.md.',
  })
}
