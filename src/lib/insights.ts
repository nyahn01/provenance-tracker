/**
 * Collection-level insight aggregation — pure functions over the committed
 * data (Getty GPI seeds via getty.ts, featured chains via featured-chains.ts).
 *
 * Server-only: computed at build time by the static /insights page. There is
 * NO committed derived-data file (one fact, one home — the seeds are the
 * facts; these are views over them).
 *
 * Honesty rules enforced here:
 *  - never invent a datum: every number is a count/median over real records;
 *  - currencies never mix: USD-only series via parsePrice; arbitrage pairs
 *    carry verbatim ledger strings, never converted;
 *  - exclusions are returned, not hidden (undated records, unmapped
 *    transitions, below-threshold links all come back as counts).
 */

import { allGettyRecords } from './getty'
import { getFeaturedChain } from './featured-chains'
import { FEATURED_WORKS } from './featured'
import { parsePrice, percentileRank, MIN_RANK_POPULATION } from './prices'
import type {
  ArbitragePair,
  ArtistActivity,
  BipartiteLayout,
  DealerLink,
  GettyRecord,
  ParsedPrice,
  PipelineCity,
  PipelineData,
  PipelineFlow,
  PriceRank,
  PriceYearStat,
  YearActivity,
} from './types'

const isKnoedler = (r: GettyRecord) => r.sourceLabel.includes('Knoedler')

/** 4-digit year from saleDate, else entryDate, else null. */
export function recordYear(r: GettyRecord): number | null {
  const m = (r.saleDate || r.entryDate || '').match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/)
  return m ? Number(m[1]) : null
}

// ─── Market activity ─────────────────────────────────────────────────────────

export function marketActivityByYear(records: GettyRecord[] = allGettyRecords()): {
  years: YearActivity[]
  dated: number
  undated: number
} {
  const byYear = new Map<number, YearActivity>()
  let dated = 0
  let undated = 0
  for (const r of records) {
    const year = recordYear(r)
    if (year === null) { undated++; continue }
    dated++
    const row = byYear.get(year) ?? { year, sold: 0, unsold: 0, other: 0 }
    const t = (r.transaction ?? '').toLowerCase()
    if (t.includes('sold') && !t.includes('unsold')) row.sold++
    else if (t.includes('unsold')) row.unsold++
    else row.other++
    byYear.set(year, row)
  }
  return { years: [...byYear.values()].sort((a, b) => a.year - b.year), dated, undated }
}

export function topArtistActivity(n = 6, records: GettyRecord[] = allGettyRecords()): ArtistActivity[] {
  const byArtist = new Map<string, GettyRecord[]>()
  for (const r of records) {
    const artist = (r.artist ?? '').trim()
    if (!artist) continue
    const list = byArtist.get(artist) ?? []
    list.push(r)
    byArtist.set(artist, list)
  }
  return [...byArtist.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, n)
    .map(([artist, recs]) => ({
      artist: displayArtist(artist),
      total: recs.length,
      years: marketActivityByYear(recs).years,
    }))
}

/** "MONET, CLAUDE" → "Claude Monet" for display. */
function displayArtist(authority: string): string {
  const [last, first] = authority.split(',').map(s => s.trim())
  if (!first) return titleCaseName(last ?? authority)
  return `${titleCaseName(first)} ${titleCaseName(last)}`
}

