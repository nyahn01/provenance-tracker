/**
 * MarketActivityChart — Getty transactions per year 1859–1971, split by
 * recorded outcome, plus a small-multiples row for the most-traded artists.
 *
 * Fully static (no client island): pure counts over the committed seeds, zero
 * invented data. Outcome colors are labeled in the legend — never color-alone.
 * Sold = gold (the market working), Unsold = the gapWeave neutral (an absence,
 * deliberately NOT a data hue), Exchanged/other = sage.
 */
import { MARKETING as C, OBS } from '@/lib/design-tokens'
import type { YearActivity, ArtistActivity } from '@/lib/types'
import { ChartFrame } from './ChartFrame'

const SOLD = OBS.gold
const UNSOLD = OBS.gapWeave
const OTHER = OBS.sage

const W = 900, H = 260, PAD_L = 40, PAD_B = 28, PAD_T = 12, PAD_R = 8

export function MarketActivityChart({
  years,
  artists,
  dated,
  undated,
}: {
  years: YearActivity[]
  artists: ArtistActivity[]
  dated: number
  undated: number
}) {
  const empty = years.length === 0
  const yMin = years.length ? years[0].year : 1859
  const yMax = years.length ? years[years.length - 1].year : 1971
  const maxTotal = Math.max(1, ...years.map(y => y.sold + y.unsold + y.other))
  const span = Math.max(1, yMax - yMin)
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const barW = Math.max(1.5, (plotW / (span + 1)) * 0.8)
  const x = (yr: number) => PAD_L + ((yr - yMin) / span) * plotW
  const h = (v: number) => (v / maxTotal) * plotH

  const ticks = [yMin, Math.round((yMin + yMax) / 2), yMax]
  const yTicks = [0, Math.round(maxTotal / 2), maxTotal]

  return (
    <ChartFrame
      eyebrow="Market activity"
      title="A century of transactions, from the dealers' ledgers"
      sourceLabel="Getty GPI — Knoedler Stock Books (1872–1970) + Goupil & Cie (1846–1919), CC0 1.0"
      n={dated}
      empty={empty}
      emptyNote="No dated transactions to chart."
      id="market-activity"
      note={
        <>
          <LegendRow /> {undated > 0 && <>· {undated} record{undated === 1 ? '' : 's'} without a parseable year are excluded, not distributed.</>}
        </>
      }
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Stacked bar chart of Getty dealer transactions per year from ${yMin} to ${yMax}, split into sold, unsold, and other outcomes`}
        style={{ display: 'block', minWidth: 620, width: '100%', height: 'auto' }}>
        {/* y gridlines + labels */}
        {yTicks.map(t => {
          const yy = PAD_T + plotH - h(t)
          return (
            <g key={t}>
              <line x1={PAD_L} y1={yy} x2={W - PAD_R} y2={yy} stroke={C.border} strokeWidth={1} />
              <text x={PAD_L - 6} y={yy + 3} textAnchor="end" fontFamily="var(--font-ui)" fontSize={9} fill={C.textFaint}>{t}</text>
            </g>
          )
        })}
        {/* bars */}
        {years.map(y => {
          const cx = x(y.year)
          const bx = cx - barW / 2
          const hSold = h(y.sold), hUnsold = h(y.unsold), hOther = h(y.other)
          let top = PAD_T + plotH
          const segs: React.ReactNode[] = []
          for (const [v, fill, key] of [[hOther, OTHER, 'o'], [hUnsold, UNSOLD, 'u'], [hSold, SOLD, 's']] as [number, string, string][]) {
            if (v <= 0) continue
            top -= v
            segs.push(<rect key={key} x={bx} y={top} width={barW} height={v} fill={fill} />)
          }
          return <g key={y.year}>{segs}</g>
        })}
        {/* x labels */}
        {ticks.map(t => (
          <text key={t} x={x(t)} y={H - 8} textAnchor="middle" fontFamily="var(--font-ui)" fontSize={10} fill={C.textFaint}>{t}</text>
        ))}
      </svg>

      {/* Small multiples — the most-traded artists */}
      {artists.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 12 }}>
            The most-traded artists
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
            {artists.map(a => (
              <ArtistSpark key={a.artist} artist={a} yMin={yMin} yMax={yMax} />
            ))}
          </div>
        </div>
      )}
    </ChartFrame>
  )
}

function LegendRow() {
  const item = (fill: string, label: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 16 }}>
      <i style={{ width: 10, height: 10, borderRadius: 2, background: fill, display: 'inline-block' }} /> {label}
    </span>
  )
  return (
    <span style={{ fontSize: '0.76rem', color: C.textMuted }}>
      {item(SOLD, 'Sold')}{item(UNSOLD, 'Unsold')}{item(OTHER, 'Exchanged / other')}
    </span>
  )
}

function ArtistSpark({ artist, yMin, yMax }: { artist: ArtistActivity; yMin: number; yMax: number }) {
  const w = 140, hgt = 40, pad = 3
  const span = Math.max(1, yMax - yMin)
  const max = Math.max(1, ...artist.years.map(y => y.sold + y.unsold + y.other))
  const pts = artist.years.map(y => {
    const total = y.sold + y.unsold + y.other
    const px = pad + ((y.year - yMin) / span) * (w - pad * 2)
    const py = pad + (1 - total / max) * (hgt - pad * 2)
    return `${px.toFixed(1)},${py.toFixed(1)}`
  }).join(' ')
  return (
    <div>
      <svg width={w} height={hgt} viewBox={`0 0 ${w} ${hgt}`} role="img"
        aria-label={`${artist.artist}: ${artist.total} transactions`} style={{ display: 'block', width: '100%', height: 'auto' }}>
        {artist.years.length >= 2
          ? <polyline points={pts} fill="none" stroke={OBS.gold} strokeWidth={1.5} strokeLinejoin="round" />
          : artist.years.map((y, i) => <circle key={i} cx={pad + ((y.year - yMin) / span) * (w - pad * 2)} cy={hgt / 2} r={2} fill={OBS.gold} />)}
      </svg>
      <div style={{ fontSize: '0.72rem', color: C.text, marginTop: 3 }}>{artist.artist}</div>
      <div style={{ fontSize: '0.66rem', color: C.textFaint }}>{artist.total} transactions</div>
    </div>
  )
}
