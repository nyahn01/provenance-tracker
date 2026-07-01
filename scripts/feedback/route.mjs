/**
 * feedback router — the loop's connection between raw website feedback and the
 * decision queue.
 *
 * The in-app form files GitHub issues labeled `feedback` with a structured
 * category (bug | data-correction | feature | ux | general). The deep triage —
 * judging validity and writing verbatim feedback files — is the LLM
 * `feedback-triage` agent's job (it must quote users verbatim and never fabricate
 * an assessment, which a deterministic script must not attempt).
 *
 * What this DOES do, deterministically and safely, is give every untriaged
 * feedback issue a **domain owner** and queue it for triage, so nothing sits
 * unrouted. It assigns an `agent:<domain>` label + a `triage-queued` marker; it
 * never judges validity, never promotes to `priority`, never closes.
 *
 * `classifyDomain` is pure so it can be unit-tested.
 */

const DOMAINS = {
  'provenance-globe': /\b(globe|map|arc|pin|zoom|rotat|3d|marker|atmosphere)\b/,
  'design-director': /\b(design|colou?r|font|layout|spacing|typograph|ui|ux|visual|contrast|mobile|responsive)\b/,
  'provenance-strategy': /\b(price|pricing|business|market|customer|monet[ei]|subscription|revenue|pitch|competitor)\b/,
  'provenance-data': /\b(source|citation|date|provenance|custody|getty|wikidata|rkd|museum|artist|coordinate|geocod|gap|loan)\b/,
}

// Fallback owner per feedback category when no keyword matches.
const CATEGORY_DEFAULT = {
  bug: 'provenance-data',
  'data-correction': 'provenance-data',
  ux: 'design-director',
  feature: 'provenance-strategy',
  general: 'provenance-strategy',
}

/**
 * Best-guess domain owner for a feedback item. Keyword signal wins; otherwise the
 * category's default; otherwise strategy (the generalist triage owner).
 * @returns {string} a domain name (the label is `agent:<domain>`)
 */
export function classifyDomain(category, title = '', body = '') {
  const text = `${title}\n${body}`.toLowerCase()
  for (const [domain, re] of Object.entries(DOMAINS)) {
    if (re.test(text)) return domain
  }
  return CATEGORY_DEFAULT[category] ?? 'provenance-strategy'
}

/** Parse the `[feedback] <category>: …` title convention back to its category. */
export function categoryOf(issue) {
  const m = (issue.title || '').match(/^\[feedback\]\s*([a-z-]+)\s*:/i)
  return m ? m[1].toLowerCase() : 'general'
}

/**
 * Plan routing actions for a batch of feedback issues. Pure: no I/O.
 * Skips issues already carrying `triage-queued` (idempotent).
 * @returns {Array<{number:number, domain:string, label:string}>}
 */
export function planFeedbackRouting(issues) {
  const out = []
  for (const it of issues) {
    const labels = (it.labels || []).map(l => (typeof l === 'string' ? l : l.name))
    if (labels.includes('triage-queued')) continue // already routed
    const domain = classifyDomain(categoryOf(it), it.title, it.body || '')
    out.push({ number: it.number, domain, label: `agent:${domain}` })
  }
  return out
}
