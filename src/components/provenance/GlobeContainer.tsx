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
import { useEffect, useRef, useState } from 'react'
import type { ProvenanceResponse } from '@/lib/types'
import { OBS, state } from '@/lib/design-tokens'
import { buildArcs, buildDealerArcs, buildGapArcs, buildLabels, buildPoints, arcTooltip, landmassTooltip } from './globe-data'

// Read fresh at each write site rather than once at module load — cheap, and
// avoids needing a change listener for a setting that's effectively fixed for
// the lifetime of a page view. Auto-rotate is the only continuous motion this
// component drives; it's outside the GLOBE CONTRACT's locked init block (that
// block governs which Globe.gl/Three.js APIs are called at all, not whether an
// already-mutable control property like autoRotate gets set to true or false).
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface GlobeContainerProps {
  prov: ProvenanceResponse | null
  /** Responsive height of the globe area (e.g. '50%' | '75%' | '100%'). */
  globeHeightPct: string
}

export function GlobeContainer({ prov, globeHeightPct }: GlobeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  // Flips true once the async globe init completes, so the prov effect below re-runs
  // and draws the arcs even when `prov` was already set at mount (the "see on map"
  // reveal case — the landing globe got away with `prov` arriving null→value later).
  const [ready, setReady] = useState(false)

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
          // The features carry their own name ("Europe", "British Isles"). Naming them
          // on hover is the continent cue issue #237 asks for, from data already here.
          .polygonLabel((d: any) => landmassTooltip(d?.properties?.name))
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
        // buildArcs/buildDealerArcs have always set `label`; no accessor ever read it,
        // so hovering an arc showed nothing (issue #237).
        .arcLabel((d: any) => arcTooltip(d.label ?? '', d.kind ?? 'custody'))
      globe.pointsData([]).pointLat((d: any) => d.lat).pointLng((d: any) => d.lng)
        .pointAltitude(0.006).pointRadius((d: any) => d.r ?? 0.28)
        .pointColor((d: any) => d.color ?? 'rgba(212,168,83,0.8)')
        .pointLabel((d: any) => d.tip ?? '')
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
        .labelLabel((d: any) => d.tip ?? '')
      setTimeout(() => { const c = globe.controls?.(); if (c) { c.autoRotate = !prefersReducedMotion(); c.autoRotateSpeed = 0.25; c.enableZoom = true; c.zoomSpeed = 1.2 } }, 100)
      const fit = () => { const el = containerRef.current; if (el) globe.width(el.clientWidth).height(el.clientHeight) }
      fit(); onResize = fit; window.addEventListener('resize', fit)
      globeRef.current = globe
      if (mounted) setReady(true)
    })()
    // Explicit WebGL/Three.js teardown on unmount — this component genuinely
    // unmounts and remounts fresh across the app (landing backdrop <-> the
    // on-demand map reveal never coexist; StoriesApp's comment above calls
    // this out as "freeing the WebGL context" for the other usage). Globe.gl
    // exposes _destructor() for exactly this (disposes the renderer, stops
    // its render loop, removes its canvas) — best practice for a component
    // that mounts/unmounts repeatedly, not just a one-time page load; without
    // it, disposal depended on GC eventually reclaiming the WebGL context,
    // and browsers cap how many can be live at once.
    return () => {
      mounted = false
      if (onResize) window.removeEventListener('resize', onResize)
      globeRef.current?._destructor?.()
      globeRef.current = null
    }
  }, [])

  // ── Arcs + dots + auto-frame on provenance ────────────────────────────────
  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    if (!prov) {
      g.arcsData([]).pointsData([]).labelsData([])
      const c = g.controls?.(); if (c) c.autoRotate = !prefersReducedMotion()
      return
    }
    // Four arc tiers — custody (gold, 0.18), exhibition loans (sage, 0.30), dealer
    // trails (amber, 0.12), and resolvable gaps (state.gap, 0.24 — broken/un-animated,
    // issue #124). Gaps with no coordinates are never drawn here (see GlobeGapBadge).
    const custodyArcs = buildArcs(prov.locations, OBS.gold, 0.18)
    const exhibitionArcs = buildArcs(prov.exhibitions, OBS.sage, 0.30, 'loan')
    const dealerArcs = buildDealerArcs(prov.gettyRecords ?? [])
    const gapArcs = buildGapArcs(prov.locations, prov.gaps, state.gap)
    g.arcsData([...custodyArcs, ...exhibitionArcs, ...dealerArcs, ...gapArcs])

    // City dots — custody (large gold), exhibition (medium sage), GPI endpoints (small
    // amber). Each dot carries the tooltip it shows on hover (issue #237); the tier
    // split and the dealer-city dedup are unchanged, just moved into globe-data.ts
    // so the tooltip text is a pure function that can be tested.
    const points = buildPoints(prov.locations, prov.exhibitions, prov.gettyRecords ?? [])
    g.pointsData(points)

    // City labels (issue #52) — deduplicated across all three tiers; null-coord nodes excluded
    // Label color uses OBS.text at reduced opacity so it reads against the dark globe surface
    // without competing with the arc/dot colors. Hovering a label shows the same card as
    // hovering its dot, matched by coordinate.
    // First-seen wins, matching buildLabels' own custody > loan > dealer priority: the
    // label shows the first holder at that coordinate, so its tooltip must be that same
    // holder. A plain `new Map(...)` would let the LAST duplicate win and pair a city's
    // label with a different owner's card.
    const tipAt = new Map<string, string>()
    for (const pt of points) {
      const key = `${pt.lat.toFixed(4)},${pt.lng.toFixed(4)}`
      if (!tipAt.has(key)) tipAt.set(key, pt.tip)
    }
    const labels = buildLabels(prov.locations, prov.exhibitions, prov.gettyRecords ?? [], 'rgba(246,241,232,0.80)')
      .map(l => ({ ...l, tip: tipAt.get(`${l.lat.toFixed(4)},${l.lng.toFixed(4)}`) ?? '' }))
    g.labelsData(labels)

    const custodyPts = prov.locations.filter(l => l.lat != null && l.lng != null)
    const dealerPts = points.filter(pt => pt.tier === 'dealer').map(pt => ({ lat: pt.lat, lng: pt.lng }))
    const allPts = [...custodyPts, ...prov.exhibitions.filter(l => l.lat != null && l.lng != null)]
    const framePts = custodyPts.length >= 2 ? custodyPts : allPts.length >= 2 ? allPts : [...custodyPts, ...dealerPts]
    const c = g.controls?.(); if (c) c.autoRotate = framePts.length < 2 && !prefersReducedMotion()
    if (framePts.length && typeof g.pointOfView === 'function') {
      const lats = framePts.map(p => p.lat as number), lngs = framePts.map(p => p.lng as number)
      const lat = (Math.min(...lats) + Math.max(...lats)) / 2
      const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2
      const spread = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs))
      g.pointOfView({ lat, lng, altitude: Math.min(2.5, Math.max(0.7, spread / 40)) }, 1200)
    }
  }, [prov, ready])

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
