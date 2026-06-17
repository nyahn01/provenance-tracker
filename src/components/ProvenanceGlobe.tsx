'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const GlobeGL = dynamic(
  () => import('globe.gl').then(m => m.default),
  { ssr: false }
)

const TOP_MUSEUMS = [
  { id: 'louvre', name: 'Louvre', city: 'Paris', country: 'France', lat: 48.8606, lng: 2.3376, focus: 'Ancient & Renaissance', count: 38000 },
  { id: 'met', name: 'The Met', city: 'New York', country: 'USA', lat: 40.7794, lng: -73.9632, focus: 'Global / All Eras', count: 490000 },
  { id: 'national-gallery', name: 'National Gallery', city: 'London', country: 'UK', lat: 51.5089, lng: -0.1283, focus: 'Western European', count: 2300 },
  { id: 'uffizi', name: 'Uffizi', city: 'Florence', country: 'Italy', lat: 43.7678, lng: 11.2553, focus: 'Italian Renaissance', count: 20000 },
  { id: 'rijksmuseum', name: 'Rijksmuseum', city: 'Amsterdam', country: 'Netherlands', lat: 52.3600, lng: 4.8852, focus: 'Dutch Golden Age', count: 8000 },
  { id: 'prado', name: 'Prado', city: 'Madrid', country: 'Spain', lat: 40.4138, lng: -3.6922, focus: 'Spanish & Flemish', count: 8200 },
  { id: 'hermitage', name: 'Hermitage', city: 'St Petersburg', country: 'Russia', lat: 59.9398, lng: 30.3146, focus: 'Imperial European', count: 3000000 },
  { id: 'smithsonian', name: 'Smithsonian', city: 'Washington DC', country: 'USA', lat: 38.8913, lng: -77.0261, focus: 'American & Global', count: 154000 },
  { id: 'aic', name: 'Art Institute', city: 'Chicago', country: 'USA', lat: 41.8796, lng: -87.6237, focus: 'Impressionism', count: 300000 },
  { id: 'taipei', name: 'National Palace', city: 'Taipei', country: 'Taiwan', lat: 25.1024, lng: 121.5489, focus: 'Chinese Imperial', count: 700000 },
]

const GUERNICA_JOURNEY = [
  {
    startLat: 40.7614,
    startLng: -73.9776,
    endLat: 40.4138,
    endLng: -3.6922,
    label: 'Guernica',
    detail: 'MoMA 1939 → Prado 1981',
    color: '#c87855',
  },
]

export default function ProvenanceGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const [selectedMuseum, setSelectedMuseum] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let globe: any = null

    const initGlobe = async () => {
      const GlobeGL = (await import('globe.gl')).default
      globe = GlobeGL()
        .globeImageUrl(null)
        .backgroundColor('#0a0908')
        .showAtmosphere(true)
        .atmosphereColor('#c87855')
        .atmosphereAltitude(0.12)(containerRef.current!)

      // Add museum pins
      const pinMarkers = TOP_MUSEUMS.map(museum => {
        const el = document.createElement('div')
        el.className = 'museum-pin'
        el.innerHTML = `
          <div class="relative w-5 h-5 cursor-pointer group">
            <div class="absolute inset-0 bg-[#d4a853] rounded-full"></div>
            <div class="absolute inset-0 rounded-full pulse-ring bg-[#d4a853]"></div>
            <div class="absolute left-6 top-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-[rgba(10,9,8,0.95)] px-3 py-1 rounded text-xs text-[#f6f1e8] border border-[#2a2218] pointer-events-none">
              ${museum.name}
            </div>
          </div>
        `
        el.onclick = () => setSelectedMuseum(museum.id)
        return { ...museum, el }
      })

      globe.htmlElementsData(pinMarkers).htmlElement(d => (d as any).el)

      // Add arcs
      globe.arcsData(GUERNICA_JOURNEY)
        .arcColor(() => '#c87855')
        .arcAltitude(0.3)
        .arcDashLength(0.4)
        .arcDashGap(0.4)
        .arcDashAnimateTime(4000)

      globeRef.current = { globe }
    }

    initGlobe()

    return () => {
      if (globeRef.current) {
        globeRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Globe container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Left sidebar */}
      <div className="absolute left-0 top-0 w-80 h-full bg-[rgba(10,9,8,0.85)] border-r border-[#2a2218] backdrop-blur-md p-6 overflow-y-auto float-in">
        <div className="text-xs uppercase tracking-widest text-[#c87855] font-semibold mb-2">
          Provenance
        </div>
        <h1 className="text-3xl font-bold text-[#f6f1e8] mb-1">Tracker</h1>
        <p className="text-sm text-[#9a8f85] mb-8">Where art has been</p>

        <div className="space-y-3">
          {TOP_MUSEUMS.map(museum => (
            <button
              key={museum.id}
              onClick={() => setSelectedMuseum(museum.id)}
              className={`block w-full text-left p-3 rounded border transition-colors ${
                selectedMuseum === museum.id
                  ? 'bg-[#c87855] bg-opacity-20 border-[#c87855]'
                  : 'bg-transparent border-[#2a2218] hover:border-[#c87855]'
              }`}
            >
              <div className="font-semibold text-[#f6f1e8]">{museum.name}</div>
              <div className="text-xs text-[#9a8f85]">
                {museum.city}, {museum.country}
              </div>
              <div className="text-xs text-[#9a8f85] mt-1">{museum.focus}</div>
              <div className="text-xs text-[#c87855] mt-1">
                {(museum.count / 1000).toFixed(0)}k artworks
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-[rgba(10,9,8,0.85)] border-t border-[#2a2218] backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="text-sm text-[#9a8f85]">
          10 museums · 4.8M artworks tracked
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#9a8f85]">Search any painting</span>
          <input
            type="text"
            placeholder="e.g. Starry Night"
            className="bg-[#1c1612] border border-[#2a2218] rounded px-3 py-1.5 text-sm text-[#f6f1e8] placeholder-[#9a8f85] focus:outline-none focus:border-[#c87855]"
          />
          <span className="text-[#c87855]">→</span>
        </div>
      </div>
    </div>
  )
}
