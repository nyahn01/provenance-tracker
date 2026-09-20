/**
 * Refreshing an open sentinel finding instead of suppressing it (issue #232).
 *
 * The old rule was: a marker match means "already reported", so do nothing. That
 * is idempotency implemented as SUPPRESSION, and it let #202 sit for 60 runs
 * reading "2 high" while the real count became 1 critical + 6 high + 3 moderate.
 * A monitor that cannot revise its own finding is a tombstone.
 *
 * The rule now: refresh the issue in place, and speak only when it got worse.
 *
 * ## Why this cannot become a comment pump
 *
 * The loop review (#231) found the Act step posting the same comment daily for 77
 * days, so a new write path here has to be provably bounded. Three things bound it:
 *
 *  1. A body or title PATCH sends no notification on GitHub. Refreshes are silent
 *     however often they happen, so the common case costs a reader nothing.
 *  2. A comment is posted ONLY when the finding exceeds its own recorded
 *     high-water mark, not merely when it differs from last run. A count that
 *     oscillates 6 → 7 → 6 → 7 comments once, at the first 7.
 *  3. The high-water mark is stored in the issue body, so it survives across runs
 *     and across restarts of the orchestrator.
 *
 * Together those make the number of comments bounded by the number of times a
 * finding reaches a new worst — which is what a person actually wants to hear.
 *
 * Everything here is pure. The orchestrator does the I/O.
 */

/** Marker carrying the finding's current signal and its worst-ever signal. */
const STATE_RE = /<!-- sentinel-state:(\{[\s\S]*?\}) -->/

export function renderState(state) {
  return `<!-- sentinel-state:${JSON.stringify(state)} -->`
}

/**
 * Read the stored state from an issue body. Returns null when absent or corrupt —
 * a body written before this feature, or hand-edited, must not crash a run.
 */
export function parseState(body) {
  const m = STATE_RE.exec(body || '')
  if (!m) return null
  try {
    const parsed = JSON.parse(m[1])
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/** The body as it reads without the state marker, for comparing like with like. */
export function stripState(body) {
  return (body || '').replace(STATE_RE, '').trimEnd()
}

/**
 * Which counters in `signal` exceed the worst previously recorded, and by how much.
 * An absent peak treats every counter as new ground.
 *
 * @param {Record<string, number>|null|undefined} signal
 * @param {Record<string, number>|null|undefined} peak
 * @returns {Array<{key: string, from: number, to: number}>}
 */
export function exceedsPeak(signal, peak) {
  if (!signal || typeof signal !== 'object') return []
  const worse = []
  for (const [key, value] of Object.entries(signal)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    const before = Number(peak?.[key]) || 0
    if (value > before) worse.push({ key, from: before, to: value })
  }
  return worse
}

/** The element-wise maximum of two signals — the new high-water mark. */
export function mergePeak(signal, peak) {
  const out = { ...(peak && typeof peak === 'object' ? peak : {}) }
  for (const [key, value] of Object.entries(signal || {})) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    if (value > (Number(out[key]) || 0)) out[key] = value
  }
  return out
}

/**
 * Decide what to do about a finding whose issue is already open.
 *
 * @param {{title: string, body: string, labels?: string[]}} issue the open issue
 * @param {{id: string, label: string, title: string, body: string, signal?: Record<string, number>}} finding
 * @returns {{action: 'noop'|'refresh'|'escalate', title?: string, body: string, comment?: string}}
 */
export function planRefresh(issue, finding) {
  const prior = parseState(issue.body)
  const signal = finding.signal && typeof finding.signal === 'object' ? finding.signal : null
  const peak = mergePeak(signal, prior?.peak)
  const state = { signal: signal ?? undefined, peak, label: finding.label }
  const body = `${finding.body}\n\n${renderState(state)}`

  const textChanged = stripState(issue.body) !== stripState(body)
  const titleChanged = (issue.title || '') !== finding.title

  // A finding is worse when a counter passes its own high-water mark, or when the
  // sentinel escalated it to `priority`. Label escalation counts even with no
  // signal, because that IS the severity tier changing.
  const worse = exceedsPeak(signal, prior?.peak)
  const escalatedLabel = finding.label === 'priority' && prior?.label && prior.label !== 'priority'

  if (!textChanged && !titleChanged && !worse.length && !escalatedLabel) {
    return { action: 'noop', body }
  }
  if (!worse.length && !escalatedLabel) {
    // Quiet correction: the wording moved but the finding is no worse than it has
    // already been. Patch it so the issue reads true, and say nothing.
    return { action: 'refresh', title: finding.title, body }
  }
  return {
    action: 'escalate',
    title: finding.title,
    body,
    comment: escalationComment(finding, worse, escalatedLabel, prior),
  }
}

/** The one comment an escalation is allowed to post. States what got worse, and by how much. */
function escalationComment(finding, worse, escalatedLabel, prior) {
  const lines = ['**This finding got worse since it was filed.** The issue body above is now current.', '']
  if (escalatedLabel) {
    lines.push(`Severity tier escalated: \`${prior.label}\` → \`${finding.label}\`.`, '')
  }
  if (worse.length) {
    lines.push('Past its previous worst:')
    for (const w of worse) lines.push(`- \`${w.key}\`: ${w.from} → **${w.to}**`)
    lines.push('')
  }
  lines.push(
    '_Posted once, when the finding passed its own high-water mark — not on every run. ' +
    'Routine re-scans refresh the body silently (issue #232)._',
  )
  return lines.join('\n')
}
