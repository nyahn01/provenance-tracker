'use client'

/**
 * SourceCard — a source-citation hover/focus card anchored to a timeline event's
 * source badge. Reveals the full institution name and a deep link to the source
 * record (where one exists). Keyboard-accessible: the trigger is a real button
 * (focusable), the card opens on hover OR focus, and dismisses on blur or Escape.
 *
 * Honesty (CLAUDE.md): every shown fact carries a visible source. This card makes
 * that attribution explicit and links to the public record that documents it.
 * Never asserts "current location" — it names who DOCUMENTS the fact, with a date
 * already shown by the event row. A fact with no record link shows the institution
 * as plain attribution, not a blank.
 *
 * Tokens: GAL palette only (gallery panel context).
 */
import { useId, useRef, useState, type CSSProperties } from 'react'
import { GAL } from '@/lib/design-tokens'
import { SourceBadge } from './SourceBadge'
import { sourceInstitution } from './timeline'

interface SourceCardProps {
  /** Tier label / raw source string for this event (e.g. "AIC", "Wikidata"). */
  source: string
  /** Deep link to the source record, or null when no stable public URL exists. */
  recordUrl: string | null
}

const cardStyle: CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  left: 0,
  zIndex: 20,
  width: 'max(220px, 100%)',
  maxWidth: 280,
  background: GAL.surface,
  border: `1px solid ${GAL.borderMid}`,
  borderRadius: 8,
  padding: '10px 12px',
  boxShadow: '0 8px 28px rgba(26,23,20,0.18)',
  fontFamily: 'var(--font-ui)',
  textAlign: 'left',
}

/**
 * Transparent bridge that fills the 6px gap between the card bottom and
 * the trigger top. Without this, the cursor passes through empty space
 * when moving upward from the trigger into the card, triggering onMouseLeave
 * and collapsing the card before the user can reach the link inside it.
 *
 * Positioned at bottom: 100% (= top of the trigger element), height 8px
 * (slightly exceeds the 6px gap), so it seamlessly connects the hover zones.
 */
const bridgeStyle: CSSProperties = {
  position: 'absolute',
  bottom: '100%',
  left: 0,
  width: '100%',
  height: 8,
  background: 'transparent',
  zIndex: 19,
}

export function SourceCard({ source, recordUrl }: SourceCardProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const cardId = useId()
  const institution = sourceInstitution(source)

  // Close when focus leaves the whole trigger+card subtree (keyboard tab-away).
  function handleBlur(e: React.FocusEvent<HTMLSpanElement>) {
    if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
  }

  return (
    <span
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={handleBlur}
      onKeyDown={e => { if (e.key === 'Escape' && open) { setOpen(false); e.stopPropagation() } }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? cardId : undefined}
        aria-label={`Source: ${institution}`}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', padding: 0, margin: 0,
          cursor: 'pointer', borderRadius: 5,
        }}
      >
        <SourceBadge source={source} />
      </button>

      {open && (
        <>
          {/* Transparent bridge: fills the 6–8 px gap between the trigger and
              the card above it. Without this, moving the cursor upward into
              the card briefly exits the hover container and collapses the card
              before the user can reach the link inside it. */}
          <span aria-hidden="true" style={bridgeStyle} />

          <span id={cardId} role="tooltip" style={cardStyle}>
            <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GAL.textFaint, marginBottom: 4 }}>
              Source
            </span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: GAL.text, fontWeight: 500, lineHeight: 1.35 }}>
              {institution}
            </span>
            {recordUrl ? (
              <a
                href={recordUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 7, fontSize: '0.7rem', color: GAL.clay, textDecoration: 'none', borderBottom: `1px solid ${GAL.border}`, paddingBottom: 1 }}
              >
                View source record ↗
              </a>
            ) : (
              <span style={{ display: 'block', marginTop: 7, fontSize: '0.68rem', color: GAL.textMuted, lineHeight: 1.4 }}>
                No public record link for this fact — attributed to the institution above.
              </span>
            )}
          </span>
        </>
      )}
    </span>
  )
}
