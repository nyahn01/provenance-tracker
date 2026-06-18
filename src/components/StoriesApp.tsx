'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SearchResult, ProvenanceResponse, LocationEntry } from '@/lib/types'
import { FEATURED_WORKS, aicImage, type FeaturedWork } from '@/lib/featured'

// ─── Design tokens ────────────────────────────────────────────────────────────
const OBS = {
  bg: '#0a0908', surface: '#131110', border: '#2a2218', borderMid: '#3d3228',
  text: '#f6f1e8', textMuted: '#9a8f85', textFaint: '#5c5449',
  clay: '#c87855', gold: '#d4a853', sage: '#6f8d7d',
  globeOcean: '#111010', globeLand: '#1c1612', globeBorder: '#2a2218',
} as const
const GAL = {
  bg: '#f7f4ee', surface: '#ffffff', surface2: '#ede9e2', border: '#d8d2c8', borderMid: '#b8afa3',
  text: '#1a1714', textMuted: '#6b6460', textFaint: '#9e9790',
  clay: '#b06840', sage: '#4a6b5e', gold: '#a07830',
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────
interface GlobeArc { startLat: number; startLng: number; endLat: number; endLng: number; color: string; label: string }
function buildArcs(locations: LocationEntry[]): GlobeArc[] {
  const arcs: GlobeArc[] = []
  for (let i = 0; i < locations.length - 1; i++) {
    const a = locations[i], b = locations[i + 1]
    if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) continue
    if (a.lat === b.lat && a.lng === b.lng) continue
    arcs.push({ startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng, color: OBS.clay, label: `${a.name} → ${b.name}` })
  }
  return arcs
}
function tierLabel(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('met') || s.includes('metropolitan')) return 'MET'
  if (s.includes('aic') || s.includes('art institute')) return 'AIC'
  if (s.includes('rijks')) return 'RIJKS'
  if (s.includes('wikidata')) return 'Wikidata'
  return source.toUpperCase().slice(0, 12)
}
function SourceBadge({ source }: { source: string }) {
  return (
    <span style={{
      background: 'rgba(160,120,48,0.10)', color: GAL.gold, border: '1px solid rgba(160,120,48,0.25)',
      borderRadius: 4, padding: '2px 7px', fontSize: '0.625rem', fontFamily: 'var(--font-ui)',
      fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{tierLabel(source)}</span>
  )
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
      globe.globeImageUrl(null).backgroundColor(OBS.bg).showAtmosphere(true).atmosphereColor(OBS.clay).atmosphereAltitude(0.16)
      if (geo.features.length) {
        globe.polygonsData(geo.features).polygonCapColor(() => OBS.globeLand)
          .polygonSideColor(() => 'rgba(0,0,0,0)').polygonStrokeColor(() => OBS.globeBorder).polygonAltitude(0.005)
      }
      globe.arcsData([]).arcColor((d: any) => d.color ?? OBS.clay).arcAltitude(0.28)
        .arcDashLength(0.4).arcDashGap(0.25).arcDashAnimateTime(3500).arcStroke(1.1)
      setTimeout(() => { const c = globe.controls?.(); if (c) { c.autoRotate = true; c.autoRotateSpeed = 0.25; c.enableZoom = false } }, 100)
      const fit = () => { const el = containerRef.current; if (el) globe.width(el.clientWidth).height(el.clientHeight) }
      fit(); onResize = fit; window.addEventListener('resize', fit)
      globeRef.current = globe
    })()
    return () => { mounted = false; if (onResize) window.removeEventListener('resize', onResize) }
  }, [])

  // ── Arcs + auto-frame on provenance ────────────────────────────────────────
  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    if (!prov) { g.arcsData([]); const c = g.controls?.(); if (c) c.autoRotate = true; return }
    const arcs = buildArcs(prov.locations)
    g.arcsData(arcs)
    const pts = prov.locations.filter(l => l.lat != null && l.lng != null)
    const c = g.controls?.(); if (c) c.autoRotate = pts.length < 2
    if (pts.length && typeof g.pointOfView === 'function') {
      const lats = pts.map(p => p.lat as number), lngs = pts.map(p => p.lng as number)
      const lat = (Math.min(...lats) + Math.max(...lats)) / 2
      const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2
      const spread = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs))
      g.pointOfView({ lat, lng, altitude: Math.min(2.5, Math.max(0.7, spread / 40)) }, 1200)
    }
  }, [prov])

  // ── Data actions ───────────────────────────────────────────────────────────
  const openWork = useCallback(async (r: SearchResult, heroUrl: string | null, creditLine: string | null) => {
    setSelected(r); setHero(heroUrl); setCredit(creditLine); setProv(null); setLoading(true)
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

  // Uncurated search results: show provenance, but NO image (rights unknown — legal safety).
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
      {/* Globe background */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Dim scrim on the landing so the gallery reads clearly */}
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

            {/* Gallery grid */}
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

            {/* Explore more (honest search) */}
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
                  Nothing in our sources for “{query}”. This demo focuses on a curated set —
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

            {/* Footer: data & rights */}
            <div style={{ marginTop: 64, borderTop: `1px solid ${OBS.border}`, paddingTop: 20, fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: OBS.textFaint, lineHeight: 1.6, maxWidth: 720 }}>
              <strong style={{ color: OBS.textMuted, fontWeight: 600 }}>Data &amp; rights.</strong> Provenance and exhibition facts come from
              the open APIs of the Metropolitan Museum of Art, the Art Institute of Chicago, the Rijksmuseum, and Wikidata.
              Images are shown only for public-domain works, credited to their institution. Gaps are shown, never invented.
            </div>
          </div>
        </div>
      )}

      {/* ── STORY: provenance detail (warm gallery panel) ────────────────────── */}
      {inStory && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(460px, 100%)', background: GAL.bg, borderLeft: `1px solid ${GAL.borderMid}`, overflowY: 'auto', boxShadow: '-20px 0 60px rgba(0,0,0,0.4)' }}>
          {/* Back */}
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
              {/* Custody timeline */}
              <div style={{ padding: '18px 24px 0' }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GAL.textFaint, marginBottom: 18 }}>
                  Provenance · chain of custody
                </div>

                {prov.locations.length === 0 ? (
                  <div style={{ border: `1px dashed ${GAL.borderMid}`, borderRadius: 8, padding: 16, fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: GAL.textMuted, lineHeight: 1.5 }}>
                    {prov.gaps[0]?.note ?? 'No documented chain of custody found. Help complete the record.'}
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 6, bottom: 6, left: 6, width: 1, background: GAL.borderMid }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                      {prov.locations.map((loc, i) => (
                        <div key={i} style={{ paddingLeft: 28, position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 0, top: 3, width: 13, height: 13, borderRadius: '50%', background: GAL.surface, border: `2px solid ${GAL.clay}`, boxShadow: `0 0 0 2px ${GAL.bg}` }} />
                          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', color: GAL.textFaint, marginBottom: 3 }}>{loc.startDate ?? '?'}{loc.endDate ? ` – ${loc.endDate}` : ''}</div>
                          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: '0.875rem', color: GAL.text, marginBottom: 6 }}>{loc.name}</div>
                          <SourceBadge source={loc.source} />
                        </div>
                      ))}
                      {prov.hasGap && (
                        <div style={{ paddingLeft: 28, position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 0, top: 3, width: 13, height: 13, borderRadius: '50%', background: GAL.surface, border: `2px dashed ${GAL.borderMid}`, boxShadow: `0 0 0 2px ${GAL.bg}` }} />
                          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: GAL.textMuted, lineHeight: 1.5 }}>{prov.gaps[0]?.note}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Exhibition history (loans — separate) */}
              {prov.exhibitions.length > 0 && (
                <div style={{ padding: '26px 24px 0' }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GAL.textFaint, marginBottom: 6 }}>Exhibition history</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: GAL.textMuted, marginBottom: 12, lineHeight: 1.4 }}>
                    {prov.exhibitions.length} loans — shown here and returned. Not changes of custody.
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {prov.exhibitions.map((ex, i) => (
                      <span key={i} style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: GAL.textMuted, background: GAL.surface2, border: `1px solid ${GAL.border}`, borderRadius: 4, padding: '3px 8px' }}>
                        {ex.name}{ex.startDate ? ` ${ex.startDate}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