function titleCaseName(s: string): string {
  return s.toLowerCase().replace(/(^|[\s\-'])\p{L}/gu, c => c.toUpperCase())
}

// ─── Prices (USD-only, Knoedler) ─────────────────────────────────────────────

export function usdMedianByYear(minN = 5, records: GettyRecord[] = allGettyRecords()): {
  stats: PriceYearStat[]
  totalUsdSales: number
  belowThreshold: number
} {
  const byYear = new Map<number, number[]>()
  let totalUsdSales = 0
  for (const r of records) {
    if (!isKnoedler(r)) continue
    const year = recordYear(r)
    const price = parsePrice(r.salePrice)
    if (year === null || !price || price.currency !== 'USD') continue
    totalUsdSales++
    const list = byYear.get(year) ?? []
    list.push(price.amount)
    byYear.set(year, list)
  }
  const stats: PriceYearStat[] = []
  let belowThreshold = 0
  for (const [year, amounts] of byYear) {
    if (amounts.length < minN) { belowThreshold += amounts.length; continue }
    amounts.sort((a, b) => a - b)
    const mid = Math.floor(amounts.length / 2)
    const medianUsd = amounts.length % 2 ? amounts[mid] : (amounts[mid - 1] + amounts[mid]) / 2
    stats.push({ year, medianUsd, n: amounts.length })
  }
  return { stats: stats.sort((a, b) => a.year - b.year), totalUsdSales, belowThreshold }
}

/**
 * Sorted amounts per currency, split by side, for ranking one amount against its
 * OWN currency's records (issue #228). Purchases and sales are separate pools
 * because they answer different questions: what Knoedler paid versus what it got.
 *
 * Nothing here converts or compares across currencies — that is the whole point.
 */
export function priceRankIndex(records: GettyRecord[] = allGettyRecords()): {
  purchase: Map<string, number[]>
  sale: Map<string, number[]>
} {
  const purchase = new Map<string, number[]>()
  const sale = new Map<string, number[]>()
  for (const r of records) {
    if (!isKnoedler(r)) continue
    for (const [raw, pool] of [[r.purchasePrice, purchase], [r.salePrice, sale]] as const) {
      const p = parsePrice(raw)
      if (!p || p.currency === 'unknown') continue
      const list = pool.get(p.currency) ?? []
      list.push(p.amount)
      pool.set(p.currency, list)
    }
  }
  for (const pool of [purchase, sale]) {
    for (const list of pool.values()) list.sort((a, b) => a - b)
  }
  return { purchase, sale }
}

/**
 * Where one amount sits among its own currency's records, or null when that
 * population is too thin to rank against honestly (see MIN_RANK_POPULATION).
 */
function rankOf(
  index: ReturnType<typeof priceRankIndex>,
  price: ParsedPrice,
  side: 'purchase' | 'sale',
): PriceRank | null {
  if (price.currency === 'unknown') return null
  const pool = index[side].get(price.currency)
  if (!pool || pool.length < MIN_RANK_POPULATION) return null
  const percentile = percentileRank(pool, price.amount)
  if (percentile === null) return null
  return { percentile, n: pool.length, side, currency: price.currency }
}

/** Knoedler records bought in francs and sold in dollars — verbatim, never converted. */
export function arbitragePairs(records: GettyRecord[] = allGettyRecords()): {
  pairs: ArbitragePair[]
  total: number
} {
  const index = priceRankIndex(records)
  const all: ArbitragePair[] = []
  for (const r of records) {
    if (!isKnoedler(r)) continue
    const bought = parsePrice(r.purchasePrice)
    const sold = parsePrice(r.salePrice)
    if (!bought || !sold || bought.currency !== 'FRF' || sold.currency !== 'USD') continue
    all.push({
      piRecordNo: r.piRecordNo,
      title: r.title,
      artist: r.artist ? displayArtist(r.artist) : null,
      year: recordYear(r),
      purchase: (r.purchasePrice ?? '').trim(),
      sale: (r.salePrice ?? '').trim(),
      purchaseRank: rankOf(index, bought, 'purchase'),
      saleRank: rankOf(index, sold, 'sale'),
      sourceUrl: r.sourceUrl,
      sourceLabel: r.sourceLabel,
    })
  }
  // Display sample = largest dollar sales (the clearest ledger stories); total is honest.
  const pairs = [...all]
    .sort((a, b) => (parsePrice(b.sale)?.amount ?? 0) - (parsePrice(a.sale)?.amount ?? 0))
    .slice(0, 8)
  return { pairs, total: all.length }
}

// ─── Dealer network (bipartite, deterministic) ───────────────────────────────

export function dealerBipartite(
  topN = 12,
  minLinkCount = 3,
  records: GettyRecord[] = allGettyRecords(),
): BipartiteLayout {
  const linkCounts = new Map<string, DealerLink>()
  const sellerCounts = new Map<string, number>()
  const buyerCounts = new Map<string, number>()
  for (const r of records) {
    if (!isKnoedler(r)) continue
    const seller = (r.seller ?? '').trim()
    const buyer = (r.buyer ?? '').trim()
    if (seller) sellerCounts.set(seller, (sellerCounts.get(seller) ?? 0) + 1)
    if (buyer) buyerCounts.set(buyer, (buyerCounts.get(buyer) ?? 0) + 1)
    if (!seller || !buyer) continue
    const key = `${seller}→${buyer}`
    const link = linkCounts.get(key) ?? { seller, buyer, count: 0 }
    link.count++
    linkCounts.set(key, link)
  }

  const rank = (counts: Map<string, number>) =>
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])) // deterministic tie-break
      .slice(0, topN)
      .map(([name, count], i, arr) => ({
        name,
        count,
        y: arr.length === 1 ? 0.5 : i / (arr.length - 1),
      }))

  const sellers = rank(sellerCounts)
  const buyers = rank(buyerCounts)
  const sellerSet = new Set(sellers.map(s => s.name))
  const buyerSet = new Set(buyers.map(b => b.name))
  const links = [...linkCounts.values()]
    .filter(l => l.count >= minLinkCount && sellerSet.has(l.seller) && buyerSet.has(l.buyer))
    .sort((a, b) => b.count - a.count || a.seller.localeCompare(b.seller) || a.buyer.localeCompare(b.buyer))

  return {
    sellers,
    buyers,
    links,
    totalSellers: sellerCounts.size,
    totalBuyers: buyerCounts.size,
    minLinkCount,
  }
}

// ─── Featured-collection pipeline (custody transitions) ──────────────────────

export function pipelineFlows(): PipelineData {
  const flowCounts = new Map<string, PipelineFlow>()
  const cityCounts = new Map<string, PipelineCity>()
  let excludedCount = 0
  let totalEntries = 0

  for (const work of FEATURED_WORKS) {
    const chain = getFeaturedChain(work.source, work.id) ?? []
    totalEntries += chain.length
    for (const e of chain) {
      if (e.lat === null || e.lng === null) continue
      const c = cityCounts.get(e.name) ?? { name: e.name, lat: e.lat, lng: e.lng, count: 0 }
      c.count++
      cityCounts.set(e.name, c)
    }
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i]
      const b = chain[i + 1]
      if (a.lat === null || a.lng === null || b.lat === null || b.lng === null) {
        excludedCount++
        continue
      }
      if (a.name === b.name) continue // same-city handoff — a transition, not a move on the map
      const key = `${a.name}→${b.name}`
      const f = flowCounts.get(key) ?? {
        fromName: a.name, toName: b.name,
        fromLat: a.lat, fromLng: a.lng, toLat: b.lat, toLng: b.lng,
        count: 0,
      }
      f.count++
      flowCounts.set(key, f)
    }
  }

  return {
    flows: [...flowCounts.values()].sort((a, b) => b.count - a.count),
    cities: [...cityCounts.values()].sort((a, b) => b.count - a.count),
    excludedCount,
    totalEntries,
    workCount: FEATURED_WORKS.length,
  }
}
