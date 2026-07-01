'use client'

/**
 * GlobeContainer — the full-screen 3D globe (globe.gl) plus the arcs/dots/auto-
 * frame behaviour driven by the selected work's provenance.
 *
 * ⚠️  GLOBE CONTRACT (root CLAUDE.md) — this init pattern broke twice before
 *     and is locked. Do NOT: enable atmosphere, set atmosphereColor, traverse
 *     the Three.js scene, set material.shininess, or disable zoom. The ocean is
 *     a 2×2 #060504 canvas data-URL (NOT a token) on purpose. Both effects below
 *     were moved verbatim from StoriesApp.tsx; they communicate only through the
 *     two refs, so this is a closed, side-effect-free boundary.
 */
import { useEffect, useRef } from 'react'
import type { ProvenanceResponse } from '@/lib/types'
import { OBS, state } from '@/lib/design-tokens'
import { buildArcs, buildDealerArcs, buildGapArcs, buildLabels, cityCoords, AMBER_DOT } from './globe-data'

interface GlobeContainerProps {
  prov: ProvenanceResponse | null
  /** Responsive height of the globe area (e.g. '50%' | '75%' | '100%'). */
  globeHeightPct: string
}

export function GlobeContainer({ prov, globeHeightPct }: GlobeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)

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
      // Solid-color canvas texture for the ocean — avoids touching Three.js internals
      // (scene.traverse caused z-fighting / black noise artifacts when zooming).
      const oceanCanvas = document.createElement('canvas')
      oceanCanvas.width = 2; oceanCanvas.height = 2
      const octx = oceanCanvas.getContext('2d')!
      octx.fillStyle = '#060504'
      octx.fillRect(0, 0, 2, 2)
      globe.globeImageUrl(oceanCanvas.toDataURL()).backgroundColor(OBS.bg).showAtmosphere(false)
      if (geo.features.length) {
        globe.polygonsData(geo.features).polygonCapColor(() => OBS.globeLand)
          .polygonSideColor(() => 'rgba(0,0,0,0)').polygonStrokeColor(() => OBS.globeBorder).polygonAltitude(0.005)
      }
      // Stroke/dash/opacity read per-datum off each arc object (built in globe-data.ts's
      // buildArcs/buildGapArcs) — confidence-honest arcs + the gap tier (issue #124)
      // only change what these accessors READ, never the accessor calls themselves.
      globe.arcsData([])
        .arcColor((d: any) => d.color ?? OBS.gold)
        .arcAltitude((d: any) => d.altitude ?? 0.18)
        .arcStroke((d: any) => d.stroke ?? (d.altitude <= 0.12 ? 0.35 : 0.6))
        .arcDashLength((d: any) => d.dashLength ?? (d.altitude <= 0.12 ? 0.02 : 0.015))
        .arcDashGap((d: any) => d.dashGap ?? (d.altitude <= 0.12 ? 0.025 : 0.015))
        .arcDashAnimateTime((d: any) => d.dashAnimateTime ?? 10000)
      globe.pointsData([]).pointLat((d: any) => d.lat).pointLng((d: any) => d.lng)
        .pointAltitude(0.006).pointRadius((d: any) => d.r ?? 0.28)
        .pointColor((d: any) => d.color ?? 'rgba(212,168,83,0.8)')
      // Labels layer (issue #52) — additive data layer, no init settings changed
      globe.labelsData([])
        .labelLat((d: any) => d.lat)
        .labelLng((d: any) => d.lng)
        .labelText((d: any) => d.text)
        .labelSize((d: any) => d.size ?? 0.45)
        .labelColor((d: any) => d.color)
        .labelAltitude(0.012)
        .labelIncludeDot(false)
        .labelsTransitionDuration(600)
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
      g.arcsData([]).pointsData([]).labelsData([])
      const c = g.controls?.(); if (c) c.autoRotate = true
      return
    }
    // Four arc tiers — custody (gold, 0.18), exhibition loans (sage, 0.30), dealer
    // trails (amber, 0.12), and resolvable gaps (state.gap, 0.24 — broken/un-animated,
    // issue #124). Gaps with no coordinates are never drawn here (see GlobeGapBadge).
    const custodyArcs = buildArcs(prov.locations, OBS.gold, 0.18)
    const exhibitionArcs = buildArcs(prov.exhibitions, OBS.sage, 0.30)
    const dealerArcs = buildDealerArcs(prov.gettyRecords ?? [])
    const gapArcs = buildGapArcs(prov.locations, prov.gaps, state.gap)
    g.arcsData([...custodyArcs, ...exhibitionArcs, ...dealerArcs, ...gapArcs])

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

    // City labels (issue #52) — deduplicated across all three tiers; null-coord nodes excluded
    // Label color uses OBS.text at reduced opacity so it reads against the dark globe surface
    // without competing with the arc/dot colors.
    const labels = buildLabels(prov.locations, prov.exhibitions, prov.gettyRecords ?? [], 'rgba(246,241,232,0.80)')
    g.labelsData(labels)

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

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={
        prov
          ? "Interactive globe plotting this artwork's ownership and loan locations. The full chain is listed as text in the provenance panel."
          : 'Interactive globe. Select a work to plot its ownership and loan locations; the full chain is listed as text in the provenance panel.'
      }
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: globeHeightPct }}
    />
  )
}
