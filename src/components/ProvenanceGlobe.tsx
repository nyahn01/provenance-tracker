'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SearchResult } from '../app/api/search/route'
import type { ProvenanceData, ProvenanceLocation } from '../app/api/provenance/route'

// ─── Design-token constants ────────────────────────────────────────────────
const TOKEN = {
  bg:        '#0a0908',
  border:    '#2a2218',
  panelBg:   'rgba(10,9,8,0.85)',
  dropdownBg:'rgba(10,9,8,0.95)',
  textWarm:  '#f6f1e8',
  textMuted: '#9a8f85',
  clay:      '#c87855',
  sage:      '#6f8d7d',
  pinGlow:   '#d4a853',
  land:      '#1c1612',
  gap:       '#9a8f85',
} as const

// ─── Museum data ───────────────────────────────────────────────────────────
const TOP_MUSEUMS = [
  { id: 'louvre',           name: 'Louvre',           city: 'Paris',         country: 'France',       lat: 48.8606, lng: 2.3376,   focus: 'Ancient & Renaissance',  count: 38000   },
  { id: 'met',              name: 'The Met',           city: 'New York',      country: 'USA',          lat: 40.7794, lng: -73.9632, focus: 'Global / All Eras',       count: 490000  },
  { id: 'national-gallery', name: 'National Gallery',  city: 'London',        country: 'UK',           lat: 51.5089, lng: -0.1283, focus: 'Western European',        count: 2300    },
  { id: 'uffizi',           name: 'Uffizi',            city: 'Florence',      country: 'Italy',        lat: 43.7678, lng: 11.2553, focus: 'Italian Renaissance',     count: 20000   },
  { id: 'rijksmuseum',      name: 'Rijksmuseum',       city: 'Amsterdam',     country: 'Netherlands',  lat: 52.3600, lng: 4.8852,  focus: 'Dutch Golden Age',        count: 8000    },
  { id: 'prado',            name: 'Prado',             city: 'Madrid',        country: 'Spain',        lat: 40.4138, lng: -3.6922, focus: 'Spanish & Flemish',       count: 8200    },
  { id: 'hermitage',        name: 'Hermitage',         city: 'St Petersburg', country: 'Russia',       lat: 59.9398, lng: 30.3146, focus: 'Imperial European',       count: 3000000 },
  { id: 'smithsonian',      name: 'Smithsonian',       city: 'Washington DC', country: 'USA',          lat: 38.8913, lng: -77.0261,focus: 'American & Global',       count: 154000  },
  { id: 'aic',              name: 'Art Institute',     city: 'Chicago',       country: 'USA',          lat: 41.8796, lng: -87.6237,focus: 'Impressionism',           count: 300000  },
  { id: 'taipei',           name: 'National Palace',   city: 'Taipei',        country: 'Taiwan',       lat: 25.1024, lng: 121.5489,focus: 'Chinese Imperial',        count: 700000  },
]

// ─── Arc helpers ───────────────────────────────────────────────────────────
interface GlobeArc {
  startLat: number
  startLng: number
  endLat:   number
  endLng:   number
  label:    string
  color:    string
}

function buildArcs(locations: ProvenanceLocation[]): GlobeArc[] {
  const arcs: GlobeArc[] = []
  for (let i = 0; i < locations.length - 1; i++) {
    const from = locations[i]
    const to   = locations[i + 1]
    if (
      from.lat == null || from.lng == null ||
      to.lat   == null || to.lng   == null
    ) continue

    const color =
      from.confidence === 'confirmed' && to.confidence === 'confirmed'
        ? TOKEN.clay
        : TOKEN.sage

    arcs.push({
      startLat: from.lat,
      startLng: from.lng,
      endLat:   to.lat,
      endLng:   to.lng,
      label:    `${from.name} → ${to.name}`,
      color,
    })
  }
  return arcs
}

// ─── Source badge colours ──────────────────────────────────────────────────
const SOURCE_COLOR: Record<string, string> = {
  Wikidata: TOKEN.sage,
  Met:      TOKEN.clay,
  AIC:      TOKEN.clay,
}

// ─── Confidence dot colour ─────────────────────────────────────────────────
function confidenceColor(c: ProvenanceLocation['confidence']): string {
  if (c === 'confirmed') return TOKEN.clay
  if (c === 'uncertain') return TOKEN.sage
  return TOKEN.gap
}

