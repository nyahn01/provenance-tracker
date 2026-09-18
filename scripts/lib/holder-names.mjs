/**
 * Canonical holder names — scripts-side mirror of src/lib/holder-names.ts.
 *
 * The curation pipeline (preparse-provenance.mjs) can't import TS, so this
 * duplicates the table the way scripts/lib/cities.mjs mirrors the gazetteer.
 * Drift is guarded by tests/holder-names.test.ts — edit BOTH files together.
 *
 * See the TS module for the rules and the evidence behind each alias.
 */

export const ALIASES = {
  'art institute': 'The Art Institute of Chicago',
  'art institute of chicago': 'The Art Institute of Chicago',
  'bernheim-jeune': 'Galerie Bernheim-Jeune',
  'palmer family': 'Palmer family',
}

function normalizeKey(name) {
  return name.toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, ' ').trim()
}

/** Canonical form of a holder name, or the name unchanged when no rule applies. */
export function canonicalHolder(name) {
  if (!name) return ''
  const trimmed = String(name).replace(/\s+/g, ' ').trim()
  return ALIASES[normalizeKey(trimmed)] ?? trimmed
}
