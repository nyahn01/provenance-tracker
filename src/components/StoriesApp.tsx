'use client'

import { useEffect, useState, useCallback } from 'react'
import type { SearchResult, SearchByMode, ProvenanceResponse } from '@/lib/types'
import { FEATURED_WORKS, type FeaturedWork } from '@/lib/featured'
import { OBS } from '@/lib/design-tokens'
import { GlobeContainer } from './provenance/GlobeContainer'
import { ProvenanceDetail } from './provenance/ProvenanceDetail'
import { LandingEditorial } from './landing/LandingEditorial'

// ─── Responsive breakpoints ───────────────────────────────────────────────────
// Sizing/proportions (globe height, hero, ProvenanceDetail padding) live as CSS
// custom properties (globals.css, media-query-driven — see the "Responsive
// tokens" block) so they're correct on the first painted frame, not just after
// this hook resolves post-hydration. BP_MOBILE is the one width-dependent value
// that's genuinely JS/behavioral state (the drawer's focus trap, modal role,
// slide transform), not just sizing — it has to stay here.
const BP_MOBILE = 768   // px — mobile drawer pattern below this

// The landing globe (below) is pure decoration — its wrapper div is
// aria-hidden, so screen-reader users get nothing from it either way, unlike
// the on-demand "see this journey on a map" reveal (ProvenanceDetail.tsx),
// which is a real feature a user explicitly asked for and must still mount
// under reduced motion (just without auto-rotate, which GlobeContainer
// already handles). Best-practice deferral therefore only applies here, to
// the passive landing mount: skip it entirely under prefers-reduced-motion
// (no WebGL/Three.js init, no GeoJSON fetch — not just a stopped animation),
// and for everyone else, defer the mount to an idle moment rather than
// contending with critical initial interactivity.
function useShowLandingGlobe() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // `typeof`, not a truthiness check: the DOM lib types requestIdleCallback as
    // always present, so `if (window.requestIdleCallback)` is flagged as dead
    // code — but Safari genuinely doesn't implement it at runtime, so the guard
    // has to stay. The static type is simply more optimistic than reality here.
    const hasIdle = typeof window.requestIdleCallback === 'function'
    const id = hasIdle
      ? window.requestIdleCallback(() => setShow(true))
      : window.setTimeout(() => setShow(true), 200)
    return () => {
      if (hasIdle) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [])
  return show
}

function useViewport() {
  // Start from the SSR default (1280) on both server and first client render so
  // markup matches during hydration, then snap to the real width after mount.
  // This avoids a hydration mismatch on `width` itself. It no longer causes a
  // visible layout jump the way it used to: the values that render on the very
  // first frame (globe height, hero sizing, ProvenanceDetail's non-mobile
  // padding/image/title) are CSS custom properties resolved by the browser at
  // paint time, not JS computed from this state. Only `isMobile`'s drawer
  // behavior (focus trap, modal role, slide transform — ProvenanceDetail only
  // ever mounts after a user interaction, well after this resolves) still
  // depends on the real value from this hook.
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
  const showLandingGlobe = useShowLandingGlobe()

  const inStory = !!selected

  // SiteNav (root layout, outside this component's tree) reads this custom
  // property to decide whether to show itself on `/` — see SiteNav.tsx for why
  // a CSS var instead of context/router state. Desktop/tablet only: the mobile
  // drawer stays the existing narrow, hamburger-driven experience unchanged.
  useEffect(() => {
    document.documentElement.style.setProperty('--site-nav-display', inStory && !isMobile ? 'flex' : 'none')
  }, [inStory, isMobile])

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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: OBS.bg }}>
      {/* Globe — the quiet landing backdrop (ADR 0004: no longer the hero). It
          glows undimmed at the top of the viewport and dissolves into the page
          ground via LandingEditorial's gradient — no scrim. Quieted with a CSS
          wrapper only; the locked GLOBE CONTRACT init inside GlobeContainer is
          never touched. When a work opens it unmounts, freeing the WebGL context
          for the "see this journey on a map" reveal (ProvenanceDetail, Stage 2b).
          Mount itself is deferred (useShowLandingGlobe above) — skipped entirely
          under reduced motion (this backdrop is aria-hidden either way, so screen
          readers lose nothing), deferred to an idle moment for everyone else. */}
      {!inStory && showLandingGlobe && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.65 }}>
          <GlobeContainer prov={prov} globeHeightPct="var(--pt-globe-h)" />
        </div>
      )}

      {/* ── LANDING: the editorial column (LandingEditorial owns the layout) ── */}
      {!inStory && (
        <LandingEditorial
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
