'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SearchResult, ProvenanceResponse, LocationEntry } from '@/lib/types'

// ─── Design tokens ─────────────────────────────────────────────────────────
const T = {
  bg:          '#0a0908',
  border:      '#2a2218',
  panelBg:     'rgba(10,9,8,0.85)',
  dropdownBg:  'rgba(10,9,8,0.95)',
  textWarm:    '#f6f1e8',
  textMuted:   '#9a8f85',
  clay:        '#c87855',
  sage:        '#6f8d7d',
  pinGlow:     '#d4a853',
  land:        '#1c1612',
} as const

// ─── Museum data ────────────────────────────────────────────────────────────
const TOP_MUSEUMS = [
  { id: 'louvre',           name: 'Louvre',           city: 'Paris',         country: 'France',      lat: 48.8606, lng:   2.3376,  focus: 'Ancient & Renaissance', count:  38000 },
  { id: 'met',              name: 'The Met',           city: 'New York',      country: 'USA',         lat: 40.7794, lng: -73.9632,  focus: 'Global / All Eras',     count: 490000 },
  { id: 'national-gallery', name: 'National Gallery',  city: 'London',        country: 'UK',          lat: 51.5089, lng:  -0.1283,  focus: 'Western European',      count:   2300 },
  { id: 'uffizi',           name: 'Uffizi',            city: 'Florence',      country: 'Italy',       lat: 43.7678, lng:  11.2553,  focus: 'Italian Renaissance',   count:  20000 },
  { id: 'rijksmuseum',      name: 'Rijksmuseum',       city: 'Amsterdam',     country: 'Netherlands', lat: 52.3600, lng:   4.8852,  focus: 'Dutch Golden Age',      count:   8000 },
  { id: 'prado',            name: 'Prado',             city: 'Madrid',        country: 'Spain',       lat: 40.4138, lng:  -3.6922,  focus: 'Spanish & Flemish',     count:   8200 },
  { id: 'hermitage',        name: 'Hermitage',         city: 'St Petersburg', country: 'Russia',      lat: 59.9398, lng:  30.3146,  focus: 'Imperial European',     count: 3000000 },
  { id: 'smithsonian',      name: 'Smithsonian',       city: 'Washington DC', country: 'USA',         lat: 38.8913, lng: -77.0261,  focus: 'American & Global',     count: 154000 },
  { id: 'aic',              name: 'Art Institute',     city: 'Chicago',       country: 'USA',         lat: 41.8796, lng: -87.6237,  focus: 'Impressionism',         count: 300000 },
  { id: 'taipei',           name: 'National Palace',   city: 'Taipei',        country: 'Taiwan',      lat: 25.1024, lng: 121.5489,  focus: 'Chinese Imperial',      count: 700000 },
]

// Default arc shown before any search
const DEFAULT_ARC = [{
  startLat: 40.7614, startLng: -73.9776,
  endLat:   40.4138, endLng:   -3.6922,
  color: T.clay,
  label: 'Guernica: MoMA 1939 → Prado 1981',
}]

// ─── Arc builder ────────────────────────────────────────────────────────────
interface GlobeArc {
  startLat: number; startLng: number
  endLat: number;   endLng: number
  color: string;    label: string
}

function buildArcs(locations: LocationEntry[]): GlobeArc[] {
  const arcs: GlobeArc[] = []
  for (let i = 0; i < locations.length - 1; i++) {
    const a = locations[i]
    const b = locations[i + 1]
    if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) continue
    arcs.push({
      startLat: a.lat, startLng: a.lng,
      endLat:   b.lat, endLng:   b.lng,
      color: T.clay,
      label: `${a.name} → ${b.name}`,
    })
  }
  return arcs
}

