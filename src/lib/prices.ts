/**
 * Price parsing for Getty GPI ledger strings.
 *
 * The ledgers record prices in mixed currencies — "$7250", "30000 francs",
 * "£1,200", occasionally marks or a bare number. The honesty rule this module
 * exists to enforce: an amount NEVER travels without its currency, and
 * currencies are never converted or mixed on one axis.
 */

import type { InflationAdjustment, ParsedPrice } from './types'
import { CPI_ANNUAL_INDEX, CPI_ESTIMATE_CUTOFF_YEAR, CPI_PRESENT_YEAR } from './cpi-data'

export function parsePrice(raw: string | null | undefined): ParsedPrice | null {
  if (!raw) return null
  const s = String(raw).trim()
  const numMatch = s.replace(/,/g, '').match(/\d+(?:\.\d+)?/)
  if (!numMatch) return null
  const amount = Number(numMatch[0])
  if (!Number.isFinite(amount) || amount <= 0) return null

  const currency: ParsedPrice['currency'] = s.includes('$')
    ? 'USD'
    : s.includes('£')
      ? 'GBP'
      : /franc/i.test(s)
        ? 'FRF'
        : /mark/i.test(s)
          ? 'DEM'
          : 'unknown'

  return { amount, currency }
}

// ─── Ranking within one currency (issue #228) ────────────────────────────────

/**
 * Smallest population worth ranking against. Below this a percentile says more
 * about the sample than about the sale, so we show nothing instead. The Knoedler
 * seed has one recorded mark purchase; "top 100% of 1" is noise dressed as a fact.
 */
export const MIN_RANK_POPULATION = 30

/**
 * Percentile of `amount` within `sortedAscending`, as the share of the
 * population at or below it. Pure; the caller sorts once and reuses.
 *
 * Ties count as "at or below", so the largest recorded amount is 100 and an
 * amount below every record is 0. Returns null for an empty population.
 */
export function percentileRank(sortedAscending: number[], amount: number): number | null {
  const n = sortedAscending.length
  if (!n) return null
  // Binary search for the first index strictly greater than `amount`; that index
  // is the count at or below it.
  let lo = 0, hi = n
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sortedAscending[mid] <= amount) lo = mid + 1
    else hi = mid
  }
  return Math.round((lo / n) * 100)
}

/**
 * Plain-language band for a percentile. Deliberately coarse: ledger prices carry
 * their own recording noise, so "top quarter" is a claim the data supports where
 * "81st percentile" implies a precision it does not.
 */
export function rankBand(percentile: number): string {
  if (percentile >= 90) return 'top 10%'
  if (percentile >= 75) return 'top quarter'
  if (percentile > 50) return 'above the median'
  if (percentile === 50) return 'at the median'
  if (percentile >= 25) return 'below the median'
  return 'bottom quarter'
}

// ─── Inflation adjustment, USD only (issue #241) ────────────────────────────

/**
 * Restates a USD amount from `fromYear` in CPI_PRESENT_YEAR dollars, using the
 * Minneapolis Fed's spliced CPI series (`cpi-data.ts`). Additive only — never
 * a replacement for the as-recorded amount. Returns null rather than guessing
 * when `fromYear` falls outside the series (there is no franc or pound series
 * in the repo, so this is never called for those currencies).
 */
export function inflationAdjustUsd(amount: number, fromYear: number): InflationAdjustment | null {
  const fromIndex = CPI_ANNUAL_INDEX[fromYear]
  const toIndex = CPI_ANNUAL_INDEX[CPI_PRESENT_YEAR]
  if (!fromIndex || !toIndex) return null
  return {
    fromYear,
    toYear: CPI_PRESENT_YEAR,
    adjustedAmount: amount * (toIndex / fromIndex),
    estimated: fromYear < CPI_ESTIMATE_CUTOFF_YEAR,
  }
}
