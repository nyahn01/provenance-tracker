'use client'

import { useEffect, useState, useCallback } from 'react'
import type { SearchResult, SearchByMode, ProvenanceResponse } from '@/lib/types'
import { FEATURED_WORKS, type FeaturedWork } from '@/lib/featured'
import { OBS } from '@/lib/design-tokens'
import { GlobeContainer } from './provenance/GlobeContainer'
import { ProvenanceDetail } from './provenance/ProvenanceDetail'
import { LandingEditorial } from './landing/LandingEditorial'

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

  const selectFeatured = useCallback((f: FeaturedWork) =>
    openWork({ id: `${f.source}-${f.id}`, source: f.source, title: f.title, artist: f.artist, date: f.year, thumbnail: null },
      f.localSrc, f.credit), [openWork])

  // Deep link from the static /work/[slug] pages: /?work=<slug> opens that
  // featured story on mount. window.location (not useSearchParams) so the
  // client home page needs no Suspense boundary.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('work')
    if (!slug) return
    const f = FEATURED_WORKS.find(w => w.slug === slug)
    if (f) selectFeatured(f)
  }, [selectFeatured])

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
      {/* Globe — the quiet landing backdrop (ADR 0004: no longer the hero). It
          glows undimmed at the top of the viewport and dissolves into the page
          ground via LandingEditorial's gradient — no scrim. Quieted with a CSS
          wrapper only; the locked GLOBE CONTRACT init inside GlobeContainer is
          never touched. When a work opens it unmounts, freeing the WebGL context
          for the "see this journey on a map" reveal (ProvenanceDetail, Stage 2b). */}
      {!inStory && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.65 }}>
          <GlobeContainer prov={prov} globeHeightPct={globeHeightPct} />
        </div>
      )}

      {/* ── LANDING: the editorial column (LandingEditorial owns the layout) ── */}
      {!inStory && (
        <LandingEditorial
          isTablet={isTablet}
          query={query}
          setQuery={setQuery}
          searchBy={searchBy}
          setSearchBy={setSearchBy}
          results={results}
          searching={searching}
          searched={searched}
          runSearch={runSearch}
          onSelectFeatured={selectFeatured}
          onSelectResult={selectResult}
        />
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
          isMobile={isMobile}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
        />
      )}
    </div>
  )
}
