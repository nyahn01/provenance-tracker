/**
 * PriceSparkline — inline SVG price trajectory from Getty GPI records.
 * Renders only when ≥2 records have parseable prices. Extracted verbatim
 * from StoriesApp.tsx (no visual change).
 */
import type { GettyRecord } from '@/lib/types'
import { GAL } from '@/lib/design-tokens'

export function PriceSparkline({ records }: { records: GettyRecord[] }) {
  type Pt = { yr: number; p: number }
  const pts: Pt[] = records.flatMap(r => {
    const yr = parseInt((r.saleDate ?? r.entryDate ?? '').slice(0, 4), 10)
    const raw = r.salePrice ?? r.purchasePrice
    const p = raw ? parseFloat(raw.replace(/[^0-9.]/g, '')) : NaN
    return (yr > 1800 && !isNaN(p) && p > 0) ? [{ yr, p }] : []
  }).sort((a, b) => a.yr - b.yr)
  if (pts.length < 2) return null
  const W = 140, H = 36, PAD = 4
  const xMin = pts[0].yr, xMax = pts[pts.length - 1].yr
  const pMin = Math.min(...pts.map(p => p.p)), pMax = Math.max(...pts.map(p => p.p))
  const px = (yr: number) => PAD + ((yr - xMin) / Math.max(1, xMax - xMin)) * (W - PAD * 2)
  const py = (p: number) => PAD + (1 - (p - pMin) / Math.max(1, pMax - pMin)) * (H - PAD * 2)
  const polyPoints = pts.map(p => `${px(p.yr).toFixed(1)},${py(p.p).toFixed(1)}`).join(' ')
  return (
    <div style={{ marginTop: 6, marginBottom: 10 }}>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
        <polyline points={polyPoints} fill="none" stroke={GAL.clay} strokeWidth={1.5} strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={px(p.yr)} cy={py(p.p)} r={2.5} fill={GAL.clay} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: GAL.textFaint, width: W }}>
        <span>{xMin}</span>
        <span>GPI price trajectory</span>
        <span>{xMax}</span>
      </div>
    </div>
  )
}
