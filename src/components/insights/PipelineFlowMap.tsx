/**
 * PipelineFlowMap — the featured collection as one weighted flow map.
 *
 * A schematic equirectangular SVG (linear lon→x / lat→y) over the coarse
 * 33-polygon basemap the globe already ships. It aggregates all 53 committed
 * custody entries from the 8 featured works into one image: the Europe→Chicago
 * pipeline the collection actually is. Static, no globe init touched (this is a
 * separate 2D surface). Every line is a dated, sourced custody transition;
 * transitions without coordinates are counted in the caption, never drawn.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { MARKETING as C, OBS } from '@/lib/design-tokens'
import type { PipelineData } from '@/lib/types'
import { ChartFrame } from './ChartFrame'

// Atlantic window framing Europe + eastern US (where the collection lives).
const LON_MIN = -95, LON_MAX = 30, LAT_MIN = 35, LAT_MAX = 62
const W = 900, H = 420

interface GeoFeature { geometry: { type: string; coordinates: number[][][] | number[][][][] } }

function loadBasemap(): GeoFeature[] {
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'geo', 'countries-simple.json'), 'utf8')
    return (JSON.parse(raw).features ?? []) as GeoFeature[]
  } catch {
    return []
  }
}

const projX = (lon: number) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W
const projY = (lat: number) => ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H

function ringToPath(ring: number[][]): string {
  return ring.map((c, i) => `${i === 0 ? 'M' : 'L'} ${projX(c[0]).toFixed(1)} ${projY(c[1]).toFixed(1)}`).join(' ') + ' Z'
}

export function PipelineFlowMap({ data }: { data: PipelineData }) {
  const features = loadBasemap()
  const maxFlow = Math.max(1, ...data.flows.map(f => f.count))
  const maxCity = Math.max(1, ...data.cities.map(c => c.count))
  const empty = data.flows.length === 0

  const polys: string[] = []
  for (const f of features) {
    if (f.geometry.type === 'Polygon') {
      polys.push(ringToPath((f.geometry.coordinates as number[][][])[0]))
    } else if (f.geometry.type === 'MultiPolygon') {
      for (const poly of f.geometry.coordinates as number[][][][]) polys.push(ringToPath(poly[0]))
    }
  }

  return (
    <ChartFrame
      eyebrow="The collection as one journey"
      title="The Paris → Chicago pipeline"
      sourceLabel="Featured custody chains (Art Institute of Chicago provenance records)"
      empty={empty}
      emptyNote="No mapped custody transitions in the featured chains."
      id="pipeline"
      note={`${data.workCount} featured works, ${data.totalEntries} documented custody entries. Every line is a dated, sourced custody transition between two mapped cities; line weight is the number of works that made that move.${data.excludedCount > 0 ? ` ${data.excludedCount} transition${data.excludedCount === 1 ? '' : 's'} without coordinates in the source are not drawn.` : ''} Schematic basemap — deliberately coarse, no borders claimed.`}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label="Schematic flow map of the featured collection's custody transitions across the Atlantic, from European cities to Chicago"
        style={{ display: 'block', minWidth: 620, width: '100%', height: 'auto', background: OBS.bg, borderRadius: 10 }}>
        {/* basemap */}
        {polys.map((d, i) => (
          <path key={i} d={d} fill={OBS.globeLand} fillOpacity={0.18} stroke={OBS.globeBorder} strokeOpacity={0.25} strokeWidth={0.5} />
        ))}
        {/* flow arcs (curved up) */}
        {data.flows.map((f, i) => {
          const x1 = projX(f.fromLng), y1 = projY(f.fromLat), x2 = projX(f.toLng), y2 = projY(f.toLat)
          const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.18 - 12
          const sw = 0.8 + (f.count / maxFlow) * 4
          return (
            <path key={i} d={`M ${x1} ${y1} Q ${mx} ${my}, ${x2} ${y2}`} fill="none"
              stroke={OBS.gold} strokeWidth={sw} strokeOpacity={0.55} strokeLinecap="round">
              <title>{`${f.fromName} → ${f.toName}: ${f.count} work${f.count === 1 ? '' : 's'}`}</title>
            </path>
          )
        })}
        {/* city dots + labels */}
        {data.cities.map(c => {
          const cx = projX(c.lng), cy = projY(c.lat)
          const r = 2.5 + (c.count / maxCity) * 6
          return (
            <g key={c.name}>
              <circle cx={cx} cy={cy} r={r} fill={OBS.clay} fillOpacity={0.9} />
              <text x={cx + r + 3} y={cy + 3} fontFamily="var(--font-ui)" fontSize={10} fill={OBS.text}>
                {c.name} <tspan fill={OBS.textFaint}>{c.count}</tspan>
              </text>
            </g>
          )
        })}
      </svg>
    </ChartFrame>
  )
}
