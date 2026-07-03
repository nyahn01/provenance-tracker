/**
 * PriceTrajectoryChart — median Knoedler USD sale price per year, plus the
 * transatlantic-arbitrage story as a paired-example panel.
 *
 * Honesty spine: ONE currency on the axis (USD, as recorded — no conversion,
 * no inflation adjustment). The franc→dollar markup is shown as verbatim
 * ledger pairs, never as a converted ratio; the two currencies never share a
 * scale. Bucket size (n) is shown so a spike from a single sale can't mislead.
 */
import { MARKETING as C, OBS, accent } from '@/lib/design-tokens'
import type { PriceYearStat, ArbitragePair } from '@/lib/types'
import { ChartFrame } from './ChartFrame'

const W = 900, H = 240, PAD_L = 56, PAD_B = 28, PAD_T = 12, PAD_R = 10

export function PriceTrajectoryChart({
  stats,
  totalUsdSales,
  arbitrage,
  arbitrageTotal,
}: {
  stats: PriceYearStat[]
  totalUsdSales: number
  arbitrage: ArbitragePair[]
  arbitrageTotal: number
}) {
  const empty = stats.length < 2
  const yMin = stats.length ? stats[0].year : 1872
  const yMax = stats.length ? stats[stats.length - 1].year : 1970
  const span = Math.max(1, yMax - yMin)
  const maxMed = Math.max(1, ...stats.map(s => s.medianUsd))
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const x = (yr: number) => PAD_L + ((yr - yMin) / span) * plotW
  const y = (v: number) => PAD_T + (1 - v / maxMed) * plotH
  const line = stats.map(s => `${x(s.year).toFixed(1)},${y(s.medianUsd).toFixed(1)}`).join(' ')
  const usd = (v: number) => '$' + Math.round(v).toLocaleString('en-US')
  const yTicks = [0, maxMed / 2, maxMed]
  const xTicks = [yMin, Math.round((yMin + yMax) / 2), yMax]

  return (
    <ChartFrame
      eyebrow="Prices"
      title="What the market paid, in the dollars the ledger recorded"
      sourceLabel="Getty GPI — Knoedler Stock Books (1872–1970), CC0 1.0"
      n={totalUsdSales}
      empty={empty}
      emptyNote="Fewer than two years clear the minimum sample size for an honest median."
      id="prices"
      note="Median recorded US-dollar sale price per year, for years with at least five USD sales. As recorded in the stock books — no inflation adjustment and no currency conversion. Pounds and francs are charted nowhere on this axis."
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Line chart of median Knoedler US-dollar sale price per year from ${yMin} to ${yMax}`}
        style={{ display: 'block', minWidth: 620, width: '100%', height: 'auto' }}>
        {yTicks.map((t, i) => {
          const yy = y(t)
          return (
            <g key={i}>
              <line x1={PAD_L} y1={yy} x2={W - PAD_R} y2={yy} stroke={C.border} strokeWidth={1} />
              <text x={PAD_L - 6} y={yy + 3} textAnchor="end" fontFamily="var(--font-ui)" fontSize={9} fill={C.textFaint}>{usd(t)}</text>
            </g>
          )
        })}
        <polyline points={line} fill="none" stroke={OBS.gold} strokeWidth={1.75} strokeLinejoin="round" />
        {stats.map(s => (
          <circle key={s.year} cx={x(s.year)} cy={y(s.medianUsd)} r={2.5} fill={OBS.gold}>
            <title>{`${s.year}: median ${usd(s.medianUsd)} (n=${s.n})`}</title>
          </circle>
        ))}
        {/* sample-size strip */}
        {stats.map(s => (
          <text key={`n-${s.year}`} x={x(s.year)} y={H - 16} textAnchor="middle" fontFamily="var(--font-ui)" fontSize={7} fill={C.textFaint}>{s.n}</text>
        ))}
        {xTicks.map(t => (
          <text key={t} x={x(t)} y={H - 4} textAnchor="middle" fontFamily="var(--font-ui)" fontSize={10} fill={C.textFaint}>{t}</text>
        ))}
        <text x={PAD_L} y={H - 16} textAnchor="end" fontFamily="var(--font-ui)" fontSize={7} fill={C.textFaint}>n =</text>
      </svg>

      {/* Arbitrage — paired ledger examples, currencies kept apart */}
      {arbitrage.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 8 }}>
            Bought in francs, sold in dollars
          </div>
          <p style={{ fontSize: '0.82rem', color: C.textMuted, lineHeight: 1.6, marginBottom: 14, maxWidth: 640 }}>
            {arbitrageTotal.toLocaleString('en-US')} Knoedler records were bought in Paris in francs and sold in New York
            in dollars. The stock books record both prices; we show them side by side and never convert between currencies.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {arbitrage.map((p, i) => (
              <div key={p.piRecordNo ?? i} style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', padding: '10px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: C.text }}>
                  <span style={{ color: accent.dealer }}>{p.purchase}</span>
                  <span style={{ color: C.textFaint }}> → </span>
                  <span style={{ color: OBS.gold }}>{p.sale}</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: C.textMuted, flex: 1, minWidth: 0 }}>
                  {p.artist ? `${p.artist}` : 'Unattributed'}{p.year ? ` · ${p.year}` : ''}{p.title ? ` · ${p.title}` : ''}
                </span>
                {p.sourceUrl && (
                  <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: C.textFaint, textDecoration: 'none', borderBottom: `1px solid ${C.border}` }}>record ↗</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartFrame>
  )
}
