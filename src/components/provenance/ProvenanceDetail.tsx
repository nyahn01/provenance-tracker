'use client'

/**
 * ProvenanceDetail — the warm "gallery" sidebar shown when a work is selected:
 * the mobile/tablet hamburger + backdrop, the slide-in panel, the arc legend,
 * the unified timeline, RKD records, primary-source text, the deterministic
 * Provenance Intelligence card, and the sources/credit footer.
 *
 * Extracted verbatim from StoriesApp.tsx (no behavioral change). StoriesApp
 * still owns all state; this component receives it via props.
 */
import { useRef, type Dispatch, type SetStateAction } from 'react'
import type { SearchResult, ProvenanceResponse } from '@/lib/types'
import type { RkdRecord } from '@/lib/rkd'
import { OBS, GAL } from '@/lib/design-tokens'
import { SourceCard } from './SourceCard'
import { ConfidenceDot } from './ConfidenceDot'
import { PriceSparkline } from './PriceSparkline'
import { EventIcon } from './EventIcon'
import { useFocusTrap } from './useFocusTrap'
import { buildUnifiedTimeline, detectWWIIGap, EV_STYLES, sourceRecordUrl } from './timeline'

interface ProvenanceDetailProps {
  selected: SearchResult
  hero: string | null
  credit: string | null
  prov: ProvenanceResponse | null
  loading: boolean
  showInsight: boolean
  setShowInsight: Dispatch<SetStateAction<boolean>>
  onClose: () => void
  isTablet: boolean
  drawerOpen: boolean
  setDrawerOpen: Dispatch<SetStateAction<boolean>>
}