// ─── Component ────────────────────────────────────────────────────────────
export default function ProvenanceGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef     = useRef<any>(null)

  // Sidebar / museum
  const [selectedMuseum, setSelectedMuseum] = useState<string | null>(null)

  // Search
  const [query,          setQuery]          = useState('')
  const [searchResults,  setSearchResults]  = useState<SearchResult[]>([])
  const [showDropdown,   setShowDropdown]   = useState(false)
  const [isSearching,    setIsSearching]    = useState(false)

  // Provenance
  const [selectedArtwork, setSelectedArtwork] = useState<SearchResult | null>(null)
  const [provenanceData,  setProvenanceData]  = useState<ProvenanceData | null>(null)
  const [isLoadingProv,   setIsLoadingProv]   = useState(false)

  // ── Globe init (runs once) ───────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    let mounted = true

    const init = async () => {
      const GlobeGL = (await import('globe.gl')).default
      if (!mounted || !containerRef.current) return

      const globe = GlobeGL()
        .globeImageUrl(null)
        .backgroundColor(TOKEN.bg)
        .showAtmosphere(true)
        .atmosphereColor(TOKEN.clay)
        .atmosphereAltitude(0.12)(containerRef.current)

      // Museum pins
      const pins = TOP_MUSEUMS.map(m => {
        const el = document.createElement('div')
        el.className = 'museum-pin'
        el.innerHTML = `
          <div class="relative w-5 h-5 cursor-pointer group" title="${m.name}">
            <div class="absolute inset-0 bg-[#d4a853] rounded-full"></div>
            <div class="absolute inset-0 rounded-full pulse-ring bg-[#d4a853]"></div>
            <div class="absolute left-6 top-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-[rgba(10,9,8,0.95)] px-3 py-1 rounded text-xs text-[#f6f1e8] border border-[#2a2218] pointer-events-none">
              ${m.name}
            </div>
          </div>`
        el.onclick = () => setSelectedMuseum(m.id)
        return { ...m, el }
      })
      globe.htmlElementsData(pins).htmlElement((d: any) => d.el)

      // Default arc (Guernica) — will be overridden on provenance load
      globe
        .arcsData([{
          startLat: 40.7614, startLng: -73.9776,
          endLat:   40.4138, endLng:   -3.6922,
          label: 'Guernica: MoMA 1939 → Prado 1981',
          color: TOKEN.clay,
        }])
        .arcColor((d: any) => d.color ?? TOKEN.clay)
        .arcAltitude(0.3)
        .arcDashLength(0.4)
        .arcDashGap(0.4)
        .arcDashAnimateTime(4000)

      globeRef.current = globe
    }

    init()
    return () => { mounted = false }
  }, [])

  // ── Update arcs when provenance changes ─────────────────────────────────
  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    if (!provenanceData) {
      // Reset to default Guernica arc
      g.arcsData([{
        startLat: 40.7614, startLng: -73.9776,
        endLat:   40.4138, endLng:   -3.6922,
        label: 'Guernica: MoMA 1939 → Prado 1981',
        color: TOKEN.clay,
      }])
      return
    }
    const arcs = buildArcs(provenanceData.locations)
    g.arcsData(arcs)
  }, [provenanceData])

  // ── Search handler ───────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return
    setIsSearching(true)
    setShowDropdown(true)
    setProvenanceData(null)
    setSelectedArtwork(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      const data = (await res.json()) as { results: SearchResult[] }
      setSearchResults(data.results ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runSearch(query)
    if (e.key === 'Escape') { setShowDropdown(false) }
  }

  // ── Provenance fetch ─────────────────────────────────────────────────────
  const selectResult = useCallback(async (result: SearchResult) => {
    setShowDropdown(false)
    setSelectedArtwork(result)
    setProvenanceData(null)
    setIsLoadingProv(true)
    // Clear arcs immediately on new search
    if (globeRef.current) globeRef.current.arcsData([])
    try {
      const res = await fetch(
        `/api/provenance?source=${result.source}&id=${result.objectId}`,
      )
      if (!res.ok) throw new Error('Not found')
      const data = (await res.json()) as { provenance: ProvenanceData }
      setProvenanceData(data.provenance)
    } catch {
      // Show gap state by setting empty locations
      setProvenanceData({
        id: result.id,
        title: result.title,
        artist: result.artist,
        locations: [],
        sources: [],
      })
    } finally {
      setIsLoadingProv(false)
    }
  }, [])

  // ── Unique source string ─────────────────────────────────────────────────
  const sourceList = provenanceData
    ? [...new Set(provenanceData.locations.map(l => l.source))].join(' · ')
    : null

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      {/* Globe */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {isLoadingProv && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div
            className="px-6 py-3 rounded-lg border text-sm font-medium tracking-wide animate-pulse"
            style={{
              background: TOKEN.dropdownBg,
              borderColor: TOKEN.border,
              color: TOKEN.clay,
            }}
          >
            Tracing provenance...
          </div>
        </div>
      )}

      {/* ── Left sidebar ── */}
      <div
        className="absolute left-0 top-0 w-80 h-full border-r overflow-y-auto float-in"
        style={{
          background: TOKEN.panelBg,
          borderColor: TOKEN.border,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="p-6">
          <div
            className="text-xs uppercase tracking-widest font-semibold mb-2"
            style={{ color: TOKEN.clay }}
          >
            Provenance
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: TOKEN.textWarm }}>
            Tracker
          </h1>
          <p className="text-sm mb-8" style={{ color: TOKEN.textMuted }}>
            Where art has been
          </p>

          <div className="space-y-3">
            {TOP_MUSEUMS.map(museum => (
              <button
                key={museum.id}
                onClick={() => setSelectedMuseum(museum.id)}
                className="block w-full text-left p-3 rounded border transition-colors"
                style={{
                  background:
                    selectedMuseum === museum.id
                      ? 'rgba(200,120,85,0.15)'
                      : 'transparent',
                  borderColor:
                    selectedMuseum === museum.id ? TOKEN.clay : TOKEN.border,
                }}
              >
                <div className="font-semibold" style={{ color: TOKEN.textWarm }}>
                  {museum.name}
                </div>
                <div className="text-xs mt-0.5" style={{ color: TOKEN.textMuted }}>
                  {museum.city}, {museum.country}
                </div>
                <div className="text-xs mt-1" style={{ color: TOKEN.textMuted }}>
                  {museum.focus}
                </div>
                <div className="text-xs mt-1" style={{ color: TOKEN.clay }}>
                  {(museum.count / 1000).toFixed(0)}k artworks
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (provenance) ── */}
      {selectedArtwork && (
        <div
          className="absolute right-0 top-0 w-80 h-full border-l overflow-y-auto"
          style={{
            background: TOKEN.panelBg,
            borderColor: TOKEN.border,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-3">
                <div
                  className="text-xs uppercase tracking-widest font-semibold mb-1"
                  style={{ color: TOKEN.clay }}
                >
                  {selectedArtwork.source}
                </div>
                <h2
                  className="text-lg font-bold leading-snug"
                  style={{ color: TOKEN.textWarm }}
                >
                  {selectedArtwork.title}
                </h2>
                <p className="text-sm mt-1" style={{ color: TOKEN.textMuted }}>
                  {selectedArtwork.artist}
                </p>
                {provenanceData?.dateCreated && (
                  <p className="text-xs mt-1" style={{ color: TOKEN.textMuted }}>
                    {provenanceData.dateCreated}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedArtwork(null)
                  setProvenanceData(null)
                  if (globeRef.current) {
                    globeRef.current.arcsData([{
                      startLat: 40.7614, startLng: -73.9776,
                      endLat:   40.4138, endLng:   -3.6922,
                      label: 'Guernica: MoMA 1939 → Prado 1981',
                      color: TOKEN.clay,
                    }])
                  }
                }}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs transition-opacity hover:opacity-70"
                style={{ color: TOKEN.textMuted, border: `1px solid ${TOKEN.border}` }}
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>

            {/* Loading skeleton */}
            {isLoadingProv && (
              <div className="space-y-3 mt-6">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-14 rounded animate-pulse"
                    style={{ background: TOKEN.land }}
                  />
                ))}
              </div>
            )}

            {/* Timeline */}
            {!isLoadingProv && provenanceData && (
              <>
                {provenanceData.locations.length === 0 ? (
                  /* Empty / gap state */
                  <div
                    className="mt-6 p-4 rounded border"
                    style={{
                      borderStyle: 'dashed',
                      borderColor: TOKEN.textMuted,
                      background: 'rgba(154,143,133,0.07)',
                    }}
                  >
                    <div
                      className="text-sm font-semibold mb-1"
                      style={{ color: TOKEN.textMuted }}
                    >
                      Provenance gap
                    </div>
                    <div className="text-xs" style={{ color: TOKEN.textMuted }}>
                      No documented movement history found. Help complete it.
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div
                      className="text-xs uppercase tracking-widest font-semibold mb-4"
                      style={{ color: TOKEN.textMuted }}
                    >
                      Movement history
                    </div>
                    <div className="relative">
                      {/* Vertical line */}
                      <div
                        className="absolute left-[7px] top-2 bottom-2 w-px"
                        style={{ background: TOKEN.border }}
                      />

                      <div className="space-y-4">
                        {provenanceData.locations.map((loc, i) => (
                          <div key={i} className="pl-6 relative">
                            {/* Confidence dot */}
                            <div
                              className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                              style={{
                                background: TOKEN.bg,
                                borderColor: confidenceColor(loc.confidence),
                              }}
                            />

                            {/* Gap badge */}
                            {loc.hasGap && (
                              <div
                                className="mb-2 px-2 py-1 text-xs rounded"
                                style={{
                                  borderStyle: 'dashed',
                                  border: `1px dashed ${TOKEN.textMuted}`,
                                  color: TOKEN.textMuted,
                                  background: 'rgba(154,143,133,0.07)',
                                }}
                              >
                                Provenance gap — help complete it
                              </div>
                            )}

                            <div
                              className="text-xs mb-0.5"
                              style={{ color: TOKEN.textMuted }}
                            >
                              {loc.dateFrom ?? '?'}
                              {loc.dateTo ? ` – ${loc.dateTo}` : ''}
                            </div>
                            <div
                              className="text-sm font-medium leading-snug"
                              style={{ color: TOKEN.textWarm }}
                            >
                              {loc.name}
                            </div>
                            {(loc.city || loc.country) && (
                              <div
                                className="text-xs mt-0.5"
                                style={{ color: TOKEN.textMuted }}
                              >
                                {[loc.city, loc.country].filter(Boolean).join(', ')}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-sm"
                                style={{
                                  background: 'rgba(200,120,85,0.12)',
                                  color: SOURCE_COLOR[loc.source] ?? TOKEN.clay,
                                  border: `1px solid ${SOURCE_COLOR[loc.source] ?? TOKEN.clay}33`,
                                }}
                              >
                                {loc.source}
                              </span>
                              <span
                                className="text-[10px] capitalize"
                                style={{ color: confidenceColor(loc.confidence) }}
                              >
                                {loc.confidence}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources footer */}
                {sourceList && (
                  <div
                    className="mt-6 pt-4 text-xs"
                    style={{
                      borderTop: `1px solid ${TOKEN.border}`,
                      color: TOKEN.textMuted,
                    }}
                  >
                    Sources: {sourceList}
                  </div>
                )}
                {!sourceList && (
                  <div
                    className="mt-6 pt-4 text-xs"
                    style={{
                      borderTop: `1px solid ${TOKEN.border}`,
                      color: TOKEN.textMuted,
                    }}
                  >
                    Sources: Wikidata · Met · AIC
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-between items-center"
        style={{
          background: TOKEN.panelBg,
          borderColor: TOKEN.border,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="text-sm" style={{ color: TOKEN.textMuted }}>
          10 museums · 4.8M artworks tracked
        </div>

        {/* Search wrapper — relative so dropdown can anchor here */}
        <div className="relative flex items-center gap-2">
          <span className="text-sm" style={{ color: TOKEN.textMuted }}>
            Search any painting
          </span>

          {/* Dropdown (appears above) */}
          {showDropdown && (
            <div
              className="absolute bottom-full mb-2 right-0 w-80 rounded-lg border overflow-hidden shadow-xl z-30"
              style={{
                background: TOKEN.dropdownBg,
                borderColor: TOKEN.border,
              }}
            >
              {isSearching ? (
                <div
                  className="px-4 py-5 text-sm text-center animate-pulse"
                  style={{ color: TOKEN.textMuted }}
                >
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-5">
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{ color: TOKEN.textMuted }}
                  >
                    Provenance gap — help complete it
                  </div>
                  <div className="text-xs" style={{ color: TOKEN.textMuted }}>
                    No artworks found matching &ldquo;{query}&rdquo;. Try a
                    different title or artist name.
                  </div>
                </div>
              ) : (
                <ul>
                  {searchResults.map((r, i) => (
                    <li key={r.id}>
                      <button
                        onClick={() => selectResult(r)}
                        className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
                        style={{
                          borderTop: i > 0 ? `1px solid ${TOKEN.border}` : undefined,
                        }}
                        onMouseEnter={e =>
                          (e.currentTarget.style.background = 'rgba(200,120,85,0.1)')
                        }
                        onMouseLeave={e =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm font-medium truncate"
                            style={{ color: TOKEN.textWarm }}
                          >
                            {r.title}
                          </div>
                          <div
                            className="text-xs mt-0.5 truncate"
                            style={{ color: TOKEN.textMuted }}
                          >
                            {r.artist}
                          </div>
                        </div>
                        <span
                          className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-sm self-start mt-0.5"
                          style={{
                            background: 'rgba(200,120,85,0.15)',
                            color: TOKEN.clay,
                            border: `1px solid ${TOKEN.clay}44`,
                          }}
                        >
                          {r.source}
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
              if (e.target.value.trim().length < 2) {
                setShowDropdown(false)
                setSearchResults([])
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="e.g. Starry Night"
            className="rounded px-3 py-1.5 text-sm focus:outline-none"
            style={{
              background: TOKEN.land,
              border: `1px solid ${TOKEN.border}`,
              color: TOKEN.textWarm,
            }}
            aria-label="Search artworks"
          />
          <button
            onClick={() => runSearch(query)}
            className="transition-opacity hover:opacity-70"
            style={{ color: TOKEN.clay }}
            aria-label="Submit search"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
