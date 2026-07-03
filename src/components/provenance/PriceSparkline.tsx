/**
 * PriceSparkline — inline SVG price trajectory from Getty GPI records.
 *
 * Currency-aware (honesty fix): the ledgers mix "$7250" with "30000 francs",
 * and plotting them on one axis was a silent lie. Points are grouped by
 * currency via parsePrice; only the dominant single-currency series renders
 * (tie → USD), the currency is named in the footer and aria-label, and fewer
 * than 2 same-currency points renders nothing at all.
 */
import type { GettyRecord, ParsedPrice } from '@/lib/types'
import { parsePrice } from '@/lib/prices'
import { GAL } from '@/lib/design-tokens'

const CURRENCY_LABEL: Record<ParsedPrice['currency'], string> = {
  USD: 'US dollars', GBP: 'pounds sterling', FRF: 'francs', DEM: 'marks', unknown: 'unlabeled currency',
}

export function PriceSparkline({ records }: { records: GettyRecord[] }) {
  type Pt = { yr: number; p: number; raw: string; currency: ParsedPrice['currency'] }
  const all: Pt[] = records.flatMap(r => {
    const yr = parseInt((r.saleDate ?? r.entryDate ?? '').slice(0, 4), 10)
    const raw = r.salePrice ?? r.purchasePrice
    const parsed = parsePrice(raw)
    return yr > 1800 && parsed ? [{ yr, p: parsed.amount, raw: (raw ?? '').trim(), currency: parsed.currency }] : []
  })

  // One currency per axis, always. Dominant series wins; ties prefer USD.
  const byCurrency = new Map<ParsedPrice['currency'], Pt[]>()
  for (const pt of all) {
    const list = byCurrency.get(pt.currency) ?? []
    list.push(pt)
    byCurrency.set(pt.currency, list)
  }
  const series = [...byCurrency.entries()]
    .filter(([c]) => c !== 'unknown')
    .sort((a, b) => b[1].length - a[1].length || (a[0] === 'USD' ? -1 : b[0] === 'USD' ? 1 : 0))[0]
  if (!series || series[1].length < 2) return null
  const [currency, ptsUnsorted] = series
  const pts = [...ptsUnsorted].sort((a, b) => a.yr - b.yr)

  const W = 140, H = 36, PAD = 4
  const xMin = pts[0].yr, xMax = pts[pts.length - 1].yr
  const pMin = Math.min(...pts.map(p => p.p)), pMax = Math.max(...pts.map(p => p.p))
  const px = (yr: number) => PAD + ((yr - xMin) / Math.max(1, xMax - xMin)) * (W - PAD * 2)
  const py = (p: number) => PAD + (1 - (p - pMin) / Math.max(1, pMax - pMin)) * (H - PAD * 2)
  const polyPoints = pts.map(p => `${px(p.yr).toFixed(1)},${py(p.p).toFixed(1)}`).join(' ')
  return (
    <div style={{ marginTop: 6, marginBottom: 10 }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Getty Provenance Index dealer price trajectory in ${CURRENCY_LABEL[currency]}, ${xMin} to ${xMax}, lowest ${pts.find(p => p.p === pMin)?.raw}, highest ${pts.find(p => p.p === pMax)?.raw}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <polyline points={polyPoints} fill="none" stroke={GAL.clay} strokeWidth={1.5} strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={px(p.yr)} cy={py(p.p)} r={2.5} fill={GAL.clay}>
            <title>{`${p.yr}: ${p.raw}`}</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: GAL.textFaint, width: W }}>
        <span>{xMin}</span>
        <span>GPI price trajectory ({CURRENCY_LABEL[currency]})</span>
        <span>{xMax}</span>
      </div>
    </div>
  )
}