export function ProvenanceDetail({
  selected, hero, credit, prov, loading, showInsight, setShowInsight,
  onClose, isTablet, drawerOpen, setDrawerOpen,
}: ProvenanceDetailProps) {
  const sources = prov ? [...new Set(prov.locations.map(l => l.source))] : []

  // On tablet/mobile the panel is a modal slide-in drawer — trap focus inside it
  // while open and close on Escape. On desktop it is an always-visible side panel
  // (non-modal), so the trap stays inactive.
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, isTablet && drawerOpen, () => setDrawerOpen(false))

  return (
    <>
      {/* ── Hamburger button — visible on mobile/tablet when story is open ──── */}
      {isTablet && (
        <button
          onClick={() => setDrawerOpen(o => !o)}
          aria-label={drawerOpen ? 'Close provenance panel' : 'Open provenance panel'}
          style={{
            position: 'fixed', top: 14, right: 14, zIndex: 200,
            width: 44, height: 44, borderRadius: 10,
            background: drawerOpen ? GAL.bg : OBS.surface,
            border: `1px solid ${drawerOpen ? GAL.borderMid : OBS.border}`,
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: '0 2px 16px rgba(0,0,0,0.45)',
          }}
        >
          {drawerOpen ? (
            /* X icon */
            <span style={{ fontSize: '1.1rem', lineHeight: 1, color: GAL.textMuted, fontFamily: 'var(--font-ui)' }}>✕</span>
          ) : (
            /* Hamburger lines */
            <>
              <span style={{ width: 20, height: 2, background: OBS.text, borderRadius: 1, display: 'block' }} />
              <span style={{ width: 20, height: 2, background: OBS.text, borderRadius: 1, display: 'block' }} />
              <span style={{ width: 14, height: 2, background: OBS.text, borderRadius: 1, display: 'block', alignSelf: 'flex-start', marginLeft: 12 }} />
            </>
          )}
        </button>
      )}

      {/* ── Backdrop overlay for drawer on mobile/tablet ──────────────────── */}
      {isTablet && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 149,
            background: 'rgba(6,5,4,0.55)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── STORY: provenance detail (warm gallery panel) ────────────────────── */}
      <div
        ref={panelRef}
        role={isTablet ? 'dialog' : 'complementary'}
        aria-modal={isTablet && drawerOpen ? true : undefined}
        aria-label="Provenance details"
        tabIndex={-1}
        style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        // Desktop: always-visible side panel. Tablet/mobile: slide-in drawer.
        width: isTablet ? 'min(400px, 92vw)' : 'min(460px, 100%)',
        background: GAL.bg,
        borderLeft: `1px solid ${GAL.borderMid}`,
        overflowY: 'auto',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
        zIndex: 150,
        // Slide transform: on tablet, translate off-screen when closed
        transform: isTablet && !drawerOpen ? 'translateX(100%)' : 'translateX(0)',
        transition: isTablet ? 'transform 300ms cubic-bezier(0.25,0.1,0,1)' : 'none',
      }}>
        <button onClick={onClose}
          style={{ position: 'sticky', top: 0, zIndex: 2, width: '100%', textAlign: 'left', background: GAL.bg, border: 'none', borderBottom: `1px solid ${GAL.border}`, padding: '14px 24px', color: GAL.textMuted, fontFamily: 'var(--font-ui)', fontSize: '0.8rem', cursor: 'pointer' }}>
          ← All journeys
        </button>

        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={selected.title} loading="eager" decoding="async" fetchPriority="high"
            onError={e => { e.currentTarget.style.display = 'none' }}
            // Reserve the band so the panel doesn't reflow when the image arrives.
            style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block', background: GAL.surface2 }} />
        )}

        <div style={{ padding: '22px 24px 8px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 400, color: GAL.text, lineHeight: 1.1, margin: 0 }}>{selected.title}</h2>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: GAL.textMuted, marginTop: 6 }}>
            {selected.artist}{selected.date ? ` · ${selected.date}` : ''}
          </div>
        </div>

        {loading && (
          <div style={{ padding: 24, color: GAL.textMuted, fontFamily: 'var(--font-ui)', fontSize: '0.85rem' }}>Tracing provenance…</div>
        )}

        {prov && !loading && (
          <>
            {/* Arc legend */}
            <div style={{ padding: '14px 24px 0', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: GAL.textMuted }}>
                <span style={{ display: 'inline-block', width: 22, height: 2, background: GAL.gold, borderRadius: 1 }} />
                Custody
              </span>
              {prov.exhibitions.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: GAL.textMuted }}>
                  <span style={{ display: 'inline-block', width: 22, height: 2, background: GAL.sage, borderRadius: 1 }} />
                  Loan
                </span>
              )}
              {prov.gettyRecords && prov.gettyRecords.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: GAL.textMuted }}>
                  <span style={{ display: 'inline-block', width: 22, height: 2, background: 'rgba(180,130,60,0.65)', borderRadius: 1 }} />
                  Dealer trail · GPI
                </span>
              )}
            </div>

            {/* ── Unified provenance timeline ── */}
            {(() => {
              const creationYear = (() => { const m = prov.artwork.date?.match(/\d{4}/); return m ? parseInt(m[0], 10) : null })()
              const timeline = buildUnifiedTimeline(
                prov.locations,
                prov.exhibitions,
                prov.gettyRecords ?? [],
                prov.artwork.artist,
                creationYear,
              )
              const extraExh = Math.max(0, prov.exhibitions.length - 4)
              const extraGPI = Math.max(0, (prov.gettyRecords?.length ?? 0) - 4)
              const hasAnyData = timeline.length > 0 || prov.hasGap
              // Show gap panel when custody chain is thin regardless of other data
              const thinCustody = prov.locations.length < 2 && !prov.hasGap

              return (
                <div style={{ padding: '18px 24px 0' }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GAL.textFaint, marginBottom: 16 }}>
                    Provenance story
                  </div>

                  {!hasAnyData ? (
                    /* ── Provenance gap panel: intentional, not broken ── */
                    <div style={{
                      border: `1px dashed ${GAL.borderMid}`,
                      borderRadius: 8,
                      padding: '18px 20px',
                      background: 'rgba(154,143,133,0.04)',
                      fontFamily: 'var(--font-ui)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <EventIcon type="gap" fontSize="1rem" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: EV_STYLES.gap.color }}>
                          Provenance gap
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: GAL.textMuted, lineHeight: 1.55, margin: '0 0 12px' }}>
                        Ownership records for this work are incomplete.
                      </p>
                      <a
                        href="/learn#provenance-gap"
                        style={{
                          fontSize: '0.75rem',
                          color: EV_STYLES.gap.color,
                          textDecoration: 'none',
                          borderBottom: `1px solid rgba(154,143,133,0.35)`,
                          paddingBottom: 1,
                        }}
                      >
                        Learn about provenance gaps →
                      </a>
                    </div>
                  ) : thinCustody ? (
                    /* ── Thin custody but partial data: show gap panel first ── */
                    <>
                      <div style={{
                        border: `1px dashed ${GAL.borderMid}`,
                        borderRadius: 8,
                        padding: '14px 16px',
                        background: 'rgba(154,143,133,0.04)',
                        fontFamily: 'var(--font-ui)',
                        marginBottom: 12,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <EventIcon type="gap" fontSize="1rem" />
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: EV_STYLES.gap.color }}>
                            Provenance gap
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: GAL.textMuted, lineHeight: 1.5, margin: '0 0 10px' }}>
                          Ownership records for this work are incomplete.
                        </p>
                        <a
                          href="/learn#provenance-gap"
                          style={{
                            fontSize: '0.72rem',
                            color: EV_STYLES.gap.color,
                            textDecoration: 'none',
                            borderBottom: `1px solid rgba(154,143,133,0.35)`,
                            paddingBottom: 1,
                          }}
                        >
                          Learn about provenance gaps →
                        </a>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {timeline.map((ev, i) => {
                          const st = EV_STYLES[ev.type]
                          const isExh = ev.type === 'exhibition'
                          return (
                            <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 12px', background: st.bg, borderRadius: 6, borderLeft: `3px solid ${st.border}`, opacity: isExh ? 0.82 : 1 }}>
                              <EventIcon type={ev.type} color={st.color} style={{ minWidth: 18 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 1 }}>
                                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: st.color, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                    {ev.type === 'gift' ? 'bequest' : ev.type === 'acquisition' ? 'museum acq.' : ev.type}
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: GAL.textFaint, flexShrink: 0 }}>{ev.year}</span>
                                </div>
                                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: GAL.text, fontWeight: 500, lineHeight: 1.3 }}>{ev.who}</div>
                                {ev.where && <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: GAL.textMuted, marginTop: 1 }}>{ev.where}</div>}
                                {ev.detail && !isExh && <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: GAL.textMuted, marginTop: 1, lineHeight: 1.4 }}>{ev.detail}</div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                                  <SourceCard source={ev.source} recordUrl={sourceRecordUrl(ev.sourceUrl, ev.source, selected)} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {timeline.map((ev, i) => {
                        const st = EV_STYLES[ev.type]
                        const isExh = ev.type === 'exhibition'
                        return (
                          <div key={i} style={{
                            display: 'flex', gap: 10, padding: '9px 12px',
                            background: st.bg, borderRadius: 6,
                            borderLeft: `3px solid ${st.border}`,
                            opacity: isExh ? 0.82 : 1,
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 18 }}>
                              <EventIcon type={ev.type} color={st.color} />
                              {i < timeline.length - 1 && (
                                <span style={{ width: 1, flex: 1, minHeight: 8, background: GAL.border, marginTop: 4 }} />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 1 }}>
                                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: st.color, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                  {ev.type === 'gift' ? 'bequest' : ev.type === 'acquisition' ? 'museum acq.' : ev.type}
                                </span>
                                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: GAL.textFaint, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{ev.year}</span>
                              </div>
                              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: ev.type === 'gap' ? GAL.textMuted : GAL.text, fontWeight: 500, lineHeight: 1.3 }}>{ev.who}</div>
                              {ev.where && <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: GAL.textMuted, marginTop: 1 }}>{ev.where}</div>}
                              {ev.detail && !isExh && <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: GAL.textMuted, marginTop: 1, lineHeight: 1.4 }}>{ev.detail}</div>}
                              {ev.price && <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: GAL.textFaint, marginTop: 2 }}>{ev.price}</div>}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                                <SourceCard source={ev.source} recordUrl={sourceRecordUrl(ev.sourceUrl, ev.source, selected)} />
                                <ConfidenceDot confidence={ev.confidence} />
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {prov.hasGap && (
                        <div style={{
                          marginTop: 8,
                          border: `1px dashed ${GAL.borderMid}`,
                          borderRadius: 8,
                          padding: '14px 16px',
                          background: 'rgba(154,143,133,0.04)',
                          fontFamily: 'var(--font-ui)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <EventIcon type="gap" fontSize="1rem" />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: EV_STYLES.gap.color }}>
                              Provenance gap
                            </span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: GAL.textMuted, lineHeight: 1.5, margin: '0 0 10px', fontStyle: 'italic' }}>
                            {prov.gaps[0]?.note ?? 'Ownership records for this work are incomplete.'}
                          </p>
                          <a
                            href="/learn#provenance-gap"
                            style={{
                              fontSize: '0.72rem',
                              color: EV_STYLES.gap.color,
                              textDecoration: 'none',
                              borderBottom: `1px solid rgba(154,143,133,0.35)`,
                              paddingBottom: 1,
                            }}
                          >
                            Learn about provenance gaps →
                          </a>
                        </div>
                      )}

                      {(extraExh > 0 || extraGPI > 0) && (
                        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: GAL.textFaint, padding: '6px 12px', lineHeight: 1.6 }}>
                          {extraExh > 0 && <div>+ {extraExh} more exhibition loan{extraExh !== 1 ? 's' : ''} not shown</div>}
                          {extraGPI > 0 && <div>+ {extraGPI} more dealer record{extraGPI !== 1 ? 's' : ''} in Getty GPI (artist-level)</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* RKD Netherlands Art Institute records */}
            {prov.rkdRecords && prov.rkdRecords.length > 0 && (
              <div style={{ padding: '18px 24px 0' }}>
                <details>
                  <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GAL.textFaint, userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.6rem' }}>▶</span>
                    RKD — Netherlands Art Institute ({prov.rkdRecords.length} record{prov.rkdRecords.length !== 1 ? 's' : ''})
                  </summary>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {prov.rkdRecords.map((r: RkdRecord) => (
                      <div key={r.priref} style={{ padding: '10px 12px', background: 'rgba(74,122,106,0.06)', border: '1px solid rgba(74,122,106,0.20)', borderRadius: 6, fontFamily: 'var(--font-ui)', fontSize: '0.76rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: r.provenance ? 6 : 0 }}>
                          <span style={{ color: GAL.text, fontWeight: 500 }}>{r.title ?? 'Untitled'}</span>
                          {r.dating && <span style={{ color: GAL.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{r.dating}</span>}
                        </div>
                        {r.currentLocation && (
                          <div style={{ color: GAL.textMuted, fontSize: '0.72rem', marginBottom: r.provenance ? 4 : 0 }}>
                            Current: {r.currentLocation}
                          </div>
                        )}
                        {r.provenance && (
                          <div style={{ color: GAL.textMuted, fontSize: '0.72rem', lineHeight: 1.5, borderTop: `1px solid rgba(74,122,106,0.15)`, marginTop: 6, paddingTop: 6 }}>
                            {r.provenance.slice(0, 200)}{r.provenance.length > 200 ? '…' : ''}
                          </div>
                        )}
                        <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: '0.65rem', color: GAL.sage, textDecoration: 'none' }}>
                          RKD #{r.priref} →
                        </a>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Raw provenance source text — collapsible */}
            {prov.provenanceText && (
              <div style={{ padding: '20px 24px 0' }}>
                <details style={{ fontFamily: 'var(--font-ui)' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GAL.textFaint, userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.6rem' }}>▶</span> Primary source text
                  </summary>
                  <div style={{ marginTop: 10, padding: '12px 14px', background: GAL.surface2, border: `1px solid ${GAL.border}`, borderRadius: 6, fontSize: '0.75rem', color: GAL.textMuted, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {prov.provenanceText}
                  </div>
                </details>
              </div>
            )}

            {/* Provenance Intelligence — deterministic insight card */}
            <div style={{ padding: '26px 24px 0' }}>
              {!showInsight ? (
                <button
                  onClick={() => setShowInsight(true)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(212,168,83,0.04)', border: `1px solid rgba(212,168,83,0.20)`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-ui)' }}>
                  <span style={{ fontSize: '0.9rem', color: GAL.gold }}>✦</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GAL.gold }}>Provenance Intelligence</div>
                    <div style={{ fontSize: '0.72rem', color: GAL.textMuted, marginTop: 2 }}>Generate a provenance summary for this work</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: GAL.textFaint }}>→</span>
                </button>
              ) : (() => {
                const wwiiGap = detectWWIIGap(prov.locations)
                const riskTier: 'FLAG' | 'REVIEW' | 'CLEAR' =
                  (wwiiGap || (prov.hasGap && prov.locations.length < 2)) ? 'FLAG'
                  : (prov.hasGap || prov.locations.length < 3) ? 'REVIEW'
                  : 'CLEAR'
                const RISK = {
                  FLAG:   { color: GAL.clay, bg: 'rgba(176,104,64,0.10)', border: 'rgba(176,104,64,0.28)', icon: '⚠', label: 'FLAG — Research required' },
                  REVIEW: { color: GAL.gold, bg: 'rgba(160,120,48,0.08)', border: 'rgba(160,120,48,0.24)', icon: '~', label: 'REVIEW recommended' },
                  CLEAR:  { color: GAL.sage, bg: 'rgba(74,122,106,0.08)', border: 'rgba(74,122,106,0.24)', icon: '✓', label: 'CLEAR — Chain appears clean' },
                }
                const rs = RISK[riskTier]
                return (
                  <div style={{ padding: '16px 18px', background: 'rgba(212,168,83,0.04)', border: `1px solid rgba(212,168,83,0.20)`, borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: '0.9rem', color: GAL.gold }}>✦</span>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GAL.gold }}>Provenance Intelligence</div>
                    </div>
                    {/* Risk tier pill — headline signal before detail */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: rs.bg, border: `1px solid ${rs.border}`, borderRadius: 5, padding: '4px 10px', marginBottom: 14 }}>
                      <span style={{ fontSize: '0.75rem', color: rs.color }}>{rs.icon}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: rs.color }}>{rs.label}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: GAL.text, lineHeight: 1.75 }}>
                      {prov.locations.length >= 2 ? (
                        <p style={{ marginBottom: 10 }}>
                          <strong>Custody chain:</strong> {prov.locations.length} documented location{prov.locations.length !== 1 ? 's' : ''} spanning
                          {prov.locations[0]?.startDate ? ` from ${prov.locations[0].startDate.slice(0,4)}` : ''}
                          {prov.locations[prov.locations.length-1]?.startDate ? ` to ${prov.locations[prov.locations.length-1].startDate!.slice(0,4)}` : ''}.
                          Chain of title {prov.hasGap ? 'has gaps — see below' : 'appears unbroken'}.
                        </p>
                      ) : (
                        <p style={{ marginBottom: 10, color: GAL.textMuted }}>
                          <strong>Custody chain:</strong> Thin institutional record — {prov.gaps[0]?.note ?? 'provenance gap noted'}.
                        </p>
                      )}
                      {prov.gettyRecords && prov.gettyRecords.length > 0 ? (
                        <>
                          <p style={{ marginBottom: 4 }}>
                            <strong>Market records:</strong> Getty Provenance Index confirms {prov.gettyRecords.length} dealer transaction{prov.gettyRecords.length !== 1 ? 's' : ''} for this artist in the Knoedler stock books.
                            {prov.gettyRecords[0]?.saleDate ? ` Earliest dated ${prov.gettyRecords[0].saleDate.slice(0,4)}.` : ''}
                            {' '}These pre-museum records document the commercial layer the museum archive typically omits.
                          </p>
                          <PriceSparkline records={prov.gettyRecords} />
                          {(() => {
                            const ledgerUrl = prov.gettyRecords.find(r => r.sourceUrl)?.sourceUrl
                            return ledgerUrl ? (
                              <a
                                href={ledgerUrl}
                                target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-block', marginTop: 2, marginBottom: 6, fontSize: '0.72rem', color: GAL.clay, textDecoration: 'none', borderBottom: `1px solid ${GAL.border}` }}
                              >
                                View the original dealer ledger entry (Getty archive) →
                              </a>
                            ) : null
                          })()}
                        </>
                      ) : (
                        <p style={{ marginBottom: 10, color: GAL.textMuted }}>
                          <strong>Market records:</strong> No Knoedler dealer transactions found for this artist. The work may have passed through non-Knoedler channels or predates their New York operation.
                        </p>
                      )}
                      {prov.exhibitions.length > 0 && (
                        <p style={{ marginBottom: 10 }}>
                          <strong>Exhibition record:</strong> {prov.exhibitions.length} documented loan{prov.exhibitions.length !== 1 ? 's' : ''}.
                          Active loan history suggests institutional confidence in the work&apos;s condition and title.
                        </p>
                      )}
                      {wwiiGap ? (
                        <div style={{ marginTop: 4, marginBottom: 4, padding: '8px 12px', background: 'rgba(200,120,85,0.08)', border: `1px solid rgba(200,120,85,0.28)`, borderRadius: 5 }}>
                          <p style={{ color: GAL.clay, fontWeight: 600, marginBottom: 4 }}>
                            ⚠ WWII-era gap detected ({wwiiGap.gapStart}–{wwiiGap.gapEnd})
                          </p>
                          <p style={{ color: GAL.textMuted, fontSize: '0.75rem', marginBottom: 0, lineHeight: 1.5 }}>
                            Ownership between {wwiiGap.gapStart} and {wwiiGap.gapEnd} is undocumented. This period overlaps 1933–1945. Washington Principles (1998) signatories are required to research and resolve such gaps.
                          </p>
                        </div>
                      ) : (
                        <p style={{ color: prov.hasGap ? GAL.clay : GAL.sage, marginBottom: 0, fontWeight: 500 }}>
                          {prov.hasGap
                            ? '⚠ Custody gap detected outside WWII era — flag for further research.'
                            : '✓ No 1933–1945 custody gap detected. Clean chain in available records.'}
                        </p>
                      )}
                    </div>
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid rgba(212,168,83,0.12)`, fontFamily: 'var(--font-ui)', fontSize: '0.62rem', color: GAL.textFaint }}>
                      Derived from institutional records only. Full AI analysis available with Claude API.
                      Not legal advice. Verify with primary sources before professional use.
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Sources + rights */}
            <div style={{ padding: '26px 24px 40px', marginTop: 8, borderTop: `1px solid ${GAL.border}`, fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: GAL.textFaint, lineHeight: 1.6 }}>
              <div>Sources: {sources.length ? sources.join(' · ') : 'Met · AIC · Rijksmuseum · Wikidata'}</div>
              {credit && <div style={{ marginTop: 4 }}>Image: {credit}</div>}
              <a href="/feedback" style={{ display: 'inline-block', marginTop: 10, color: GAL.clay, textDecoration: 'none', borderBottom: `1px solid ${GAL.border}` }}>
                Spot an error? Help correct the record →
              </a>
            </div>
          </>
        )}
      </div>
    </>
  )
}
