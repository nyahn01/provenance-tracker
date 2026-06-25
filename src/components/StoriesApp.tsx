'use client'

import { useEffect, useState, useCallback } from 'react'
import type { SearchResult, ProvenanceResponse } from '@/lib/types'
import type { RkdRecord } from '@/lib/rkd'
import { FEATURED_WORKS, aicImage, type FeaturedWork } from '@/lib/featured'
import { OBS, GAL } from '@/lib/design-tokens'
import { GlobeContainer } from './provenance/GlobeContainer'
import { SourceBadge } from './provenance/SourceBadge'
import { ConfidenceDot } from './provenance/ConfidenceDot'
import { PriceSparkline } from './provenance/PriceSparkline'
import { buildUnifiedTimeline, detectWWIIGap, EV_STYLES } from './provenance/timeline'

// ─── Responsive breakpoints ───────────────────────────────────────────────────
const BP_TABLET = 1024  // px — sidebar collapses to drawer below this
const BP_MOBILE = 768   // px — globe height reduced below this

function useViewport() {
  // Start from the SSR default (1280) on both server and first client render so
  // markup matches during hydration, then snap to the real width after mount.
  // This avoids the height-prop hydration mismatch the globe container used to throw.
  const [width, setWidth] = useState<number>(1280)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    handler()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

export default function StoriesApp() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [hero, setHero] = useState<string | null>(null)
  const [credit, setCredit] = useState<string | null>(null)
  const [prov, setProv] = useState<ProvenanceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [showInsight, setShowInsight] = useState(false)

  // ── Mobile drawer state ───────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)
  const viewportWidth = useViewport()
  const isMobile = viewportWidth < BP_MOBILE
  const isTablet = viewportWidth < BP_TABLET

  const inStory = !!selected

  // ── Data actions ───────────────────────────────────────────────────────────
  const openWork = useCallback(async (r: SearchResult, heroUrl: string | null, creditLine: string | null) => {
    setSelected(r); setHero(heroUrl); setCredit(creditLine); setProv(null); setLoading(true); setShowInsight(false); setDrawerOpen(true)
    const rawId = r.id.includes('-') ? r.id.slice(r.id.indexOf('-') + 1) : r.id
    try {
      const res = await fetch(`/api/provenance?source=${r.source}&id=${rawId}`)
      if (!res.ok) throw new Error('fetch failed')
      setProv((await res.json()) as ProvenanceResponse)
    } catch {
      setProv({
        artwork: { id: r.id, source: r.source, title: r.title, artist: r.artist, date: r.date, thumbnail: null, geoLocation: null },
        locations: [], exhibitions: [],
        gaps: [{ from: null, to: null, note: 'No documented chain of custody found in our sources. Help complete the record.' }],
        hasGap: true,
      })
    } finally { setLoading(false) }
  }, [])

  const selectFeatured = (f: FeaturedWork) =>
    openWork({ id: `${f.source}-${f.id}`, source: f.source, title: f.title, artist: f.artist, date: f.year, thumbnail: null },
      aicImage(f.imageId, 843), f.credit)

  const selectResult = (r: SearchResult) => openWork(r, null, null)

  const close = () => { setSelected(null); setProv(null); setHero(null); setCredit(null); setDrawerOpen(false) }

  const runSearch = useCallback(async (q: string) => {
    const t = q.trim(); if (t.length < 2) return
    setSearching(true); setSearched(true); setResults([])
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(t)}`)
      const data = (await res.json()) as { results: SearchResult[] }
      setResults(data.results ?? [])
    } catch { setResults([]) } finally { setSearching(false) }
  }, [])

  const sources = prov ? [...new Set(prov.locations.map(l => l.source))] : []

  // ── Globe height: 50% on mobile, 75% on tablet, 100% on desktop ──────────
  const globeHeightPct = isMobile ? '50%' : isTablet ? '75%' : '100%'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: OBS.bg }}>
      {/* Globe — owns its own refs + the locked GLOBE CONTRACT init (see GlobeContainer) */}
      <GlobeContainer prov={prov} globeHeightPct={globeHeightPct} />

      {/* Overlay only covers the globe area */}
      {!inStory && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: globeHeightPct, background: 'rgba(10,9,8,0.72)' }} />
      )}

      {/* ── LANDING: curated gallery ─────────────────────────────────────────── */}
      {!inStory && (
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
          {/* On mobile/tablet: push content below the (shorter) globe with a spacer */}
          {isTablet && (
            <div style={{ height: globeHeightPct, pointerEvents: 'none' }} />
          )}
          <div style={{
            maxWidth: 1100,
            margin: '0 auto',
            // On desktop the globe is full-height behind content; on mobile/tablet content starts below globe
            padding: isTablet ? '28px 20px 80px' : '56px 28px 80px',
            // On mobile/tablet add a background so text is readable against content below globe
            background: isTablet ? OBS.bg : 'transparent',
          }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: OBS.clay, marginBottom: 14 }}>
              Provenance Tracker
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem,5vw,3.6rem)', fontWeight: 400, lineHeight: 1.05, color: OBS.text, letterSpacing: '-0.02em', margin: 0, maxWidth: 720 }}>
              The hidden journeys of masterpieces
            </h1>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: '1rem', color: OBS.textMuted, lineHeight: 1.6, marginTop: 18, maxWidth: 560 }}>
              A curated set of famous paintings, each with a documented, dated chain of
              custody — every fact sourced, every gap shown honestly.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginTop: 44 }}>
              {FEATURED_WORKS.map(f => (
                <button key={f.id} onClick={() => selectFeatured(f)}
                  style={{ textAlign: 'left', padding: 0, border: `1px solid ${OBS.border}`, borderRadius: 10, overflow: 'hidden', background: OBS.surface, cursor: 'pointer', transition: 'transform 250ms cubic-bezier(0.25,0.1,0,1), border-color 250ms' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = OBS.clay }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = OBS.border }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={aicImage(f.imageId, 600)} alt={f.title} loading="lazy"
                    style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block', background: OBS.globeLand }} />
                  <div style={{ padding: '14px 16px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: OBS.text, lineHeight: 1.15 }}>{f.title}</div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: OBS.textMuted, marginTop: 3 }}>{f.artist} · {f.year}</div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: OBS.textFaint, marginTop: 10, lineHeight: 1.45 }}>{f.hook}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 56, borderTop: `1px solid ${OBS.border}`, paddingTop: 28 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: OBS.textFaint, marginBottom: 12 }}>
                Explore beyond the collection
              </div>
              <div style={{ display: 'flex', gap: 8, maxWidth: 520, flexWrap: 'wrap' }}>
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch(query)}
                  placeholder="Search the Met · Art Institute · Rijksmuseum"
                  style={{ flex: 1, minWidth: 240, background: OBS.surface, border: `1px solid ${OBS.border}`, borderRadius: 8, padding: '10px 14px', color: OBS.text, fontFamily: 'var(--font-ui)', fontSize: '0.875rem', outline: 'none' }} />
                <button onClick={() => runSearch(query)}
                  style={{ background: OBS.clay, color: OBS.bg, border: 'none', borderRadius: 8, padding: '10px 18px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Search</button>
              </div>

              {searching && <div style={{ color: OBS.textMuted, fontFamily: 'var(--font-ui)', fontSize: '0.85rem', marginTop: 16 }}>Searching…</div>}
              {searched && !searching && results.length === 0 && (
                <div style={{ color: OBS.textMuted, fontFamily: 'var(--font-ui)', fontSize: '0.85rem', marginTop: 16, lineHeight: 1.5, maxWidth: 520 }}>
                  Nothing in our sources for &quot;{query}&quot;. This demo focuses on a curated set —
                  search covers works held by the Met, Art Institute, Rijksmuseum, and Europeana (requires API key).
                </div>
              )}
              {results.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 640 }}>
                  {results.map(r => (
                    <button key={r.id} onClick={() => selectResult(r)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textAlign: 'left', background: 'transparent', border: `1px solid ${OBS.border}`, borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: OBS.text }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,120,85,0.10)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem' }}>
                        {r.title} <span style={{ color: OBS.textMuted }}>· {r.artist}</span>
                      </span>
                      <SourceBadge source={r.source} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 64, borderTop: `1px solid ${OBS.border}`, paddingTop: 20, fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: OBS.textFaint, lineHeight: 1.6, maxWidth: 720 }}>
              <strong style={{ color: OBS.textMuted, fontWeight: 600 }}>Data &amp; rights.</strong> Provenance and exhibition facts come from
              the open APIs of the Metropolitan Museum of Art, the Art Institute of Chicago, the Rijksmuseum,
              Europeana, Wikidata, and the Getty Research Institute (Knoedler Stock Books, CC0 1.0).
              Images are shown only for public-domain works, credited to their institution. Gaps are shown, never invented.
              <div style={{ marginTop: 10, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <a href="/team" style={{ color: OBS.textMuted, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                  How this platform works →
                </a>
                <a href="/learn" style={{ color: OBS.textMuted, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                  Provenance glossary →
                </a>
                <a href="/pricing" style={{ color: OBS.textMuted, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                  Pricing →
                </a>
                <a href="https://buymeacoffee.com/nyahn" target="_blank" rel="noopener noreferrer" style={{ color: OBS.clay, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                  ☕ Buy me a coffee →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hamburger button — visible on mobile/tablet when story is open ──── */}
      {inStory && isTablet && (
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
      {inStory && isTablet && drawerOpen && (
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
      {inStory && (
        <div style={{
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
          <button onClick={close}
            style={{ position: 'sticky', top: 0, zIndex: 2, width: '100%', textAlign: 'left', background: GAL.bg, border: 'none', borderBottom: `1px solid ${GAL.border}`, padding: '14px 24px', color: GAL.textMuted, fontFamily: 'var(--font-ui)', fontSize: '0.8rem', cursor: 'pointer' }}>
            ← All journeys
          </button>

          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={selected!.title} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
          )}

          <div style={{ padding: '22px 24px 8px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 400, color: GAL.text, lineHeight: 1.1, margin: 0 }}>{selected!.title}</h2>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: GAL.textMuted, marginTop: 6 }}>
              {selected!.artist}{selected!.date ? ` · ${selected!.date}` : ''}
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
                const timeline = buildUnifiedTimeline(
                  prov.locations,
                  prov.exhibitions,
                  prov.gettyRecords ?? [],
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
                          <span style={{ fontSize: '1rem', color: EV_STYLES.gap.color, lineHeight: 1 }}>░</span>
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
                            <span style={{ fontSize: '1rem', color: EV_STYLES.gap.color, lineHeight: 1 }}>░</span>
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
                                <span style={{ fontSize: '0.75rem', color: st.color, lineHeight: 1, minWidth: 18 }}>{st.icon}</span>
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
                                    <SourceBadge source={ev.source} />
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
                                <span style={{ fontSize: '0.75rem', color: st.color, lineHeight: 1 }}>{st.icon}</span>
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
                                  <SourceBadge source={ev.source} />
                                  <ConfidenceDot confidence={ev.confidence} />
                                  {ev.sourceUrl && (
                                    <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer"
                                      style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6rem', color: 'rgba(124,92,191,0.55)', textDecoration: 'none' }}>
                                      Getty ↗
                                    </a>
                                  )}
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
                              <span style={{ fontSize: '1rem', color: EV_STYLES.gap.color, lineHeight: 1 }}>░</span>
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
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
