/**
 * Download and seed Getty Provenance Index — Goupil & Cie Records CSV
 * Filters to Impressionist/modern artists that match the featured works.
 * Output: public/data/getty-goupil.json
 *
 * Run: node scripts/seed-goupil.mjs
 * Source: CC0 1.0 Public Domain — Getty Research Institute
 * CSV: https://jpgt-or-prd-provenance-index-csv.s3.us-west-2.amazonaws.com/goupil/goupil.csv
 */

import { createWriteStream, createReadStream, existsSync } from 'fs'
import { writeFile, mkdir } from 'fs/promises'
import { createInterface } from 'readline'
import { pipeline } from 'stream/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')
const CSV_PATH = join(ROOT, 'tmp', 'goupil.csv')
const OUT_PATH = join(ROOT, 'public', 'data', 'getty-goupil.json')
const CSV_URL = 'https://jpgt-or-prd-provenance-index-csv.s3.us-west-2.amazonaws.com/goupil/goupil.csv'

const TARGET_ARTISTS = [
  'SEURAT', 'VAN GOGH', 'CAILLEBOTTE', 'MONET', 'CEZANNE', 'CÉZANNE',
  'RENOIR', 'DEGAS', 'PISSARRO', 'MANET', 'GAUGUIN', 'TOULOUSE-LAUTREC',
  'SISLEY', 'BOUDIN', 'BAZILLE', 'CASSATT', 'FANTIN-LATOUR',
  'COURBET', 'COROT', 'MILLET', 'SIGNAC', 'CROSS', 'LUCE',
  'BONNARD', 'VUILLARD', 'MATISSE', 'PICASSO', 'BRAQUE', 'UTRILLO',
]

function parseCSVLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

function makeDate(year, month, day) {
  if (!year) return null
  const parts = [year]
  if (month) parts.push(String(month).padStart(2, '0'))
  if (day) parts.push(String(day).padStart(2, '0'))
  return parts.join('-')
}

function priceStr(amount, currency) {
  if (!amount) return null
  const cur = (currency || '').toLowerCase()
  if (cur.includes('franc')) return `${amount} francs`
  if (cur.includes('pound')) return `£${amount}`
  if (cur.includes('dollar') || cur === 'usd') return `$${amount}`
  if (cur.includes('guilder') || cur.includes('florin')) return `${amount} guilders`
  return `${amount}${currency ? ' ' + currency : ''}`
}

async function downloadCSV() {
  if (existsSync(CSV_PATH)) { console.log('  CSV already cached at', CSV_PATH); return }
  await mkdir(join(ROOT, 'tmp'), { recursive: true })
  console.log('  Downloading Goupil & Cie CSV…')
  const res = await fetch(CSV_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching CSV`)
  await pipeline(res.body, createWriteStream(CSV_PATH))
  console.log('  Download complete.')
}

async function processCSV() {
  const rl = createInterface({ input: createReadStream(CSV_PATH, 'utf8'), crlfDelay: Infinity })
  let headers = null
  let idx = {}
  const records = []
  let lineNum = 0

  for await (const line of rl) {
    lineNum++
    const fields = parseCSVLine(line)
    if (lineNum === 1) {
      headers = fields
      headers.forEach((h, i) => { idx[h] = i })
      console.log(`  Headers (${headers.length}): ${headers.slice(0, 8).join(' | ')} …`)
      continue
    }

    // Try multiple artist column names — Goupil CSV may differ from Knoedler
    const authorityRaw =
      fields[idx['Art. Authority 1']] ||
      fields[idx['Artist Authority']] ||
      fields[idx['Artist Name 1']] ||
      fields[idx['Artist']] ||
      ''
    const authority = authorityRaw.toUpperCase()
    const lastName = authority.split(',')[0].trim()
    if (!TARGET_ARTISTS.some(a => lastName === a)) continue

    // Date columns — Goupil uses transaction dates
    const entryYear = fields[idx['Entry Date-Year']] || fields[idx['Goupil Book Date-Year']] || fields[idx['Transaction Year']] || ''
    const saleYear = fields[idx['Sale Date-Year']] || fields[idx['Departure Date-Year']] || ''

    const rec = {
      piRecordNo: fields[idx['PI Record No.']] || fields[idx['Goupil Stock No.']] || null,
      artist: authorityRaw || null,
      title: fields[idx['Title']] || fields[idx['Work Title']] || null,
      entryDate: makeDate(
        entryYear,
        fields[idx['Entry Date-Month']] || fields[idx['Goupil Book Date-Month']] || '',
        fields[idx['Entry Date-Day']] || fields[idx['Goupil Book Date-Day']] || ''
      ),
      saleDate: makeDate(
        saleYear,
        fields[idx['Sale Date-Month']] || fields[idx['Departure Date-Month']] || '',
        fields[idx['Sale Date-Day']] || fields[idx['Departure Date-Day']] || ''
      ),
      seller: fields[idx['Seller Name 1']] || fields[idx['Seller']] || null,
      sellerLocation: fields[idx['Seller Loc 1']] || null,
      buyer: fields[idx['Buyer Name 1']] || fields[idx['Buyer']] || null,
      buyerLocation: fields[idx['Buyer Loc 1']] || null,
      purchasePrice: priceStr(
        fields[idx['Purch. Amount']] || fields[idx['Purchase Amount']] || '',
        fields[idx['Purch. Currency']] || fields[idx['Purchase Currency']] || ''
      ),
      salePrice: priceStr(
        fields[idx['Price Amount']] || fields[idx['Sale Amount']] || '',
        fields[idx['Price Currency']] || fields[idx['Sale Currency']] || ''
      ),
      transaction: fields[idx['Transaction']] || null,
      notes: fields[idx['Verbatim Notes']] || fields[idx['Notes']] || null,
      sourceUrl: fields[idx['Rosetta Handle']] ? `https://hdl.handle.net/${fields[idx['Rosetta Handle']]}` : null,
      sourceLabel: 'Getty GPI — Goupil & Cie (1846–1919)',
    }

    if (rec.artist && (rec.entryDate || rec.saleDate)) {
      records.push(rec)
    }
  }

  return records
}

async function main() {
  console.log('\n=== Getty Goupil & Cie Seed Script ===\n')
  await downloadCSV()
  console.log('  Parsing and filtering CSV…')
  const records = await processCSV()
  console.log(`  Filtered to ${records.length} Impressionist/modern records`)

  if (records.length === 0) {
    console.log('\n  WARNING: 0 records found. Inspect CSV headers above — column names may differ.')
    console.log('  The script tries multiple column name variants. Check tmp/goupil.csv manually.')
  }

  await mkdir(join(ROOT, 'public', 'data'), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(records, null, 2), 'utf8')
  console.log(`  Written to ${OUT_PATH}`)

  const byArtist = {}
  for (const r of records) {
    const a = (r.artist || 'Unknown').split(',')[0]
    byArtist[a] = (byArtist[a] || 0) + 1
  }
  const sorted = Object.entries(byArtist).sort((a, b) => b[1] - a[1])
  console.log('\n  Records by artist:')
  sorted.slice(0, 20).forEach(([a, n]) => console.log(`    ${a.padEnd(30)} ${n}`))
  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) })
