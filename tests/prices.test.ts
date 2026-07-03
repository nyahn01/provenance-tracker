import { describe, it, expect } from 'vitest'
import { parsePrice } from '../src/lib/prices'

describe('parsePrice (the currency-honesty engine)', () => {
  it('parses the four ledger forms with their currency', () => {
    expect(parsePrice('$7,250')).toEqual({ amount: 7250, currency: 'USD' })
    expect(parsePrice('30000 francs')).toEqual({ amount: 30000, currency: 'FRF' })
    expect(parsePrice('£1,200')).toEqual({ amount: 1200, currency: 'GBP' })
    expect(parsePrice('500 marks')).toEqual({ amount: 500, currency: 'DEM' })
  })

  it('a bare number is an unknown currency, never assumed', () => {
    expect(parsePrice('1500')).toEqual({ amount: 1500, currency: 'unknown' })
  })

  it('non-prices return null', () => {
    expect(parsePrice(null)).toBeNull()
    expect(parsePrice(undefined)).toBeNull()
    expect(parsePrice('sold')).toBeNull()
    expect(parsePrice('')).toBeNull()
    expect(parsePrice('$0')).toBeNull()
  })
})
