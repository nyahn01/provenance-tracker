'use client'

/**
 * LearnAccordion — collapsible section list for /learn.
 *
 * Receives static section data from the server component (learn/page.tsx) so
 * the page itself stays a server component (no 'use client' needed there).
 *
 * Default fold state (sensible for first-time visitors):
 *   01 What is provenance?          — OPEN  (foundation concept)
 *   02 Custody vs. exhibition loan  — OPEN  (the primary visual distinction on the globe)
 *   03–06                           — CLOSED (secondary / deeper context)
 *
 * Colors come from MARKETING (same token set as the rest of learn/page.tsx).
 */

import { useState, useId } from 'react'
import type { ReactNode } from 'react'
import { MARKETING as C } from '@/lib/design-tokens'

export interface AccordionSection {
  id: string
  label: string
  title: string
  body: ReactNode
}

interface LearnAccordionProps {
  sections: AccordionSection[]
}

export function LearnAccordion({ sections }: LearnAccordionProps) {
  // Sections 01 and 02 open by default; the rest closed.
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(sections.slice(0, 2).map(s => s.id)),
  )

  const toggle = (id: string) =>
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {sections.map((section, idx) => {
        const isOpen = openIds.has(section.id)
        return (
          <AccordionItem
            key={section.id}
            section={section}
            isOpen={isOpen}
            onToggle={() => toggle(section.id)}
            isLast={idx === sections.length - 1}
          />
        )
      })}
    </div>
  )
}

interface AccordionItemProps {
  section: AccordionSection
  isOpen: boolean
  onToggle: () => void
  isLast: boolean
}

function AccordionItem({ section, isOpen, onToggle, isLast }: AccordionItemProps) {
  const panelId = useId()
  const headerId = useId()

  return (
    <div
      id={section.id}
      className="section-card learn-section"
      style={{
        background: C.surface,
        border: `1px solid ${isOpen ? C.borderMid : C.border}`,
        borderRadius: 12,
        transition: 'border-color 0.2s',
        marginBottom: isLast ? 0 : 16,
        overflow: 'hidden',
      }}
    >
      {/* Accordion header — the clickable toggle */}
      <button
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '24px 36px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          // Don't show a focus ring on mouse; keep it for keyboard
          outline: 'none',
        }}
        // Restore visible focus ring for keyboard navigation
        onFocus={e => { e.currentTarget.style.boxShadow = `inset 0 0 0 2px ${C.borderMid}` }}
        onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
      >
        {/* Section number */}
        <span
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: '0.65rem',
            color: C.textFaint,
            letterSpacing: '0.08em',
            flexShrink: 0,
          }}
        >
          {section.label}
        </span>

        {/* Title */}
        <h2
          style={{
            flex: 1,
            fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)',
            fontWeight: 400,
            color: C.text,
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {section.title}
        </h2>

        {/* Chevron indicator */}
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            fontSize: '0.75rem',
            color: C.textFaint,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s ease',
            display: 'inline-block',
            marginLeft: 8,
          }}
        >
          ▾
        </span>
      </button>

      {/* Collapsible body */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        style={{
          maxHeight: isOpen ? '9999px' : '0',
          overflow: 'hidden',
          transition: isOpen
            ? 'max-height 0.35s cubic-bezier(0.25,0.1,0,1)'
            : 'max-height 0.25s cubic-bezier(0.4,0,1,1)',
        }}
      >
        <div
          style={{
            padding: '0 36px 28px',
          }}
        >
          {/* Divider */}
          <div
            style={{ width: 40, height: 1, background: C.border, marginBottom: 20 }}
          />
          {section.body}
        </div>
      </div>
    </div>
  )
}
