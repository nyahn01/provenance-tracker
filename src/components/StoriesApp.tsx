'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SearchResult, ProvenanceResponse, LocationEntry, GettyRecord } from '@/lib/types'
import type { RkdRecord } from '@/lib/rkd'
import { FEATURED_WORKS, aicImage, type FeaturedWork } from '@/lib/featured'

// ─── Design tokens ────────────────────────────────────────────────────────────
const OBS = {
  bg: '#0a0908', surface: '#131110', border: '#2a2218', borderMid: '#3d3228',
  text: '#f6f1e8', textMuted: '#9a8f85', textFaint: '#5c5449',
  clay: '#c87855', gold: '#d4a853', sage: '#6f8d7d',
  globeOcean: '#060504', globeLand: '#7a5828', globeBorder: '#a87848',
} as const
const GAL = {
  bg: '#f7f4ee', surface: '#ffffff', surface2: '#ede9e2', border: '#d8d2c8', borderMid: '#b8afa3',
  text: '#1a1714', textMuted: '#6b6460', textFaint: '#9e9790',
  clay: '#b06840', sage: '#4a7a6a', gold: '#a07830',
} as const

// ─── City coordinate lookup (for Getty dealer city dots) ─────────────────────
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'paris': { lat: 48.8566, lng: 2.3522 }, 'london': { lat: 51.5074, lng: -0.1278 },
  'new york': { lat: 40.7128, lng: -74.006 }, 'chicago': { lat: 41.8781, lng: -87.6298 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 }, 'brussels': { lat: 50.8503, lng: 4.3517 },
  'berlin': { lat: 52.52, lng: 13.405 }, 'boston': { lat: 42.3601, lng: -71.0589 },
  'philadelphia': { lat: 39.9526, lng: -75.1652 }, 'washington': { lat: 38.9072, lng: -77.0369 },
  'san francisco': { lat: 37.7749, lng: -122.4194 }, 'los angeles': { lat: 34.0522, lng: -118.2437 },
  'vienna': { lat: 48.2082, lng: 16.3738 }, 'zurich': { lat: 47.3769, lng: 8.5417 },
  'geneva': { lat: 46.2044, lng: 6.1432 }, 'munich': { lat: 48.1351, lng: 11.582 },
  'hamburg': { lat: 53.5511, lng: 9.9937 }, 'rome': { lat: 41.9028, lng: 12.4964 },
  'florence': { lat: 43.7696, lng: 11.2558 }, 'madrid': { lat: 40.4168, lng: -3.7038 },
  'st. petersburg': { lat: 59.9311, lng: 30.3609 }, 'moscow': { lat: 55.7558, lng: 37.6173 },
  'pittsburgh': { lat: 40.4406, lng: -79.9959 }, 'minneapolis': { lat: 44.9778, lng: -93.265 },
  'detroit': { lat: 42.3314, lng: -83.0458 }, 'cleveland': { lat: 41.4993, lng: -81.6944 },
  'toronto': { lat: 43.6532, lng: -79.3832 }, 'montreal': { lat: 45.5017, lng: -73.5673 },
  'tokyo': { lat: 35.6762, lng: 139.6503 }, 'seoul': { lat: 37.5665, lng: 126.978 },
}
function cityCoords(locationStr: string | null): { lat: number; lng: number } | null {
  if (!locationStr) return null
  const key = locationStr.toLowerCase().split(',')[0].trim()
  return CITY_COORDS[key] ?? null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
interface GlobeArc { startLat: number; startLng: number; endLat: number; endLng: number; color: string; altitude: number; label: string }
function buildArcs(locations: LocationEntry[], color: string, altitude: number): GlobeArc[] {
  const arcs: GlobeArc[] = []
  for (let i = 0; i < locations.length - 1; i++) {
    const a = locations[i], b = locations[i + 1]
    if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) continue
    if (a.lat === b.lat && a.lng === b.lng) continue
    arcs.push({ startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng, color, altitude, label: `${a.name} → ${b.name}` })
  }
  return arcs
}

