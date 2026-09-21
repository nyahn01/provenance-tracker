/**
 * Chart components must render without NaN on real data and degrade honestly
 * (an empty note, never a broken axis) on thin/empty data. Server-rendered to
 * static markup — the same path the static /insights page uses.
 */
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarketActivityChart } from '../src/components/insights/MarketActivityChart'
import { PriceTrajectoryChart } from '../src/components/insights/PriceTrajectoryChart'
import { DealerNetworkChart } from '../src/components/insights/DealerNetworkChart'
import {
  marketActivityByYear,
  topArtistActivity,
  usdMedianByYear,
  arbitragePairs,
  dealerBipartite,
} from '../src/lib/insights'

describe('charts render on real data without NaN', () => {
  it('MarketActivityChart', () => {
    const m = marketActivityByYear()
    const html = renderToStaticMarkup(
      <MarketActivityChart years={m.years} artists={topArtistActivity(6)} dated={m.dated} undated={m.undated} />,
    )
    expect(html).not.toContain('NaN')
    expect(html).toContain('Getty GPI')
    expect(html).toContain('Sold')
  })

  it('PriceTrajectoryChart', () => {
    const p = usdMedianByYear(5)
    const a = arbitragePairs()
    const html = renderToStaticMarkup(
      <PriceTrajectoryChart stats={p.stats} totalUsdSales={p.totalUsdSales} arbitrage={a.pairs} arbitrageTotal={a.total} />,
    )
    expect(html).not.toContain('NaN')
    expect(html).toContain('Getty GPI')
    // francs and dollars both appear as verbatim strings, but never on the axis
    expect(html).toContain('never convert')
  })

  it('DealerNetworkChart', () => {
    const html = renderToStaticMarkup(<DealerNetworkChart layout={dealerBipartite(12, 3)} />)
    expect(html).not.toContain('NaN')
    expect(html).toContain('Reid &amp; Lefevre')
  })
})

describe('honest degradation on empty data', () => {
  it('MarketActivityChart renders an empty note, not a broken chart', () => {
    const html = renderToStaticMarkup(<MarketActivityChart years={[]} artists={[]} dated={0} undated={0} />)
    expect(html).not.toContain('NaN')
    expect(html.toLowerCase()).toContain('no dated transactions')
  })

  it('PriceTrajectoryChart with one point degrades to the empty note', () => {
    const html = renderToStaticMarkup(
      <PriceTrajectoryChart stats={[{ year: 1900, medianUsd: 5000, n: 9, inflationAdjusted: null }]} totalUsdSales={9} arbitrage={[]} arbitrageTotal={0} />,
    )
    expect(html).not.toContain('NaN')
    expect(html.toLowerCase()).toContain('minimum sample')
  })

  it('DealerNetworkChart with no links renders the empty note', () => {
    const html = renderToStaticMarkup(
      <DealerNetworkChart layout={{ sellers: [], buyers: [], links: [], totalSellers: 0, totalBuyers: 0, minLinkCount: 3 }} />,
    )
    expect(html).not.toContain('NaN')
    expect(html.toLowerCase()).toContain('threshold')
  })
})