// ─── Source label helpers ───────────────────────────────────────────────────
function sourceBadgeLabel(source: string): string {
  if (source === 'met') return 'MET'
  if (source === 'aic') return 'AIC'
  return source.toUpperCase()
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function ProvenanceGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef     = useRef<any>(null)

  // Museum sidebar
  const [selectedMuseum, setSelectedMuseum] = useState<string | null>(null)

  // Search
  const [query,         setQuery]         = useState('')
  const [results,       setResults]       = useState<SearchResult[]>([])
  const [showDropdown,  setShowDropdown]  = useState(false)
  const [isSearching,   setIsSearching]   = useState(false)

  // Provenance panel
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [provenance,     setProvenance]     = useState<ProvenanceResponse | null>(null)
  const [isLoadingProv,  setIsLoadingProv]  = useState(false)

  // ── Globe init (single useEffect, never re-runs) ─────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    let mounted = true

    ;(async () => {
      const GlobeGL = (await import('globe.gl')).default
      if (!mounted || !containerRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globe = (GlobeGL as any)()(containerRef.current) as any
      globe
        .globeImageUrl(null)
        .backgroundColor(T.bg)
        .showAtmosphere(true)
        .atmosphereColor(T.clay)
        .atmosphereAltitude(0.12)

      // Museum HTML pins
      const pins = TOP_MUSEUMS.map(m => {
        const el = document.createElement('div')
        el.innerHTML = `
          <div style="position:relative;width:20px;height:20px;cursor:pointer;" title="${m.name}">
            <div style="position:absolute;inset:0;background:${T.pinGlow};border-radius:50%;"></div>
            <div class="pulse-ring" style="position:absolute;inset:0;background:${T.pinGlow};border-radius:50%;"></div>
          </div>`
        el.onclick = () => setSelectedMuseum(m.id)
        return { ...m, el }
      })
      globe.htmlElementsData(pins).htmlElement((d: any) => d.el)

      // Default arcs
      globe
        .arcsData(DEFAULT_ARC)
        .arcColor((d: any) => d.color ?? T.clay)
        .arcAltitude(0.3)
        .arcDashLength(0.4)
        .arcDashGap(0.4)
        .arcDashAnimateTime(4000)

      globeRef.current = globe
    })()

    return () => { mounted = false }
  }, [])

  // ── Update arcs when provenance changes ──────────────────────────────────
  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    if (!provenance) {
      g.arcsData(DEFAULT_ARC)
      return
    }
    const arcs = buildArcs(provenance.locations)
    g.arcsData(arcs.length ? arcs : [])
  }, [provenance])

  // ── Search ───────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) return
    setIsSearching(true)
    setShowDropdown(true)
    setResults([])
    setProvenance(null)
    setSelectedResult(null)
    if (globeRef.current) globeRef.current.arcsData([])
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
      const data = (await res.json()) as { results: SearchResult[] }
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runSearch(query)
    if (e.key === 'Escape') setShowDropdown(false)
  }

  // ── Provenance fetch ──────────────────────────────────────────────────────
  const selectArtwork = useCallback(async (result: SearchResult) => {
    setShowDropdown(false)
    setSelectedResult(result)
    setProvenance(null)
    setIsLoadingProv(true)
    if (globeRef.current) globeRef.current.arcsData([])

    // Derive numeric id from composite "met-12345" / "aic-56789"
    const dashIdx = result.id.indexOf('-')
    const rawId   = dashIdx >= 0 ? result.id.slice(dashIdx + 1) : result.id

    try {
      const res = await fetch(`/api/provenance?source=${result.source}&id=${rawId}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = (await res.json()) as ProvenanceResponse
      setProvenance(data)
    } catch {
      // Empty provenance — gap state
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
        gaps: [{
          from: null,
          to: null,
          note: 'No documented movement history found in structured data sources.',
        }],
        hasGap: true,
      })
    } finally {
      setIsLoadingProv(false)
    }
  }, [])

  // ── Computed values ───────────────────────────────────────────────────────
  const uniqueSources = provenance
    ? [...new Set(provenance.locations.map(l => l.source))]
    : []
  const sourceFooter = uniqueSources.length
    ? `Sources: ${uniqueSources.join(' · ')}`
    : 'Sources: Wikidata · Met · AIC'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      {/* Globe canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Provenance-tracing loading overlay */}
      {isLoadingProv && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div
            className="px-6 py-3 rounded-lg border text-sm font-medium tracking-wide animate-pulse"
            style={{ background: T.dropdownBg, borderColor: T.border, color: T.clay }}
          >
            Tracing provenance...
          </div>
        </div>
      )}

      {/* ── Left sidebar (museum list) ─────────────────────────────────────── */}
      <div
        className="absolute left-0 top-0 w-80 h-full border-r overflow-y-auto"
        style={{ background: T.panelBg, borderColor: T.border, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="p-6">
          <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: T.clay }}>
            Provenance
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: T.textWarm }}>Tracker</h1>
          <p className="text-sm mb-8" style={{ color: T.textMuted }}>Where art has been</p>

          <div className="space-y-3">
            {TOP_MUSEUMS.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMuseum(m.id)}
                className="block w-full text-left p-3 rounded border transition-colors"
                style={{
                  background: selectedMuseum === m.id ? 'rgba(200,120,85,0.15)' : 'transparent',
                  borderColor: selectedMuseum === m.id ? T.clay : T.border,
                }}
              >
                <div className="font-semibold" style={{ color: T.textWarm }}>{m.name}</div>
                <div className="text-xs mt-0.5" style={{ color: T.textMuted }}>{m.city}, {m.country}</div>
                <div className="text-xs mt-1" style={{ color: T.textMuted }}>{m.focus}</div>
                <div className="text-xs mt-1" style={{ color: T.clay }}>{(m.count / 1000).toFixed(0)}k artworks</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (provenance timeline) ─────────────────────────────── */}
      {selectedResult && (
        <div
          className="absolute right-0 top-0 w-80 h-full border-l overflow-y-auto"
          style={{ background: T.panelBg, borderColor: T.border, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="p-6">

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-3 min-w-0">
                <div className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: T.clay }}>
                  {sourceBadgeLabel(selectedResult.source)}
                </div>
                <h2 className="text-lg font-bold leading-snug" style={{ color: T.textWarm }}>
                  {selectedResult.title}
                </h2>
                <p className="text-sm mt-1 truncate" style={{ color: T.textMuted }}>
                  {selectedResult.artist}
                </p>
                {selectedResult.date && (
                  <p className="text-xs mt-1" style={{ color: T.textMuted }}>{selectedResult.date}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedResult(null)
                  setProvenance(null)
                  if (globeRef.current) globeRef.current.arcsData(DEFAULT_ARC)
                }}
                aria-label="Close panel"
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded text-xs transition-opacity hover:opacity-60"
                style={{ color: T.textMuted, border: `1px solid ${T.border}` }}
              >
                ✕
              </button>
            </div>

            {/* Loading skeleton */}
            {isLoadingProv && (
              <div className="space-y-3 mt-2">
                {[72, 56, 64].map((h, i) => (
                  <div
                    key={i}
                    className="rounded animate-pulse"
                    style={{ height: h, background: T.land }}
                  />
                ))}
              </div>
            )}

            {/* Timeline */}
            {!isLoadingProv && provenance && (
              <>
                {/* Gap-only state */}
                {provenance.hasGap && provenance.locations.length === 0 && (
                  <div
                    className="mt-2 p-4 rounded text-sm"
                    style={{
                      border: `1px dashed ${T.textMuted}`,
                      background: 'rgba(154,143,133,0.07)',
                      color: T.textMuted,
                    }}
                  >
                    <div className="font-semibold mb-1">Provenance gap</div>
                    <div className="text-xs leading-relaxed">
                      {provenance.gaps[0]?.note ?? 'No documented movement history found. Help complete it.'}
                    </div>
                  </div>
                )}

                {/* Location entries */}
                {provenance.locations.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: T.textMuted }}>
                      Movement history
                    </div>

                    {/* Timeline with vertical rule */}
                    <div className="relative">
                      <div
                        className="absolute top-2 bottom-2"
                        style={{ left: 7, width: 1, background: T.border }}
                      />
                      <div className="space-y-4">
                        {provenance.locations.map((loc, i) => (
                          <div key={i} className="pl-6 relative">
                            {/* Dot */}
                            <div
                              className="absolute top-1.5 w-3.5 h-3.5 rounded-full border-2"
                              style={{
                                left: 0,
                                background: T.bg,
                                borderColor: T.clay,
                              }}
                            />

                            {/* Date range */}
                            <div className="text-xs mb-0.5" style={{ color: T.textMuted }}>
                              {loc.startDate ?? '?'}{loc.endDate ? ` – ${loc.endDate}` : ''}
                            </div>

                            {/* Location name */}
                            <div className="text-sm font-medium leading-snug" style={{ color: T.textWarm }}>
                              {loc.name}
                            </div>

                            {/* Source badge */}
                            <div className="mt-1">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-sm"
                                style={{
                                  background: 'rgba(200,120,85,0.12)',
                                  color: T.clay,
                                  border: `1px solid ${T.clay}44`,
                                }}
                              >
                                {loc.source}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Inline gap entry at end if hasGap */}
                        {provenance.hasGap && provenance.locations.length > 0 && (
                          <div className="pl-6 relative">
                            <div
                              className="absolute top-1.5 w-3.5 h-3.5 rounded-full border-2"
                              style={{ left: 0, background: T.bg, borderColor: T.textMuted }}
                            />
                            <div
                              className="p-2 rounded text-xs"
                              style={{
                                border: `1px dashed ${T.textMuted}`,
                                background: 'rgba(154,143,133,0.07)',
                                color: T.textMuted,
                              }}
                            >
                              <span className="font-semibold">Provenance gap</span> — help complete it
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources footer */}
                <div
                  className="mt-6 pt-4 text-xs"
                  style={{ borderTop: `1px solid ${T.border}`, color: T.textMuted }}
                >
                  {sourceFooter}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom bar + search ────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-between items-center"
        style={{ background: T.panelBg, borderColor: T.border, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="text-sm" style={{ color: T.textMuted }}>
          10 museums · 4.8M artworks tracked
        </div>

        {/* Search group */}
        <div className="relative flex items-center gap-2">
          <span className="text-sm" style={{ color: T.textMuted }}>Search any painting</span>

          {/* Results dropdown (anchors above the input group) */}
          {showDropdown && (
            <div
              className="absolute bottom-full right-0 mb-2 w-80 rounded-lg border overflow-hidden shadow-2xl z-30"
              style={{ background: T.dropdownBg, borderColor: T.border }}
            >
              {isSearching ? (
                <div className="px-4 py-5 text-sm text-center animate-pulse" style={{ color: T.textMuted }}>
                  Searching...
                </div>
              ) : results.length === 0 ? (
                /* Empty state */
                <div className="px-4 py-5">
                  <div className="text-sm font-semibold mb-1" style={{ color: T.textMuted }}>
                    Provenance gap — help complete it
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: T.textMuted }}>
                    No artworks found for &ldquo;{query}&rdquo;. Try a different title or artist.
                  </div>
                </div>
              ) : (
                <ul>
                  {results.slice(0, 5).map((r, i) => (
                    <li key={r.id}>
                      <button
                        onMouseDown={() => selectArtwork(r)}
                        className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
                        style={{ borderTop: i > 0 ? `1px solid ${T.border}` : undefined }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,120,85,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: T.textWarm }}>
                            {r.title}
                          </div>
                          <div className="text-xs mt-0.5 truncate" style={{ color: T.textMuted }}>
                            {r.artist}{r.date ? ` · ${r.date}` : ''}
                          </div>
                        </div>
                        <span
                          className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-sm self-start mt-0.5"
                          style={{
                            background: 'rgba(200,120,85,0.15)',
                            color: T.clay,
                            border: `1px solid ${T.clay}44`,
                          }}
                        >
                          {sourceBadgeLabel(r.source)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <input
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              if (e.target.value.trim().length < 2) { setShowDropdown(false); setResults([]) }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
            placeholder="e.g. Starry Night"
            className="rounded px-3 py-1.5 text-sm focus:outline-none"
            style={{
              background: T.land,
              border: `1px solid ${T.border}`,
              color: T.textWarm,
              width: 180,
            }}
            aria-label="Search artworks"
          />
          <button
            onClick={() => runSearch(query)}
            aria-label="Submit search"
            className="transition-opacity hover:opacity-60 text-lg leading-none"
            style={{ color: T.clay }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
