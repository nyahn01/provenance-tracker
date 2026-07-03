/**
 * /insights — the collection-level data surface.
 *
 * Fully static server component (no client islands → no hydration risk). Every
 * number is computed at build time from the committed Getty seeds + featured
 * chains via src/lib/insights.ts — nothing invented, currencies never mixed,
 * every figure carries a source line (ChartFrame enforces it).
 *
 * What this is NOT (said plainly on the page): the full Getty Provenance Index,
 * or a valuation service. It is the seed excerpt this site already ships.
 */
import type { Metadata } from 'next'
import { PageShell, DisplayHeading, Prose, Eyebrow, CTALink } from '@/components/ui'
import { JsonLd } from '@/components/JsonLd'
import { SITE_URL } from '@/lib/site'
import {
  marketActivityByYear,
  topArtistActivity,
  usdMedianByYear,
  arbitragePairs,
  dealerBipartite,
  pipelineFlows,
} from '@/lib/insights'
import { MarketActivityChart } from '@/components/insights/MarketActivityChart'
import { PriceTrajectoryChart } from '@/components/insights/PriceTrajectoryChart'
import { DealerNetworkChart } from '@/components/insights/DealerNetworkChart'
import { PipelineFlowMap } from '@/components/insights/PipelineFlowMap'

export const metadata: Metadata = {
  title: 'Insights — a century of the art market from the dealers’ ledgers',
  description:
    'Collection-level data from the Getty Provenance Index seed and this site’s curated custody chains: market activity 1859–1971, recorded prices, the dealer network, and the Paris–Chicago pipeline. Every figure sourced; currencies never mixed.',
}

export default function InsightsPage() {
  const market = marketActivityByYear()
  const artists = topArtistActivity(6)
  const prices = usdMedianByYear(5)
  const arb = arbitragePairs()
  const network = dealerBipartite(12, 3)
  const pipeline = pipelineFlows()

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: 'Provenance Tracker — art-market insights (Getty GPI seed)',
          description:
            'Collection-level aggregations over the Getty Provenance Index seed (Knoedler + Goupil) and curated custody chains: transactions by year, recorded prices, dealer relationships, and custody flows.',
          url: `${SITE_URL}/insights`,
          license: 'https://creativecommons.org/publicdomain/zero/1.0/',
          creator: { '@type': 'Organization', name: 'Getty Research Institute' },
          isBasedOn: 'https://www.getty.edu/research/tools/provenance/search.html',
          temporalCoverage: '1859/1971',
        }}
      />
      <PageShell width={1100}>
        <Eyebrow>Insights</Eyebrow>
        <DisplayHeading size="hero">A century of the art market, from the dealers&apos; own ledgers</DisplayHeading>
        <Prose maxWidth={680} marginBottom={12}>
          These charts read the Getty Provenance Index seed this site ships &mdash; the Knoedler
          (1872&ndash;1970) and Goupil &amp; Cie (1846&ndash;1919) stock books, {market.dated.toLocaleString('en-US')} dated
          transactions between 1859 and 1971 &mdash; together with the curated custody chains behind the collection.
        </Prose>
        <Prose maxWidth={680} muted marginBottom={48} size="0.85rem">
          It is an <strong>excerpt</strong> of the Getty index, not the full index, and it is not a
          valuation service. Every figure is a count or a recorded price from the ledgers; currencies
          are shown as written and never converted or mixed on one axis.
        </Prose>

        <MarketActivityChart years={market.years} artists={artists} dated={market.dated} undated={market.undated} />
        <PriceTrajectoryChart stats={prices.stats} totalUsdSales={prices.totalUsdSales} arbitrage={arb.pairs} arbitrageTotal={arb.total} />
        <DealerNetworkChart layout={network} />
        <PipelineFlowMap data={pipeline} />

        <div style={{ borderTop: '1px solid var(--obs-border)', paddingTop: 24, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <CTALink href="/" tone="gold">Explore the collection &rarr;</CTALink>
          <CTALink href="/method" size="0.78rem">How the data is prepared &rarr;</CTALink>
          <CTALink href="/case/adele-bloch-bauer-i" size="0.78rem">A documented restitution &rarr;</CTALink>
        </div>
      </PageShell>
    </>
  )
}
