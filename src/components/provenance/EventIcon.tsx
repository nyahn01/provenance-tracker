/**
 * EventIcon — the single home for a timeline event's type glyph.
 *
 * The glyphs (→ ⌂ ♥ ↻ ░) live in EV_STYLES (timeline.ts) and stay byte-identical
 * here — this component only centralizes how they render and adds accessibility.
 * It is marked `aria-hidden` on purpose: every render site already shows the
 * event type as adjacent text (e.g. "dealer", "museum acq.", "Provenance gap"),
 * so the glyph is decorative and would otherwise be read out as a meaningless
 * character. A `title` keeps a sighted-hover affordance and a human label map is
 * exported for reuse. Centralizing here also makes a future swap to real SVG
 * icons a one-file change.
 */
import type { CSSProperties } from 'react'
import type { ProvenanceEvent } from './timeline'
import { EV_STYLES } from './timeline'

/** Human-readable label for each event type (sighted-hover title + reuse). */
export const EVENT_LABEL: Record<ProvenanceEvent['type'], string> = {
  dealer:      'Dealer sale',
  custody:     'Ownership',
  gift:        'Gift / bequest',
  acquisition: 'Museum acquisition',
  exhibition:  'Exhibition loan',
  gap:         'Documentation gap',
}

export function EventIcon({
  type,
  color,
  fontSize = '0.75rem',
  style,
}: {
  type: ProvenanceEvent['type']
  /** Override the glyph color (defaults to the type's EV_STYLES color). */
  color?: string
  fontSize?: string | number
  /** Extra style merged last — used to preserve site-specific layout (e.g. minWidth). */
  style?: CSSProperties
}) {
  return (
    <span
      aria-hidden="true"
      title={EVENT_LABEL[type]}
      style={{ fontSize, color: color ?? EV_STYLES[type].color, lineHeight: 1, ...style }}
    >
      {EV_STYLES[type].icon}
    </span>
  )
}
