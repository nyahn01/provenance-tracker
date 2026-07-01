'use client'

import { useEffect, useState, useCallback } from 'react'
import type { SearchResult, SearchByMode, ProvenanceResponse } from '@/lib/types'
import { FEATURED_WORKS, type FeaturedWork } from '@/lib/featured'
import { OBS } from '@/lib/design-tokens'
import { GlobeContainer } from './provenance/GlobeContainer'
import { GlobeGapBadge } from './provenance/GlobeGapBadge'
import { countUnresolvedGaps } from './provenance/globe-data'
import { SourceBadge } from './provenance/SourceBadge'
import { ProvenanceDetail } from './provenance/ProvenanceDetail'

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
  const [searchBy, setSearchBy] = useState<SearchByMode>('all')
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
      f.localSrc, f.credit)

  const selectResult = (r: SearchResult) => openWork(r, r.thumbnail, null)

  const close = () => { setSelected(null); setProv(null); setHero(null); setCredit(null); setDrawerOpen(false) }

  const runSearch = useCallback(async (q: string, by: SearchByMode = 'all') => {
    const t = q.trim(); if (t.length < 2) return
    setSearching(true); setSearched(true); setResults([])
    try {
      const url = `/api/search?q=${encodeURIComponent(t)}&searchBy=${by}`
      const res = await fetch(url)
      const data = (await res.json()) as { results: SearchResult[] }
      setResults(data.results ?? [])
    } catch { setResults([]) } finally { setSearching(false) }
  }, [])

  // ── Globe height: 50% on mobile, 75% on tablet, 100% on desktop ──────────
  const globeHeightPct = isMobile ? '50%' : isTablet ? '75%' : '100%'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: OBS.bg }}>
      {/* Globe — owns its own refs + the locked GLOBE CONTRACT init (see GlobeContainer) */}
      <GlobeContainer prov={prov} globeHeightPct={globeHeightPct} />

      {/* No arc-tier legend on the idle hero: with no work selected the globe shows no
          arcs, so the legend explained nothing and read as persistent chrome. Once a story
          opens, ProvenanceDetail carries its own contextual arc legend. (Removed per the
          timeline-led redesign — the globe is being demoted from the hero; ADR 0004.) */}

      {/* Undocumented-gap badge — sibling to GlobeContainer, story view only
          (gaps are per-work). Never drawn as an arc; see GlobeGapBadge. */}
      {inStory && prov && <GlobeGapBadge count={countUnresolvedGaps(prov.gaps)} />}

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

            {/* How it works — three beats so the goal lands at a glance */}
            <div style={{ display: 'flex', gap: 'clamp(18px, 3vw, 36px)', marginTop: 28, flexWrap: 'wrap' }}>
              {[
                { n: '1', t: 'Pick a masterpiece', d: 'From the curated set, or search the world’s museums' },
                { n: '2', t: 'Trace its journey', d: 'Owner to owner, dealer to dealer, across the globe' },
                { n: '3', t: 'See the honest gaps', d: 'Undocumented years are flagged — never invented' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: 210 }}>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                    border: `1px solid rgba(200,120,85,0.30)`,
                    background: 'rgba(200,120,85,0.10)', color: OBS.clay,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-ui)', fontSize: '0.72rem', fontWeight: 600,
                  }}>{s.n}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.84rem', fontWeight: 600, color: OBS.text }}>{s.t}</div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.76rem', color: OBS.textFaint, lineHeight: 1.45, marginTop: 2 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginTop: 44 }}>
              {FEATURED_WORKS.map(f => (
                <button key={f.id} onClick={() => selectFeatured(f)}
                  style={{ textAlign: 'left', padding: 0, border: `1px solid ${OBS.border}`, borderRadius: 10, overflow: 'hidden', background: OBS.surface, cursor: 'pointer', transition: 'transform 250ms cubic-bezier(0.25,0.1,0,1), border-color 250ms' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = OBS.clay }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = OBS.border }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.localSrc} alt={f.title} loading="lazy" decoding="async" width={260} height={200}
                    onError={e => { e.currentTarget.style.visibility = 'hidden' }}
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

              {/* Search-by mode toggle */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {([
                  { mode: 'all'    as SearchByMode, label: 'All'    },
                  { mode: 'artist' as SearchByMode, label: 'Artist' },
                  { mode: 'title'  as SearchByMode, label: 'Title'  },
                ] as { mode: SearchByMode; label: string }[]).map(({ mode, label }) => {
                  const active = searchBy === mode
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        setSearchBy(mode)
                        if (query.trim().length >= 2) runSearch(query, mode)
                      }}
                      aria-pressed={active}
                      style={{
                        background: active ? OBS.clay : OBS.surface,
                        color: active ? OBS.bg : OBS.textMuted,
                        border: `1px solid ${active ? OBS.clay : OBS.border}`,
                        borderRadius: 6,
                        padding: '4px 12px',
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        transition: 'background 150ms, color 150ms, border-color 150ms',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: OBS.textFaint, alignSelf: 'center', marginLeft: 4 }}>
                  {searchBy === 'artist' ? 'Searching by artist name' : searchBy === 'title' ? 'Searching by painting title' : 'Searching all fields'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, maxWidth: 520, flexWrap: 'wrap' }}>
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch(query, searchBy)}
                  placeholder={
                    searchBy === 'artist' ? 'Artist surname — Monet, Klimt, Vermeer…' :
                    searchBy === 'title'  ? 'Painting title — Water Lilies, The Kiss…' :
                                           'Search any artist or work — Klimt, Vermeer, Water Lilies…'
                  }
                  style={{ flex: 1, minWidth: 240, background: OBS.surface, border: `1px solid ${OBS.border}`, borderRadius: 8, padding: '10px 14px', color: OBS.text, fontFamily: 'var(--font-ui)', fontSize: '0.875rem', outline: 'none' }} />
                <button onClick={() => runSearch(query, searchBy)}
                  style={{ background: OBS.clay, color: OBS.bg, border: 'none', borderRadius: 8, padding: '10px 18px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Search</button>
              </div>

              {searching && <div style={{ color: OBS.textMuted, fontFamily: 'var(--font-ui)', fontSize: '0.85rem', marginTop: 16 }}>Searching…</div>}
              {searched && !searching && results.length === 0 && (
                <div style={{ color: OBS.textMuted, fontFamily: 'var(--font-ui)', fontSize: '0.85rem', marginTop: 16, lineHeight: 1.5, maxWidth: 520 }}>
                  Nothing found for &quot;{query}&quot;
                  {searchBy !== 'all' && <> ({searchBy === 'artist' ? 'artist' : 'title'} search)</>}.{' '}
                  Search spans the Met, Art Institute of Chicago, Rijksmuseum, Europeana, and Wikidata
                  {searchBy !== 'all' && <> — try switching to <strong>All</strong> or check spelling</>}.
                </div>
              )}
              {results.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 640 }}>
                  {results.map(r => (
                    <button key={r.id} onClick={() => selectResult(r)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textAlign: 'left', background: 'transparent', border: `1px solid ${OBS.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: OBS.text }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,120,85,0.10)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        {r.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.thumbnail} alt="" loading="lazy"
                            onError={e => { e.currentTarget.style.visibility = 'hidden' }}
                            style={{ width: 44, height: 44, flexShrink: 0, objectFit: 'cover', borderRadius: 5, background: OBS.globeLand, display: 'block' }} />
                        ) : (
                          <span
                            title={r.source === 'aic' ? 'Image unavailable — AIC IIIF restriction' : undefined}
                            aria-label={r.source === 'aic' ? 'Image unavailable' : 'No image'}
                            style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 5, background: OBS.surface, border: `1px solid ${OBS.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: OBS.textFaint, fontSize: r.source === 'aic' ? '0.55rem' : '1rem', gap: 1, letterSpacing: '0.03em' }}>
                            {r.source === 'aic' ? <><span style={{ fontSize: '0.7rem' }}>◇</span><span>AIC</span></> : '◇'}
                          </span>
                        )}
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.title} <span style={{ color: OBS.textMuted }}>· {r.artist}</span>
                        </span>
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
              Europeana, Wikidata, the Cleveland Museum of Art, and the Getty Research Institute
              (Knoedler &amp; Goupil dealer records, CC0 1.0).
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
                <a href="/feedback" style={{ color: OBS.clay, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                  Feedback →
                </a>
                <a href="https://buymeacoffee.com/nyahn" target="_blank" rel="noopener noreferrer" style={{ color: OBS.clay, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                  ☕ Buy me a coffee →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {inStory && selected && (
        <ProvenanceDetail
          selected={selected}
          hero={hero}
          credit={credit}
          prov={prov}
          loading={loading}
          showInsight={showInsight}
          setShowInsight={setShowInsight}
          onClose={close}
          isTablet={isTablet}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
        />
      )}
    </div>
  )
}
