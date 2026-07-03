/**
 * Price parsing for Getty GPI ledger strings.
 *
 * The ledgers record prices in mixed currencies — "$7250", "30000 francs",
 * "£1,200", occasionally marks or a bare number. The honesty rule this module
 * exists to enforce: an amount NEVER travels without its currency, and
 * currencies are never converted or mixed on one axis.
 */

import type { ParsedPrice } from './types'

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
