/**
 * PriceTrajectoryChart — median Knoedler USD sale price per year, plus the
 * transatlantic-arbitrage story as a paired-example panel.
 *
 * Honesty spine: ONE currency on the axis (USD, as recorded — no conversion).
 * The franc→dollar markup is shown as verbatim ledger pairs, never as a
 * converted ratio; the two currencies never share a scale. Bucket size (n) is
 * shown so a spike from a single sale can't mislead.
 *
 * Each ledger amount also carries where it sits among its OWN currency's records
 * (issue #228): "385,000 francs" means nothing to a modern reader, "top 10% of
 * 433 recorded franc purchases" does. The rank is comparison WITHOUT conversion —
 * francs rank only against francs, dollars only against dollars, and the
 * population size travels with every rank.
 *
 * Dollar figures also carry an inflation-adjusted reading (issue #241), via the
 * Minneapolis Fed's spliced CPI series (`cpi-data.ts`). Additive only — the
 * as-recorded amount stays primary, francs are never adjusted (no franc CPI
 * series is in the repo), and pre-1913 figures are flagged as resting on a
 * historical reconstruction, not official CPI.
 */
import { MARKETING as C, OBS, accent } from '@/lib/design-tokens'
import type { PriceYearStat, ArbitragePair, PriceRank, InflationAdjustment } from '@/lib/types'
import { rankBand } from '@/lib/prices'
import { CPI_BASE_YEAR, CPI_SOURCE_LABEL } from '@/lib/cpi-data'
import { ChartFrame } from './ChartFrame'

const W = 900, H = 240, PAD_L = 56, PAD_B = 28, PAD_T = 12, PAD_R = 10

const usd = (v: number) => '$' + Math.round(v).toLocaleString('en-US')

/**
 * Where one amount sits among its own currency's ledger records. Renders nothing
 * when the population was too thin to rank honestly, rather than a hedged label.
 */
function RankNote({ rank }: { rank: PriceRank | null }) {
  if (!rank) return null
  const pool = rank.side === 'purchase' ? 'purchases' : 'sales'
  const cur = rank.currency === 'FRF' ? 'franc' : rank.currency === 'USD' ? 'dollar' : rank.currency
  return (
    <span
      title={`${rank.percentile}th percentile of ${rank.n.toLocaleString('en-US')} recorded ${cur} ${pool} in the Knoedler stock books`}
      style={{ fontSize: '0.68rem', color: C.textFaint, whiteSpace: 'nowrap' }}
    >
      {rankBand(rank.percentile)} of {rank.n.toLocaleString('en-US')} {cur} {pool}
    </span>
  )
}

/**
 * A dollar amount restated in present-day purchasing power. Always visible (not
 * hover-only) per #241's "cite the index on screen" requirement — this is a
 * bigger claim than the rank note above, so it gets a persistent line, with the
 * pre-1913 caveat spelled out inline rather than buried in a tooltip.
 */
function AdjustedNote({ adj }: { adj: InflationAdjustment | null }) {
  if (!adj) return null
  return (
    <span
      title={`${CPI_SOURCE_LABEL} (${CPI_BASE_YEAR}=100)`}
      style={{ fontSize: '0.72rem', color: C.textMuted, whiteSpace: 'nowrap' }}
    >
      ≈ {usd(adj.adjustedAmount)} in {adj.toYear} dollars{adj.estimated ? ', pre-1913 estimate' : ''}
    </span>
  )
}

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
  const maxN = Math.max(1, ...stats.map(s => s.n))
  // Sample size is encoded as dot radius (bigger = more sales behind the median),
  // so a spike from a thin year is legible at a glance — the illegible per-year
  // number strip it replaces was the #162 "x axis not legible" complaint. Exact n
  // stays in each point's tooltip.
  const rN = (n: number) => 2.2 + Math.sqrt(n / maxN) * 3.6
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const x = (yr: number) => PAD_L + ((yr - yMin) / span) * plotW
  const y = (v: number) => PAD_T + (1 - v / maxMed) * plotH
  const line = stats.map(s => `${x(s.year).toFixed(1)},${y(s.medianUsd).toFixed(1)}`).join(' ')
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
      note={`Median recorded US-dollar sale price per year, for years with at least five USD sales. Dot size marks how many sales stand behind each year's median. As recorded in the stock books — no currency conversion; pounds and francs are charted nowhere on this axis. Each point's tooltip also shows a rough present-day equivalent, from ${CPI_SOURCE_LABEL} (${CPI_BASE_YEAR}=100). Years before 1913 rest on a historical reconstruction, not official CPI, and any single inflation figure is one estimate among several economists publish — read it as an order of magnitude, not a precise conversion.`}
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
          <circle key={s.year} cx={x(s.year)} cy={y(s.medianUsd)} r={rN(s.n)} fill={OBS.gold} fillOpacity={0.9}>
            <title>{`${s.year}: median ${usd(s.medianUsd)} (n=${s.n} sale${s.n === 1 ? '' : 's'})${s.inflationAdjusted ? ` — ≈ ${usd(s.inflationAdjusted.adjustedAmount)} in ${s.inflationAdjusted.toYear} dollars${s.inflationAdjusted.estimated ? ', pre-1913 estimate' : ''}` : ''}`}</title>
          </circle>
        ))}
        {xTicks.map(t => (
          <text key={t} x={x(t)} y={H - 8} textAnchor="middle" fontFamily="var(--font-ui)" fontSize={10} fill={C.textFaint}>{t}</text>
        ))}
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
            Instead, each amount carries where it sits among that currency&rsquo;s own recorded prices — comparison without an
            exchange rate. The {arbitrage.length} shown are the largest dollar sales, not a representative sample, which is
            why every one of them ranks high. The dollar side also carries a present-day equivalent from {CPI_SOURCE_LABEL}
            ({CPI_BASE_YEAR}=100) — the franc side does not, since no franc CPI series is in the repo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {arbitrage.map((p, i) => (
              <div key={p.piRecordNo ?? i} style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', padding: '10px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: C.text }}>
                    <span style={{ color: accent.dealer }}>{p.purchase}</span>
                    <span style={{ color: C.textFaint }}> → </span>
                    <span style={{ color: OBS.gold }}>{p.sale}</span>
                  </span>
                  {(p.purchaseRank || p.saleRank) && (
                    <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <RankNote rank={p.purchaseRank} />
                      <RankNote rank={p.saleRank} />
                    </span>
                  )}
                  <AdjustedNote adj={p.saleAdjusted} />
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
