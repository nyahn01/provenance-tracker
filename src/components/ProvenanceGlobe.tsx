'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SearchResult, ProvenanceResponse, LocationEntry } from '@/lib/types'
import { FEATURED_WORKS } from '@/lib/featured'

// ─── Design tokens (mirror CSS variables for inline styles) ──────────────────
const OBS = {
  bg:          '#0a0908',
  surface:     '#131110',
  surface2:    '#1c1a17',
  border:      '#2a2218',
  borderMid:   '#3d3228',
  text:        '#f6f1e8',
  textMuted:   '#9a8f85',
  textFaint:   '#5c5449',
  clay:        '#c87855',
  clayDim:     'rgba(200,120,85,0.15)',
  clayBorder:  'rgba(200,120,85,0.30)',
  gold:        '#d4a853',
  sage:        '#6f8d7d',
  panel:       'rgba(10,9,8,0.88)',
  dropdown:    'rgba(13,12,11,0.97)',
  globeOcean:  '#111010',
  globeLand:   '#1c1612',
  globeBorder: '#2a2218',
} as const

const GAL = {
  bg:          '#f7f4ee',
  surface:     '#ffffff',
  surface2:    '#ede9e2',
  border:      '#d8d2c8',
  borderMid:   '#b8afa3',
  text:        '#1a1714',
  textMuted:   '#6b6460',
  textFaint:   '#9e9790',
  clay:        '#b06840',
  clayDim:     'rgba(176,104,64,0.08)',
  sage:        '#4a6b5e',
  gold:        '#a07830',
} as const

// ─── Museum data ─────────────────────────────────────────────────────────────
const TOP_MUSEUMS = [
  { id: 'louvre',           name: 'Louvre',           city: 'Paris',         country: 'France',      lat: 48.8606, lng:   2.3376,  focus: 'Ancient & Renaissance' },
  { id: 'met',              name: 'The Met',           city: 'New York',      country: 'USA',         lat: 40.7794, lng: -73.9632,  focus: 'Global / All Eras'     },
  { id: 'national-gallery', name: 'National Gallery',  city: 'London',        country: 'UK',          lat: 51.5089, lng:  -0.1283,  focus: 'Western European'      },
  { id: 'uffizi',           name: 'Uffizi',            city: 'Florence',      country: 'Italy',       lat: 43.7678, lng:  11.2553,  focus: 'Italian Renaissance'   },
  { id: 'rijksmuseum',      name: 'Rijksmuseum',       city: 'Amsterdam',     country: 'Netherlands', lat: 52.3600, lng:   4.8852,  focus: 'Dutch Golden Age'      },
  { id: 'prado',            name: 'Prado',             city: 'Madrid',        country: 'Spain',       lat: 40.4138, lng:  -3.6922,  focus: 'Spanish & Flemish'     },
  { id: 'hermitage',        name: 'Hermitage',         city: 'St Petersburg', country: 'Russia',      lat: 59.9398, lng:  30.3146,  focus: 'Imperial European'     },
  { id: 'smithsonian',      name: 'Smithsonian',       city: 'Washington DC', country: 'USA',         lat: 38.8913, lng: -77.0261,  focus: 'American & Global'     },
  { id: 'aic',              name: 'Art Institute',     city: 'Chicago',       country: 'USA',         lat: 41.8796, lng: -87.6237,  focus: 'Impressionism'         },
  { id: 'taipei',           name: 'National Palace',   city: 'Taipei',        country: 'Taiwan',      lat: 25.1024, lng: 121.5489,  focus: 'Chinese Imperial'      },
] as const

// Default arc shown before any search (historical — clearly labeled)
const DEFAULT_ARC = [{
  startLat: 40.7614, startLng: -73.9776,
  endLat:   40.4138, endLng:   -3.6922,
  color: OBS.clay,
  label: 'Guernica: MoMA 1939 → Prado 1981',
}]

// ─── Types ────────────────────────────────────────────────────────────────────
interface GlobeArc {
  startLat: number; startLng: number
  endLat:   number; endLng:   number
  color:    string; label:    string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildArcs(locations: LocationEntry[]): GlobeArc[] {
  const arcs: GlobeArc[] = []
  for (let i = 0; i < locations.length - 1; i++) {
    const a = locations[i], b = locations[i + 1]
    if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) continue
    arcs.push({
      startLat: a.lat, startLng: a.lng,
      endLat:   b.lat, endLng:   b.lng,
      color: OBS.clay,
      label: `${a.name} → ${b.name}`,
    })
  }
  return arcs
}

