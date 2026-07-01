'use client'

/**
 * ProvenanceDetail — the open-work view shown when a work is selected.
 *
 * Desktop/tablet (`!isMobile`): a full-width host (spec `docs/design/timeline-hero-spec.md`
 * §4.1/§5) — the artwork is the object-hero above a centered ~1100px column, and the
 * ChainOfCustodyTimeline gets the room to render its horizontal hero layout instead of
 * being squeezed into a drawer. Always visible (non-modal) while a work is open; no
 * hamburger/backdrop — the panel IS the view.
 *
 * Mobile (`isMobile`): unchanged narrow slide-in drawer (hamburger + backdrop) so the
 * ChainOfCustodyTimeline keeps its vertical mobile fallback (spec §4.1 mobile).
 *
 * StoriesApp owns all state; this component receives it via props.
 */
import { useRef, type Dispatch, type SetStateAction } from 'react'
import type { SearchResult, ProvenanceResponse } from '@/lib/types'
import type { RkdRecord } from '@/lib/rkd'
import { OBS, GAL } from '@/lib/design-tokens'
import { PriceSparkline } from './PriceSparkline'
import { useFocusTrap } from './useFocusTrap'
import { detectWWIIGap } from './timeline'
import { ChainOfCustodyTimeline } from './ChainOfCustodyTimeline'

interface ProvenanceDetailProps {
  selected: SearchResult
  hero: string | null
  credit: string | null
  prov: ProvenanceResponse | null
  loading: boolean
  showInsight: boolean
  setShowInsight: Dispatch<SetStateAction<boolean>>
  onClose: () => void
  isMobile: boolean
  drawerOpen: boolean
  setDrawerOpen: Dispatch<SetStateAction<boolean>>
}

export function ProvenanceDetail({
  selected, hero, credit, prov, loading, showInsight, setShowInsight,
  onClose, isMobile, drawerOpen, setDrawerOpen,
}: ProvenanceDetailProps) {
  const sources = prov ? [...new Set(prov.locations.map(l => l.source))] : []

  // On mobile the panel is a modal slide-in drawer — trap focus inside it while
  // open and close on Escape. On desktop/tablet it is an always-visible
  // full-width host (non-modal), so the trap stays inactive.
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, isMobile && drawerOpen, () => setDrawerOpen(false))

  return (
    <>
      {/* ── Hamburger button — visible on mobile when story is open ──────────── */}
      {isMobile && (
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

      {/* ── Backdrop overlay for drawer on mobile ─────────────────────────── */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 149,
            background: 'rgba(6,5,4,0.55)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── STORY: provenance detail — full-width host (desktop/tablet) or
          mobile slide-in drawer ──────────────────────────────────────────── */}
      <div
        ref={panelRef}
        role={isMobile ? 'dialog' : 'complementary'}
        aria-modal={isMobile && drawerOpen ? true : undefined}
        aria-label="Provenance details"
        tabIndex={-1}
        style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        // Desktop/tablet: always-visible full-width host. Mobile: slide-in drawer.
        left: isMobile ? undefined : 0,
        width: isMobile ? 'min(400px, 92vw)' : '100%',
        background: GAL.bg,
        borderLeft: isMobile ? `1px solid ${GAL.borderMid}` : 'none',
        overflowY: 'auto',
        boxShadow: isMobile ? '-20px 0 60px rgba(0,0,0,0.4)' : 'none',
        zIndex: 150,
        // Slide transform: on mobile, translate off-screen when closed
        transform: isMobile && !drawerOpen ? 'translateX(100%)' : 'translateX(0)',
        transition: isMobile ? 'transform 300ms cubic-bezier(0.25,0.1,0,1)' : 'none',
      }}>
        <button onClick={onClose}
          style={{ position: 'sticky', top: 0, zIndex: 2, width: '100%', textAlign: 'left', background: GAL.bg, border: 'none', borderBottom: `1px solid ${GAL.border}`, padding: '14px 24px', color: GAL.textMuted, fontFamily: 'var(--font-ui)', fontSize: '0.8rem', cursor: 'pointer' }}>
          ← All journeys
        </button>

        {/* Content column — capped width + centered on the full-width host
            (spec §5: "a real content column, ~max-width 1100"); unconstrained
            on the mobile drawer, which keeps its existing narrow layout. */}
        <div style={{ maxWidth: isMobile ? undefined : 1100, margin: isMobile ? undefined : '0 auto' }}>

        {hero && (
          // The object is the hero: presented large and uncropped, centered with room
          // to breathe and a soft shadow to lift it like a framed work (spec §5).
          <div style={{
            padding: isMobile ? 0 : '32px 24px 8px',
            display: 'flex', justifyContent: 'center', background: GAL.bg,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero} alt={selected.title} loading="eager" decoding="async" fetchPriority="high"
              onError={e => { e.currentTarget.style.display = 'none' }}
              style={{
                width: isMobile ? '100%' : 'auto', maxWidth: '100%',
                height: isMobile ? 280 : 'min(56vh, 560px)',
                objectFit: isMobile ? 'cover' : 'contain', display: 'block',
                background: isMobile ? GAL.surface2 : 'transparent',
                boxShadow: isMobile ? 'none' : '0 16px 44px rgba(26,23,20,0.22)',
              }} />
          </div>
        )}

        <div style={{ padding: '22px 24px 8px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.7rem' : 'clamp(2.2rem, 4vw, 3.4rem)', fontWeight: 400, color: GAL.text, lineHeight: 1.1, margin: 0 }}>{selected.title}</h2>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: GAL.textMuted, marginTop: 6 }}>
            {selected.artist}{selected.date ? ` · ${selected.date}` : ''}
          </div>
        </div>

        {loading && (
          <div style={{ padding: 24, color: GAL.textMuted, fontFamily: 'var(--font-ui)', fontSize: '0.85rem' }}>Tracing provenance…</div>
        )}

        {prov && !loading && (
          <>
            {/* ── Chain-of-custody timeline (docs/design/timeline-hero-spec.md §4.1) ── */}
            <div style={{ padding: '18px 24px 0' }}>
              <ChainOfCustodyTimeline
                locations={prov.locations}
                exhibitions={prov.exhibitions}
                gettyRecords={prov.gettyRecords ?? []}
                gaps={prov.gaps}
                artist={prov.artwork.artist}
                creationYear={(() => { const m = prov.artwork.date?.match(/\d{4}/); return m ? parseInt(m[0], 10) : null })()}
                artwork={prov.artwork}
              />
            </div>

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
      </div>
    </>
  )
}
