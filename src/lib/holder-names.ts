/**
 * Canonical holder names for the custody chain.
 *
 * Museum provenance prose is not internally consistent: the same holder is
 * written several ways across (and within) records. The Art Institute of Chicago
 * is the clearest case — it is the final holder of every featured work and
 * appears as three different strings, so the last row of the chain reads
 * differently from work to work. Visitors read that as a parsing failure, and
 * it is one (feedback #228).
 *
 * This canonicalizes the WRITING of a name. It never merges holders, never adds
 * a holder the source does not name, and never changes a date, a place or a
 * source citation. Two rules:
 *
 *   1. For MATCHING, case, leading article and whitespace are not identity:
 *      "Palmer Family" and "Palmer family" are one holder written twice.
 *   2. For DISPLAY, the spelling always comes from an explicit entry in ALIASES.
 *      With no entry the source's own writing is kept verbatim. We never silently
 *      re-case or re-word a name, so every displayed change is one reviewable
 *      line in the table below, with its evidence in the comment.
 *
 * Scripts-side mirror: scripts/lib/holder-names.mjs (the curation pipeline can't
 * import TS). Drift is guarded by tests/holder-names.test.ts — edit BOTH.
 */

/**
 * Explicit identity merges. Key is the lowercased variant as the source writes
 * it; value is the canonical form shown to a reader.
 *
 * Every entry names its evidence. Do not add one on resemblance alone.
 */
export const ALIASES: Record<string, string> = {
  // The Art Institute of Chicago — this repo's primary source institution, and
  // the final holder of all 13 featured works. AIC's own prose shortens its name
  // inconsistently. Canonical form is the museum's legal name.
  'art institute': 'The Art Institute of Chicago',
  'art institute of chicago': 'The Art Institute of Chicago',

  // Galerie Bernheim-Jeune, Paris. The bare surname form appears once (aic:87045,
  // 1907-08) against five "Galerie Bernheim-Jeune" in the same Paris dealer role.
  // NOTE: "Durand-Ruel and Bernheim-Jeune" is NOT this — that is a joint purchase
  // by two dealers and is deliberately left as written.
  'bernheim-jeune': 'Galerie Bernheim-Jeune',

  // The Potter Palmer heirs, written both ways across two works (aic:18951,
  // aic:64818) with no majority. Lowercase "family" after a surname is the
  // standard form, and it is what AIC uses in the longer of the two records.
  'palmer family': 'Palmer family',

  // DELIBERATELY NOT MERGED — "Frederick Clay Bartlett" (aic:87045, 1928-32)
  // against "Frederic Clay Bartlett" (three works, 1924-26). Almost certainly the
  // same Chicago collector, but a person's given name is an identity claim and we
  // have not checked it against a source. It stays as two names until someone
  // does. Adding a wrong merge here costs more than leaving a spelling variant.
}

/** Strip the writing-level noise that is never identity: case, article, spacing. */
function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, ' ').trim()
}

/**
 * Canonical form of a holder name, or the name unchanged when we have no rule.
 * Unknown names always pass through untouched — silence, never a guess.
 */
export function canonicalHolder(name: string | null | undefined): string {
  if (!name) return ''
  const trimmed = name.replace(/\s+/g, ' ').trim()
  const key = normalizeKey(trimmed)
  if (ALIASES[key]) return ALIASES[key]
  return trimmed
}

/**
 * True when two holder strings are the same holder under the rules above. Used
 * to check consistency, not to merge anything on the fly.
 */
export function sameHolder(a: string, b: string): boolean {
  return canonicalHolder(a) === canonicalHolder(b) || normalizeKey(a) === normalizeKey(b)
}
