/**
 * Graduated auto-promotion (approved policy).
 *
 * The high-stakes, low-ambiguity sentinels — security and honesty — may auto-promote
 * their `proposal`s to `priority` so the human isn't the bottleneck for the things
 * that protect the moat. Everything else stays the human's `priority` button, guided
 * by the Decision digest. Auto-promotion NEVER merges — a human always merges.
 *
 * Pure: given a proposal title + the enabled kinds, returns the owning agent domain
 * to promote it under, or null. Unit-testable.
 */

const KIND = [
  { re: /^\[sentinel\]\s*security/i, kind: 'security', agent: 'provenance-data' },
  { re: /^\[sentinel\]\s*honesty/i, kind: 'honesty', agent: 'provenance-honesty-review' },
]

/**
 * @param {string} title
 * @param {string[]} kinds enabled kinds, e.g. ['security','honesty']
 * @returns {{kind:string, agent:string}|null}
 */
export function autoPromoteTarget(title, kinds = ['security', 'honesty']) {
  for (const k of KIND) {
    if (kinds.includes(k.kind) && k.re.test(title || '')) return { kind: k.kind, agent: k.agent }
  }
  return null
}
