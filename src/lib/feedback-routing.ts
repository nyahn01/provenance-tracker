/**
 * Feedback routing — picks the domain owner for an inbound feedback item.
 *
 * Called by `/api/feedback` at the moment the issue is created, so a submission
 * arrives already carrying `agent:<domain>`. Routing used to run on the
 * orchestrator's cron, which meant an item waited up to a full cron interval for
 * a label; doing it at intake removes that wait and the scheduled job entirely.
 *
 * This assigns an owner. It never judges validity, never promotes, never closes.
 * Deep triage (the verbatim record in `feedback/`) stays the `feedback-triage`
 * agent's job, because a deterministic function must not invent an assessment.
 *
 * Both functions are pure so they can be unit-tested without any I/O.
 */

import type { AgentDomain, FeedbackCategory } from './types'

/** Keyword signal per domain. First match wins, so order is significant. */
const DOMAINS: ReadonlyArray<readonly [AgentDomain, RegExp]> = [
  ['provenance-globe', /\b(globe|map|arc|pin|zoom|rotat|3d|marker|atmosphere)\b/],
  ['design-director', /\b(design|colou?r|font|layout|spacing|typograph|ui|ux|visual|contrast|mobile|responsive)\b/],
  ['provenance-strategy', /\b(price|pricing|business|market|customer|monet[ei]|subscription|revenue|pitch|competitor)\b/],
  ['provenance-data', /\b(source|citation|date|provenance|custody|getty|wikidata|rkd|museum|artist|coordinate|geocod|gap|loan)\b/],
]

/** Fallback owner per category when no keyword matches. */
const CATEGORY_DEFAULT: Record<FeedbackCategory, AgentDomain> = {
  bug: 'provenance-data',
  'data-correction': 'provenance-data',
  ux: 'design-director',
  feature: 'provenance-strategy',
  general: 'provenance-strategy',
}

/**
 * Best-guess domain owner for a feedback item. Keyword signal wins; otherwise the
 * category's default; otherwise strategy, the generalist triage owner.
 */
export function classifyDomain(category: string, title = '', body = ''): AgentDomain {
  const text = `${title}\n${body}`.toLowerCase()
  for (const [domain, re] of DOMAINS) {
    if (re.test(text)) return domain
  }
  return CATEGORY_DEFAULT[category as FeedbackCategory] ?? 'provenance-strategy'
}

/** The GitHub labels a new feedback issue is created with. */
export function feedbackLabels(category: string, title = '', body = ''): string[] {
  return ['feedback', `agent:${classifyDomain(category, title, body)}`]
}