// Dealer arcs: seller → buyer within each GPI record (lower altitude, dimmer, smaller stroke)
const AMBER_ARC = 'rgba(180,130,60,0.55)'
const AMBER_DOT = 'rgba(180,130,60,0.70)'
function buildDealerArcs(records: GettyRecord[]): GlobeArc[] {
  const arcs: GlobeArc[] = []
  const seen = new Set<string>()
  for (const r of records) {
    const seller = cityCoords(r.sellerLocation)
    const buyer = cityCoords(r.buyerLocation)
    if (!seller || !buyer) continue
    if (seller.lat === buyer.lat && seller.lng === buyer.lng) continue
    const key = `${seller.lat},${seller.lng}|${buyer.lat},${buyer.lng}`
    if (seen.has(key)) continue
    seen.add(key)
    const sellerCity = (r.sellerLocation ?? '').split(',')[0].trim()
    const buyerCity = (r.buyerLocation ?? '').split(',')[0].trim()
    arcs.push({
      startLat: seller.lat, startLng: seller.lng,
      endLat: buyer.lat, endLng: buyer.lng,
      color: AMBER_ARC, altitude: 0.12,
      label: `Dealer: ${sellerCity} → ${buyerCity}${r.saleDate ? ` (${r.saleDate.slice(0, 4)})` : ''}`,
    })
  }
  return arcs
}
function tierLabel(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('met') || s.includes('metropolitan')) return 'MET'
  if (s.includes('aic') || s.includes('art institute')) return 'AIC'
  if (s.includes('rijks')) return 'RIJKS'
  if (s.includes('wikidata')) return 'Wikidata'
  if (s.includes('rkd')) return 'RKD'
  if (s.includes('getty') || s.includes('knoedler') || s.includes('gpi') || s.includes('goupil')) return 'GPI'
  return source.toUpperCase().slice(0, 12)
}
function SourceBadge({ source }: { source: string }) {
  const label = tierLabel(source)
  const isGPI = label === 'GPI'
  const isRKD = label === 'RKD'
  return (
    <span style={{
      background: isGPI ? 'rgba(124,92,191,0.12)' : isRKD ? 'rgba(74,122,106,0.12)' : 'rgba(160,120,48,0.10)',
      color: isGPI ? '#9b7fe0' : isRKD ? GAL.sage : GAL.gold,
      border: isGPI ? '1px solid rgba(124,92,191,0.30)' : isRKD ? '1px solid rgba(74,122,106,0.28)' : '1px solid rgba(160,120,48,0.25)',
      borderRadius: 4, padding: '2px 7px', fontSize: '0.625rem', fontFamily: 'var(--font-ui)',
      fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

// ─── Unified timeline ─────────────────────────────────────────────────────────
interface ProvenanceEvent {
  year: string
  sortKey: number
  type: 'dealer' | 'custody' | 'gift' | 'acquisition' | 'exhibition' | 'gap'
  who: string
  where?: string
  detail?: string
  price?: string
  source: string
  sourceUrl?: string
}

function extractYear(date?: string): number {
  if (!date) return 9999
  const m = date.match(/\d{4}/)
  return m ? parseInt(m[0]) : 9999
}

function fmtYear(date?: string): string {
  if (!date) return '?'
  const m = date.match(/(\d{4})/)
  return m ? m[1] : date.slice(0, 10)
}

function buildUnifiedTimeline(
  locations: LocationEntry[],
  exhibitions: LocationEntry[],
  gettyRecords: GettyRecord[],
): ProvenanceEvent[] {
  const events: ProvenanceEvent[] = []

  for (const loc of locations) {
    const nameL = loc.name.toLowerCase()
    const instL = (loc.institution ?? '').toLowerCase()
    const combined = nameL + ' ' + instL
    const type: ProvenanceEvent['type'] =
      (combined.includes('bequest') || combined.includes('gift') || combined.includes('donat')) ? 'gift'
      : (combined.includes('museum') || combined.includes('institute') || combined.includes('gallery') || combined.includes('acqui')) ? 'acquisition'
      : 'custody'
    events.push({
      year: fmtYear(loc.startDate ?? undefined),
      sortKey: extractYear(loc.startDate ?? undefined),
      type,
      who: (loc.institution && loc.institution !== loc.name) ? loc.institution : loc.name,
      where: (loc.institution && loc.institution !== loc.name) ? loc.name : undefined,
      source: tierLabel(loc.source),
    })
  }

  for (const ex of exhibitions.slice(0, 4)) {
    events.push({
      year: fmtYear(ex.startDate ?? undefined),
      sortKey: extractYear(ex.startDate ?? undefined),
      type: 'exhibition',
      who: (ex.institution && ex.institution !== ex.name) ? ex.institution : ex.name,
      where: (ex.institution && ex.institution !== ex.name) ? ex.name : undefined,
      detail: 'Exhibition loan — not a custody change',
      source: tierLabel(ex.source),
    })
  }

  for (const rec of gettyRecords.slice(0, 4)) {
    const dateStr = rec.saleDate ?? rec.entryDate ?? undefined
    const seller = rec.seller ?? ''
    const buyer = rec.buyer ?? ''
    const via = [seller, buyer].filter(Boolean).join(' → ')
    const price = [rec.purchasePrice, rec.salePrice].filter(Boolean).join(' / ') || undefined
    events.push({
      year: fmtYear(dateStr),
      sortKey: extractYear(dateStr),
      type: 'dealer',
      who: buyer || seller || 'Knoedler & Co.',
      where: rec.buyerLocation ?? undefined,
      detail: via || undefined,
      price,
      source: 'GPI',
      sourceUrl: rec.sourceUrl ?? undefined,
    })
  }

  events.sort((a, b) => a.sortKey - b.sortKey)
  return events
}

// ─── Event row style helpers ──────────────────────────────────────────────────
const EV_STYLES: Record<ProvenanceEvent['type'], { icon: string; color: string; bg: string; border: string }> = {
  dealer:      { icon: '→', color: '#7c5cbf', bg: 'rgba(124,92,191,0.07)', border: 'rgba(124,92,191,0.25)' },
  custody:     { icon: '⌂', color: '#a07830', bg: 'rgba(160,120,48,0.06)', border: 'rgba(160,120,48,0.22)' },
  gift:        { icon: '♥', color: '#a07830', bg: 'rgba(160,120,48,0.06)', border: 'rgba(160,120,48,0.22)' },
  acquisition: { icon: '⌂', color: '#4a7a6a', bg: 'rgba(74,122,106,0.07)', border: 'rgba(74,122,106,0.22)' },
  exhibition:  { icon: '↻', color: '#4a7a6a', bg: 'rgba(74,122,106,0.04)', border: 'rgba(74,122,106,0.14)' },
  gap:         { icon: '░', color: '#9a8f85', bg: 'transparent',            border: 'rgba(154,143,133,0.20)' },
}

export default function StoriesApp() {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)

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

  const inStory = !!selected

  // ── Globe init (full-screen background, once) ──────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    let mounted = true
    let onResize: (() => void) | null = null
    ;(async () => {
      const GlobeGL = (await import('globe.gl')).default
      if (!mounted || !containerRef.current) return
      let geo: { features: unknown[] } = { features: [] }
      try { const r = await fetch('/geo/countries-simple.json'); if (r.ok) geo = await r.json() } catch {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globe = (GlobeGL as any)()(containerRef.current) as any
      // Canvas data URL = solid near-black ocean, no Three.js side-effects, no atmosphere glow.
      const oc = document.createElement('canvas'); oc.width = 2; oc.height = 2
      const ox = oc.getContext('2d')!; ox.fillStyle = '#060504'; ox.fillRect(0, 0, 2, 2)
      globe.globeImageUrl(oc.toDataURL()).backgroundColor(OBS.bg).showAtmosphere(false)
      if (geo.features.length) {
        globe.polygonsData(geo.features).polygonCapColor(() => OBS.globeLand)
          .polygonSideColor(() => 'rgba(0,0,0,0)').polygonStrokeColor(() => OBS.globeBorder).polygonAltitude(0.005)
      }
      globe.arcsData([])
        .arcColor((d: any) => d.color ?? OBS.gold)
        .arcAltitude((d: any) => d.altitude ?? 0.18)
        .arcStroke((d: any) => d.altitude <= 0.12 ? 0.35 : 0.6)
        .arcDashLength((d: any) => d.altitude <= 0.12 ? 0.02 : 0.015)
        .arcDashGap((d: any) => d.altitude <= 0.12 ? 0.025 : 0.015)
        .arcDashAnimateTime(10000)
      globe.pointsData([]).pointLat((d: any) => d.lat).pointLng((d: any) => d.lng)
        .pointAltitude(0.006).pointRadius((d: any) => d.r ?? 0.28)
        .pointColor((d: any) => d.color ?? 'rgba(212,168,83,0.8)')
      setTimeout(() => { const c = globe.controls?.(); if (c) { c.autoRotate = true; c.autoRotateSpeed = 0.25; c.enableZoom = true; c.zoomSpeed = 1.2 } }, 100)
      const fit = () => { const el = containerRef.current; if (el) globe.width(el.clientWidth).height(el.clientHeight) }
      fit(); onResize = fit; window.addEventListener('resize', fit)
      globeRef.current = globe
    })()
    return () => { mounted = false; if (onResize) window.removeEventListener('resize', onResize) }
  }, [])

  // ── Arcs + dots + auto-frame on provenance ────────────────────────────────
  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    if (!prov) {
      g.arcsData([]).pointsData([])
      const c = g.controls?.(); if (c) c.autoRotate = true
      return
    }
    // Three arc tiers — custody (gold, 0.18), exhibition loans (sage, 0.30), dealer trails (amber, 0.12)
    const custodyArcs = buildArcs(prov.locations, OBS.gold, 0.18)
    const exhibitionArcs = buildArcs(prov.exhibitions, OBS.sage, 0.30)
    const dealerArcs = buildDealerArcs(prov.gettyRecords ?? [])
    g.arcsData([...custodyArcs, ...exhibitionArcs, ...dealerArcs])

    // City dots — custody (large gold), exhibition (medium sage), GPI endpoints (small amber)
    const custodyDots = prov.locations
      .filter(l => l.lat != null && l.lng != null)
      .map(l => ({ lat: l.lat as number, lng: l.lng as number, r: 0.32, color: 'rgba(212,168,83,0.85)' }))
    const exhibDots = prov.exhibitions
      .filter(l => l.lat != null && l.lng != null)
      .map(l => ({ lat: l.lat as number, lng: l.lng as number, r: 0.22, color: 'rgba(111,141,125,0.75)' }))
    const seenDots = new Set<string>()
    const dealerDots = (prov.gettyRecords ?? []).flatMap(r => {
      const dots: { lat: number; lng: number; r: number; color: string }[] = []
      for (const loc of [r.sellerLocation, r.buyerLocation]) {
        const coords = cityCoords(loc)
        if (!coords) continue
        const key = `${coords.lat},${coords.lng}`
        if (seenDots.has(key)) continue
        seenDots.add(key)
        dots.push({ ...coords, r: 0.20, color: AMBER_DOT })
      }
      return dots
    })
    g.pointsData([...custodyDots, ...exhibDots, ...dealerDots])

    const custodyPts = prov.locations.filter(l => l.lat != null && l.lng != null)
    const dealerPts = [...seenDots].map(k => { const [lat, lng] = k.split(',').map(Number); return { lat, lng } })
    const allPts = [...custodyPts, ...prov.exhibitions.filter(l => l.lat != null && l.lng != null)]
    const framePts = custodyPts.length >= 2 ? custodyPts : allPts.length >= 2 ? allPts : [...custodyPts, ...dealerPts]
    const c = g.controls?.(); if (c) c.autoRotate = framePts.length < 2
    if (framePts.length && typeof g.pointOfView === 'function') {
      const lats = framePts.map(p => p.lat as number), lngs = framePts.map(p => p.lng as number)
      const lat = (Math.min(...lats) + Math.max(...lats)) / 2
      const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2
      const spread = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs))
      g.pointOfView({ lat, lng, altitude: Math.min(2.5, Math.max(0.7, spread / 40)) }, 1200)
    }
  }, [prov])

  // ── Data actions ───────────────────────────────────────────────────────────
  const openWork = useCallback(async (r: SearchResult, heroUrl: string | null, creditLine: string | null) => {
    setSelected(r); setHero(heroUrl); setCredit(creditLine); setProv(null); setLoading(true); setShowInsight(false)
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

  const close = () => { setSelected(null); setProv(null); setHero(null); setCredit(null) }

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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: OBS.bg }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {!inStory && <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,9,8,0.72)' }} />}

      {/* ── LANDING: curated gallery ─────────────────────────────────────────── */}
      {!inStory && (
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 28px 80px' }}>
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
                  search covers only works held by the Met, Art Institute, and Rijksmuseum.
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
              the open APIs of the Metropolitan Museum of Art, the Art Institute of Chicago, the Rijksmuseum, Wikidata,
              and the Getty Research Institute (Knoedler Stock Books, CC0 1.0).
              Images are shown only for public-domain works, credited to their institution. Gaps are shown, never invented.
              <div style={{ marginTop: 10 }}>
                <a href="/team" style={{ color: OBS.textMuted, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                  How this platform works →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STORY: provenance detail (warm gallery panel) ────────────────────── */}
      {inStory && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(460px, 100%)', background: GAL.bg, borderLeft: `1px solid ${GAL.borderMid}`, overflowY: 'auto', boxShadow: '-20px 0 60px rgba(0,0,0,0.4)' }}>
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
                ) : (
                  <div style={{ padding: '16px 18px', background: 'rgba(212,168,83,0.04)', border: `1px solid rgba(212,168,83,0.20)`, borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: '0.9rem', color: GAL.gold }}>✦</span>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GAL.gold }}>Provenance Intelligence</div>
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
                        <p style={{ marginBottom: 10 }}>
                          <strong>Market records:</strong> Getty Provenance Index confirms {prov.gettyRecords.length} dealer transaction{prov.gettyRecords.length !== 1 ? 's' : ''} for this artist in the Knoedler stock books.
                          {prov.gettyRecords[0]?.saleDate ? ` Earliest dated ${prov.gettyRecords[0].saleDate.slice(0,4)}.` : ''}
                          {' '}These pre-museum records document the commercial layer the museum archive typically omits.
                        </p>
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
                      <p style={{ color: prov.hasGap ? '#c8855a' : GAL.sage, marginBottom: 0, fontWeight: 500 }}>
                        {prov.hasGap
                          ? '⚠ Provenance gap detected — one or more custody periods lack documentation. Flag for further research.'
                          : '✓ No obvious title risk signals. Clean custody chain in available records.'}
                      </p>
                    </div>
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid rgba(212,168,83,0.12)`, fontFamily: 'var(--font-ui)', fontSize: '0.62rem', color: GAL.textFaint }}>
                      Derived from institutional records only. Full AI analysis available with Claude API.
                      Not legal advice. Verify with primary sources before professional use.
                    </div>
                  </div>
                )}
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