function tierLabel(source: string): string {
  const s = source.toLowerCase()
  if (s === 'met' || s.includes('metropolitan')) return 'MET'
  if (s === 'aic' || s.includes('art institute'))  return 'AIC'
  if (s === 'rijks' || s.includes('rijksmuseum'))  return 'RIJKS'
  if (s.includes('wikidata'))  return 'Wikidata'
  return source.toUpperCase().slice(0, 12)
}

type TierStyle = { bg: string; color: string; border: string }

function badgeStyle(source: string, gallery = false): TierStyle {
  const s = source.toLowerCase()
  if (s === 'met' || s === 'aic' || s === 'rijks' || s.includes('metropolitan') || s.includes('art institute') || s.includes('rijksmuseum')) {
    return gallery
      ? { bg: `rgba(160,120,48,0.10)`, color: GAL.gold,  border: `rgba(160,120,48,0.25)` }
      : { bg: `rgba(212,168,83,0.10)`, color: OBS.gold,  border: `rgba(212,168,83,0.25)` }
  }
  if (s.includes('wikidata')) {
    return gallery
      ? { bg: `rgba(74,107,94,0.10)`, color: GAL.sage,   border: `rgba(74,107,94,0.25)` }
      : { bg: `rgba(111,141,125,0.12)`, color: OBS.sage, border: `rgba(111,141,125,0.25)` }
  }
  return gallery
    ? { bg: GAL.clayDim,  color: GAL.clay,  border: `rgba(176,104,64,0.30)` }
    : { bg: OBS.clayDim,  color: OBS.clay,  border: OBS.clayBorder }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SourceBadgeProps {
  source: string
  gallery?: boolean
}

function SourceBadge({ source, gallery = false }: SourceBadgeProps) {
  const s = badgeStyle(source, gallery)
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 'var(--radius-sm)',
        padding: '2px 6px',
        fontSize: '0.625rem',
        fontFamily: 'var(--font-ui)',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        whiteSpace: 'nowrap' as const,
        flexShrink: 0,
      }}
    >
      {tierLabel(source)}
    </span>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function GalleryShimmer() {
  return (
    <div style={{ padding: 24 }}>
      <div className="shimmer-light" style={{ height: 200, borderRadius: 'var(--radius-md)', marginBottom: 20 }} />
      <div className="shimmer-light" style={{ height: 28, width: '80%', borderRadius: 4, marginBottom: 10 }} />
      <div className="shimmer-light" style={{ height: 18, width: '60%', borderRadius: 4, marginBottom: 24 }} />
      <div className="shimmer-light" style={{ height: 14, width: '40%', borderRadius: 4, marginBottom: 20 }} />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div className="shimmer-light" style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div className="shimmer-light" style={{ height: 12, width: '50%', borderRadius: 4, marginBottom: 6 }} />
            <div className="shimmer-light" style={{ height: 16, width: '85%', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Gap state (beautiful empty) ─────────────────────────────────────────────
interface GapDisplayProps {
  note: string
  gallery?: boolean
}

function GapDisplay({ note, gallery = false }: GapDisplayProps) {
  const bg     = gallery ? GAL.bg     : OBS.bg
  const border = gallery ? GAL.borderMid : OBS.textMuted
  const text   = gallery ? GAL.text   : OBS.text
  const muted  = gallery ? GAL.textMuted : OBS.textMuted
  const faint  = gallery ? GAL.textFaint : OBS.textFaint
  void faint

  return (
    <div
      style={{
        margin: '8px 0',
        padding: '20px 20px',
        background: bg,
        border: `1px dashed ${border}`,
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Dashed rule as icon — calm, not alarming */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[0,1,2,3,4].map(i => (
          <div
            key={i}
            style={{
              height: 1.5,
              flex: 1,
              background: border,
              borderRadius: 1,
              opacity: 0.5 + i * 0.1,
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 500,
          color: text,
          marginBottom: 8,
          lineHeight: 1.2,
        }}
      >
        Provenance gap
      </div>
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          color: muted,
          lineHeight: 1.5,
          maxWidth: '42ch',
        }}
      >
        {note}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProvenanceGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef     = useRef<any>(null)

  const [selectedMuseum,  setSelectedMuseum]  = useState<string | null>(null)
  const [query,           setQuery]           = useState('')
  const [results,         setResults]         = useState<SearchResult[]>([])
  const [showDropdown,    setShowDropdown]    = useState(false)
  const [isSearching,     setIsSearching]     = useState(false)
  const [selectedResult,  setSelectedResult]  = useState<SearchResult | null>(null)
  const [provenance,      setProvenance]      = useState<ProvenanceResponse | null>(null)
  const [isLoadingProv,   setIsLoadingProv]   = useState(false)

  // ── Viewport width tracking for responsive layout ────────────────────────
  // Start with desktop default (1200) — useEffect corrects it on first mount.
  // This avoids a server/client mismatch since 'use client' still SSRs the shell.
  const [viewportWidth, setViewportWidth] = useState<number>(1200)
  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const isDesktop = viewportWidth >= 1024
  const isMobile  = viewportWidth < 768

  // ── Globe init ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    let mounted = true
    let onResize: (() => void) | null = null

    ;(async () => {
      const GlobeGL = (await import('globe.gl')).default
      if (!mounted || !containerRef.current) return

      // Fetch country outlines (vendored in /public)
      let geoData: { features: unknown[] } = { features: [] }
      try {
        const r = await fetch('/geo/countries-simple.json')
        if (r.ok) geoData = await r.json()
      } catch {
        // Graceful degradation — globe still renders without land outlines
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globe = (GlobeGL as any)()(containerRef.current) as any
      globe
        .globeImageUrl(null)
        .backgroundColor(OBS.globeOcean)
        .showAtmosphere(true)
        .atmosphereColor(OBS.clay)
        .atmosphereAltitude(0.16)

      // ── Land mass polygons ──────────────────────────────────────────────
      if (geoData.features.length > 0) {
        globe
          .polygonsData(geoData.features)
          .polygonCapColor(() => OBS.globeLand)
          .polygonSideColor(() => 'rgba(0,0,0,0)')
          .polygonStrokeColor(() => OBS.globeBorder)
          .polygonAltitude(0.005)
      }

      // ── Auto-rotation ───────────────────────────────────────────────────
      // globe.gl exposes controls() after first render tick
      setTimeout(() => {
        const controls = globe.controls?.()
        if (controls) {
          controls.autoRotate = true
          controls.autoRotateSpeed = 0.3
          controls.enableZoom = false
        }
      }, 100)

      // Museum HTML pins
      const pins = TOP_MUSEUMS.map(m => {
        const el = document.createElement('div')
        el.innerHTML = `
          <div style="position:relative;width:18px;height:18px;cursor:pointer;" title="${m.name}, ${m.city}">
            <div style="position:absolute;inset:0;background:${OBS.gold};border-radius:50%;box-shadow:0 0 6px ${OBS.gold}88;"></div>
            <div class="pulse-ring" style="position:absolute;inset:0;background:${OBS.gold};border-radius:50%;"></div>
          </div>`
        el.onclick = () => setSelectedMuseum(m.id)
        return { ...m, el }
      })
      globe.htmlElementsData(pins).htmlElement((d: { el: HTMLElement }) => d.el)

      // Default arc
      globe
        .arcsData(DEFAULT_ARC)
        .arcColor((d: { color?: string }) => d.color ?? OBS.clay)
        .arcAltitude(0.3)
        .arcDashLength(0.4)
        .arcDashGap(0.4)
        .arcDashAnimateTime(4000)
        .arcStroke(1.2)

      // ── Keep the globe filling its container on viewport/orientation change ──
      // globe.gl sizes to the container at mount and does not reliably re-fit on
      // resize — without this the canvas stays at its mount-size (undersized).
      const fit = () => {
        const el = containerRef.current
        if (!el) return
        globe.width(el.clientWidth).height(el.clientHeight)
      }
      fit()
      onResize = fit
      window.addEventListener('resize', fit)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(globeRef as any).current = globe
    })()

    return () => {
      mounted = false
      if (onResize) window.removeEventListener('resize', onResize)
    }
  }, [])

  // ── Pause / resume auto-rotation when artwork selected ──────────────────
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (globeRef as any).current
    if (!g) return
    const controls = g.controls?.()
    if (!controls) return
    controls.autoRotate = !selectedResult
  }, [selectedResult])

  // ── Update arcs on provenance change + fly to the actual journey ─────────
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (globeRef as any).current
    if (!g) return
    if (!provenance) { g.arcsData(DEFAULT_ARC); return }
    const arcs = buildArcs(provenance.locations)
    g.arcsData(arcs.length ? arcs : [])

    // Auto-frame: center on the mapped locations and zoom to fit their spread, so
    // the real destinations (and which continents) are always legible. A globe with
    // arcs you can't place geographically is decoration, not information.
    const pts = provenance.locations.filter(l => l.lat != null && l.lng != null)
    if (pts.length > 0 && typeof g.pointOfView === 'function') {
      const lats = pts.map(p => p.lat as number)
      const lngs = pts.map(p => p.lng as number)
      const lat = (Math.min(...lats) + Math.max(...lats)) / 2
      const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2
      // Spread in degrees → altitude. One point = close-in; transatlantic = pulled back.
      const spread = Math.max(
        Math.max(...lats) - Math.min(...lats),
        Math.max(...lngs) - Math.min(...lngs),
      )
      const altitude = Math.min(2.5, Math.max(0.6, spread / 45))
      g.pointOfView({ lat, lng, altitude }, 1200)
    }
  }, [provenance])

  // ── Search ────────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) return
    setIsSearching(true)
    setShowDropdown(true)
    setResults([])
    setProvenance(null)
    setSelectedResult(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (globeRef as any).current
    if (g) g.arcsData([])
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
      const data = (await res.json()) as { results: SearchResult[] }
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter')  runSearch(query)
    if (e.key === 'Escape') setShowDropdown(false)
  }

  // ── Provenance fetch ──────────────────────────────────────────────────────
  const selectArtwork = useCallback(async (result: SearchResult) => {
    setShowDropdown(false)
    setSelectedResult(result)
    setProvenance(null)
    setIsLoadingProv(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (globeRef as any).current
    if (g) g.arcsData([])

    const dashIdx = result.id.indexOf('-')
    const rawId   = dashIdx >= 0 ? result.id.slice(dashIdx + 1) : result.id

    try {
      const res = await fetch(`/api/provenance?source=${result.source}&id=${rawId}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = (await res.json()) as ProvenanceResponse
      setProvenance(data)
    } catch {
      setProvenance({
        artwork: {
          id: result.id,
          source: result.source,
          title: result.title,
          artist: result.artist,
          date: result.date,
          thumbnail: result.thumbnail,
          geoLocation: null,
        },
        locations: [],
        exhibitions: [],
        gaps: [{
          from: null,
          to: null,
          note: 'No documented chain of custody found in structured sources (Wikidata P276, Met, AIC). Help complete the record.',
        }],
        hasGap: true,
      })
    } finally {
      setIsLoadingProv(false)
    }
  }, [])

  // ── Featured journey: load a curated work straight into the provenance view ──
  const selectFeatured = useCallback((f: { source: 'aic' | 'rijks'; id: string; title: string; artist: string }) => {
    setQuery('')
    setResults([])
    setShowDropdown(false)
    selectArtwork({
      id: `${f.source}-${f.id}`,
      source: f.source,
      title: f.title,
      artist: f.artist,
      date: '',
      thumbnail: null,
    })
  }, [selectArtwork])

  // ── Close panel ───────────────────────────────────────────────────────────
  const closePanel = useCallback(() => {
    setSelectedResult(null)
    setProvenance(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (globeRef as any).current
    if (g) g.arcsData(DEFAULT_ARC)
  }, [])

  // ── Source footer ─────────────────────────────────────────────────────────
  const uniqueSources = provenance
    ? [...new Set(provenance.locations.map(l => l.source))]
    : []
  const sourceFooter = uniqueSources.length
    ? `Sources: ${uniqueSources.join(' · ')}`
    : 'Sources: Wikidata · Met · AIC'

  // ── Layout: desktop right-rail vs mobile bottom sheet ────────────────────
  // Desktop (≥1024px): right panel is a fixed right rail, 380px wide
  // Mobile (<768px):   right panel is a bottom sheet, ~60vh
  // Tablet (768–1023px): right panel is 320px wide
  const panelWidth = isDesktop ? 380 : (isMobile ? undefined : 320)
  const panelIsMobileSheet = isMobile && !!selectedResult

  // The search bar left offset — always starts past the left sidebar (280px on desktop)
  // and right end stops at panel left edge on desktop
  const searchBarLeft  = isDesktop ? 280 : 0
  const searchBarRight = isDesktop && selectedResult ? (panelWidth ?? 0) : 0

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: OBS.bg }}>

      {/* ── Globe canvas (hero, always behind) ─────────────────────────── */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="img"
        aria-label="Interactive globe showing documented art provenance journeys"
      />

      {/* ── Tracing overlay ─────────────────────────────────────────────── */}
      {isLoadingProv && !selectedResult && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div
            style={{
              background: OBS.dropdown,
              border: `1px solid ${OBS.borderMid}`,
              borderRadius: 'var(--radius-lg)',
              padding: '12px 24px',
              color: OBS.clay,
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
            }}
            className="animate-pulse"
          >
            Tracing provenance...
          </div>
        </div>
      )}

      {/* ── LEFT SIDEBAR — Observatory mode ─────────────────────────────── */}
      {/* Hidden on mobile to avoid crowding; accessible via museum globe pins */}
      {!isMobile && (
        <aside
          className="absolute left-0 top-0 h-full obs-scroll overflow-y-auto"
          style={{
            width: 280,
            background: OBS.panel,
            borderRight: `1px solid ${OBS.border}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 10,
          }}
          aria-label="World museums"
        >
          {/* Wordmark */}
          <div style={{ padding: '32px 24px 24px' }}>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                color: OBS.clay,
                marginBottom: 8,
              }}
            >
              Provenance
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 400,
                lineHeight: 1.0,
                color: OBS.text,
                letterSpacing: '-0.02em',
                marginBottom: 6,
              }}
            >
              Tracker
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8rem',
                color: OBS.textMuted,
                lineHeight: 1.4,
              }}
            >
              Where great art has been
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: OBS.border, margin: '0 24px 20px' }} />

          {/* Featured journeys — lead with the art, not the institutions */}
          <div style={{ padding: '0 12px 20px' }}>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: OBS.clay,
                padding: '0 12px',
                marginBottom: 10,
              }}
            >
              Featured Journeys
            </div>

            {FEATURED_WORKS.map(f => (
              <button
                key={f.id}
                onClick={() => selectFeatured(f)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  borderLeft: '2px solid transparent',
                  cursor: 'pointer',
                  transition: `background 200ms var(--ease-gentle), border-color 200ms var(--ease-gentle)`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = OBS.clayDim }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: OBS.text, lineHeight: 1.15 }}>
                  {f.title}
                </div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: OBS.textMuted, marginTop: 2 }}>
                  {f.artist}
                </div>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: OBS.border, margin: '0 24px 20px' }} />

          {/* Museum list */}
          <div style={{ padding: '0 12px 24px' }}>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: OBS.textFaint,
                padding: '0 12px',
                marginBottom: 10,
              }}
            >
              10 Leading Museums
            </div>

            {TOP_MUSEUMS.map(m => {
              const active = selectedMuseum === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMuseum(active ? null : m.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background:    active ? OBS.clayDim    : 'transparent',
                    borderLeft:    active ? `2px solid ${OBS.clay}` : '2px solid transparent',
                    cursor: 'pointer',
                    transition: `background 200ms var(--ease-gentle), border-color 200ms var(--ease-gentle)`,
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(200,120,85,0.07)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                  aria-pressed={active}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      color: active ? OBS.clay : OBS.text,
                      marginBottom: 2,
                    }}
                  >
                    {m.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.6875rem',
                      color: OBS.textMuted,
                    }}
                  >
                    {m.city}, {m.country}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.6875rem',
                      color: OBS.textFaint,
                      marginTop: 2,
                    }}
                  >
                    {m.focus}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>
      )}

      {/* ── RIGHT PANEL / MOBILE SHEET — Gallery mode (provenance detail) ── */}
      {selectedResult && (
        <>
          {/* Mobile: backdrop overlay */}
          {panelIsMobileSheet && (
            <div
              onClick={closePanel}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(10,9,8,0.55)',
                zIndex: 20,
              }}
              aria-hidden="true"
            />
          )}

          <aside
            className={`${panelIsMobileSheet ? 'fixed bottom-0 left-0 right-0' : 'absolute right-0 top-0 h-full'} gal-scroll overflow-y-auto panel-enter`}
            style={{
              // Desktop / tablet: right rail
              ...(panelIsMobileSheet ? {
                height: '65vh',
                borderTopLeftRadius: 'var(--radius-xl)',
                borderTopRightRadius: 'var(--radius-xl)',
                borderTop: `1px solid ${GAL.border}`,
              } : {
                width: panelWidth,
                borderLeft: `1px solid ${GAL.border}`,
              }),
              background: GAL.bg,
              zIndex: 25,
            }}
            aria-label="Artwork provenance detail"
          >
            {/* Close button */}
            <button
              onClick={closePanel}
              aria-label="Close provenance panel"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 20,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: GAL.surface2,
                border: `1px solid ${GAL.border}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: GAL.textMuted,
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem',
                transition: 'opacity 200ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.6' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'   }}
            >
              ✕
            </button>

            {/* Loading state */}
            {isLoadingProv && <GalleryShimmer />}

            {/* Provenance content */}
            {!isLoadingProv && provenance && (
              <div style={{ paddingBottom: 48 }}>

                {/* ── Artwork hero image ──────────────────────────────────── */}
                <div
                  style={{
                    width: '100%',
                    height: 220,
                    background: GAL.surface2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {provenance.artwork.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={provenance.artwork.thumbnail}
                      alt={`${provenance.artwork.title} — ${provenance.artwork.artist}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                      }}
                    />
                  ) : (
                    /* Text plate when no image — uses gallery colors, not dark OBS */
                    <div style={{ textAlign: 'center', padding: '0 24px' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.1rem',
                          fontStyle: 'italic',
                          color: GAL.textMuted,
                          lineHeight: 1.3,
                        }}
                      >
                        {provenance.artwork.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.75rem',
                          color: GAL.textFaint,
                          marginTop: 6,
                        }}
                      >
                        No image available
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Catalogue header ────────────────────────────────────── */}
                <div style={{ padding: '24px 24px 0' }}>
                  {/* Source badge top */}
                  <div style={{ marginBottom: 10 }}>
                    <SourceBadge source={provenance.artwork.source} gallery />
                  </div>

                  {/* Title */}
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.75rem',
                      fontWeight: 500,
                      lineHeight: 1.15,
                      color: GAL.text,
                      letterSpacing: '-0.01em',
                      marginBottom: 8,
                    }}
                  >
                    {provenance.artwork.title}
                  </h2>

                  {/* Artist */}
                  <p
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.875rem',
                      color: GAL.textMuted,
                      marginBottom: 4,
                      lineHeight: 1.4,
                    }}
                  >
                    {provenance.artwork.artist}
                  </p>

                  {/* Date */}
                  {provenance.artwork.date && (
                    <p
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.8125rem',
                        color: GAL.textFaint,
                      }}
                    >
                      {provenance.artwork.date}
                    </p>
                  )}
                </div>

                {/* ── Hairline ────────────────────────────────────────────── */}
                <div style={{ height: 1, background: GAL.border, margin: '20px 24px' }} />

                {/* ── Timeline ────────────────────────────────────────────── */}
                <div style={{ padding: '0 24px' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase' as const,
                      color: GAL.textFaint,
                      marginBottom: 20,
                    }}
                  >
                    Provenance · chain of custody
                  </div>

                  {/* Pure gap state (no locations at all) */}
                  {provenance.hasGap && provenance.locations.length === 0 && (
                    <GapDisplay
                      note={provenance.gaps[0]?.note ?? 'No documented movement history found. Help complete the record.'}
                      gallery
                    />
                  )}

                  {/* Location entries */}
                  {provenance.locations.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      {/* Vertical track */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          bottom: 6,
                          left: 6,
                          width: 1,
                          background: GAL.borderMid,
                        }}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {provenance.locations.map((loc, i) => (
                          <div key={i} style={{ paddingLeft: 28, position: 'relative' }}>
                            {/* Dot */}
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 3,
                                width: 13,
                                height: 13,
                                borderRadius: '50%',
                                background: GAL.surface,
                                border: `2px solid ${GAL.clay}`,
                                boxShadow: `0 0 0 2px ${GAL.bg}`,
                              }}
                            />

                            {/* Date range */}
                            <div
                              style={{
                                fontFamily: 'var(--font-ui)',
                                fontSize: '0.6875rem',
                                color: GAL.textFaint,
                                letterSpacing: '0.02em',
                                marginBottom: 3,
                              }}
                            >
                              {loc.startDate ?? '?'}
                              {loc.endDate ? ` – ${loc.endDate}` : ''}
                            </div>

                            {/* Location name */}
                            <div
                              style={{
                                fontFamily: 'var(--font-ui)',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                color: GAL.text,
                                lineHeight: 1.3,
                                marginBottom: 6,
                              }}
                            >
                              {loc.name}
                            </div>

                            {/* Source badge */}
                            <SourceBadge source={loc.source} gallery />
                          </div>
                        ))}

                        {/* Inline gap entry at end of timeline if hasGap */}
                        {provenance.hasGap && provenance.locations.length > 0 && (
                          <div style={{ paddingLeft: 28, position: 'relative' }}>
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 3,
                                width: 13,
                                height: 13,
                                borderRadius: '50%',
                                background: GAL.surface,
                                border: `2px dashed ${GAL.borderMid}`,
                                boxShadow: `0 0 0 2px ${GAL.bg}`,
                              }}
                            />
                            <GapDisplay
                              note={provenance.gaps[0]?.note ?? 'Movement chain incomplete. Help complete the record.'}
                              gallery
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Exhibition history (LOANS — not custody) ───────────────── */}
                {provenance.exhibitions && provenance.exhibitions.length > 0 && (
                  <div style={{ padding: '28px 24px 0' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase' as const,
                        color: GAL.textFaint,
                        marginBottom: 6,
                      }}
                    >
                      Exhibition history
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.7rem',
                        color: GAL.textMuted,
                        marginBottom: 14,
                        lineHeight: 1.4,
                      }}
                    >
                      {provenance.exhibitions.length} loans — the work was shown here and returned. Not changes of custody.
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {provenance.exhibitions.map((ex, i) => (
                        <span
                          key={i}
                          style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '0.7rem',
                            color: GAL.textMuted,
                            background: GAL.surface2,
                            border: `1px solid ${GAL.border}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '3px 8px',
                          }}
                        >
                          {ex.name}{ex.startDate ? ` ${ex.startDate}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Sources footer ───────────────────────────────────────── */}
                <div
                  style={{
                    margin: '32px 24px 0',
                    paddingTop: 16,
                    borderTop: `1px solid ${GAL.border}`,
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.6875rem',
                    color: GAL.textFaint,
                    letterSpacing: '0.02em',
                    lineHeight: 1.6,
                  }}
                >
                  {sourceFooter}
                </div>
              </div>
            )}
          </aside>
        </>
      )}

      {/* ── BOTTOM BAR + SEARCH ─────────────────────────────────────────────── */}
      {/* On mobile with panel open, the search bar is hidden to avoid overlap */}
      {!(panelIsMobileSheet) && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: searchBarLeft,
            right: searchBarRight,
            background: OBS.panel,
            borderTop: `1px solid ${OBS.border}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '12px 16px' : '14px 24px',
            transition: 'left 400ms var(--ease-panel), right 400ms var(--ease-panel)',
          }}
        >
          {/* Left — context label (hidden on very narrow) */}
          {!isMobile && (
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem',
                color: OBS.textFaint,
                letterSpacing: '0.02em',
              }}
            >
              10 museums · documented journeys
            </div>
          )}

          {/* Search group */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flex: isMobile ? 1 : undefined,
            }}
          >
            {/* Results dropdown (above the input) */}
            {showDropdown && (
              <div
                className="float-in"
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: 8,
                  width: isMobile ? 'calc(100vw - 32px)' : 400,
                  maxWidth: 'calc(100vw - 32px)',
                  background: OBS.dropdown,
                  border: `1px solid ${OBS.borderMid}`,
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                  zIndex: 30,
                }}
              >
                {isSearching ? (
                  <div
                    style={{
                      padding: '20px 20px',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.8125rem',
                      color: OBS.textMuted,
                      textAlign: 'center',
                    }}
                    className="animate-pulse"
                  >
                    Searching...
                  </div>
                ) : results.length === 0 ? (
                  /* Empty state — beautiful, not broken */
                  <div style={{ padding: '20px 20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 4,
                        marginBottom: 14,
                      }}
                    >
                      {[0,1,2,3,4,5].map(i => (
                        <div
                          key={i}
                          style={{
                            height: 1.5,
                            flex: 1,
                            background: OBS.textFaint,
                            borderRadius: 1,
                            opacity: 0.3 + i * 0.07,
                          }}
                        />
                      ))}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1rem',
                        color: OBS.text,
                        marginBottom: 8,
                      }}
                    >
                      Record not yet found
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.75rem',
                        color: OBS.textMuted,
                        lineHeight: 1.5,
                        maxWidth: '40ch',
                      }}
                    >
                      {query.trim()
                        ? `No sourced record for "${query.trim()}". Try a different title or artist.`
                        : 'Enter a title or artist name to trace provenance.'
                      }{' '}
                      Coverage is thin by design — only dated, sourced records appear here.
                    </div>
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {results.slice(0, 5).map((r, i) => (
                      <li key={r.id}>
                        <button
                          onMouseDown={() => selectArtwork(r)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: 'transparent',
                            border: 'none',
                            borderTop: i > 0 ? `1px solid ${OBS.border}` : 'none',
                            cursor: 'pointer',
                            transition: 'background 150ms',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = OBS.clayDim }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          {/* Thumbnail */}
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 'var(--radius-sm)',
                              background: OBS.surface2,
                              overflow: 'hidden',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {r.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={r.thumbnail}
                                alt=""
                                aria-hidden="true"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  fontFamily: 'var(--font-display)',
                                  fontSize: '1rem',
                                  color: OBS.textFaint,
                                  fontStyle: 'italic',
                                }}
                              >
                                {r.title.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Text */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontFamily: 'var(--font-ui)',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                color: OBS.text,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginBottom: 2,
                              }}
                            >
                              {r.title}
                            </div>
                            <div
                              style={{
                                fontFamily: 'var(--font-ui)',
                                fontSize: '0.75rem',
                                color: OBS.textMuted,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {r.artist}{r.date ? ` · ${r.date}` : ''}
                            </div>
                          </div>

                          {/* Badge */}
                          <SourceBadge source={r.source} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Label */}
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem',
                color: OBS.textFaint,
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                whiteSpace: 'nowrap' as const,
              }}
            >
              Search
            </span>

            {/* Input */}
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                if (e.target.value.trim().length < 2) {
                  setShowDropdown(false)
                  setResults([])
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
              placeholder="e.g. Starry Night"
              aria-label="Search artworks by title or artist"
              style={{
                background: OBS.surface,
                border: `1px solid ${OBS.border}`,
                borderRadius: 'var(--radius-md)',
                color: OBS.text,
                fontFamily: 'var(--font-ui)',
                fontSize: '0.875rem',
                padding: '8px 14px',
                width: isMobile ? '100%' : 220,
                flex: isMobile ? 1 : undefined,
                outline: 'none',
                transition: 'border-color 200ms var(--ease-gentle)',
              }}
              onFocusCapture={e => {
                (e.currentTarget as HTMLInputElement).style.borderColor = OBS.clay
              }}
              onBlurCapture={e => {
                (e.currentTarget as HTMLInputElement).style.borderColor = OBS.border
              }}
            />

            {/* Submit */}
            <button
              onClick={() => runSearch(query)}
              aria-label="Submit search"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: OBS.clay,
                fontFamily: 'var(--font-ui)',
                fontSize: '1.25rem',
                lineHeight: 1,
                padding: '4px 2px',
                transition: 'opacity 200ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.6' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'   }}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* ── Landing headline (shown only before any artwork is selected) ──── */}
      {!selectedResult && (
        <div
          className="float-in"
          style={{
            position: 'absolute',
            top: '50%',
            // On desktop: center in the globe area (left sidebar is 280px wide)
            left: isMobile ? 0 : 280,
            right: 0,
            transform: 'translateY(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
              color: OBS.clay,
              marginBottom: 12,
            }}
          >
            Art Provenance
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 400,
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              color: OBS.text,
              marginBottom: 16,
            }}
          >
            Where great art
            <br />
            <em style={{ fontStyle: 'italic' }}>has been</em>
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              color: OBS.textMuted,
              maxWidth: '36ch',
              lineHeight: 1.5,
              margin: '0 auto',
            }}
          >
            Search below to trace any painting&#39;s documented journey across museums and collections.
          </p>
        </div>
      )}
    </div>
  )
}
