/**
 * Promotion helper — turns ONE human-approved curation draft into the
 * committed artifacts (ADR 0003 stage 5; issue #147).
 *
 * Promotion is a HUMAN decision (ADR 0002): this script refuses to run without
 * an existing reviewed draft AND an explicit --approve acknowledgment. It is
 * invoked per work, never in batch — curate.mjs --batch only writes drafts.
 *
 * What it does mechanically (pure data only):
 *   1. re-validates the draft chain (validateChain — the Stage-5 gate)
 *   2. inserts the chain into src/lib/featured-provenance.json
 *   3. validates + copies the hero image into public/works/<slug>.jpg
 *   4. regenerates metrics/latest.json
 * What it deliberately does NOT do (hand-curated TS files are pasted, not
 * regex-edited — the featured-invariants test catches a forgotten paste):
 *   - edit src/lib/featured.ts            → prints a ready-to-paste FeaturedWork
 *   - edit scripts/preparse-provenance.mjs → prints the registry line
 *
 * Usage:
 *   node scripts/promote-work.mjs aic:<id> --slug <slug> --hook "<one-liner>" \
 *     --image <path-to-downloaded-jpg> --approve "<your name>" \
 *     [--year <display-year>] [--image-id <aic-iiif-id>] [--force]
 *
 * The image must be a PUBLIC-DOMAIN file you downloaded yourself (Wikimedia
 * Commons — the one manual step; museum-flagged public domain only).
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { validateChain, geocode } from './curate.mjs'
import { validateImageBuffer } from './lib/image-magic.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')
const DRAFTS = join(ROOT, 'vault', 'agents', 'drafts')
const PROVENANCE_JSON = join(ROOT, 'src', 'lib', 'featured-provenance.json')
const FEATURED_TS = join(ROOT, 'src', 'lib', 'featured.ts')

function argValue(args, flag) {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null
}

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

function main() {
  const args = process.argv.slice(2)
  const ref = args.find(a => !a.startsWith('--'))
  const id = (ref || '').replace(/^aic:/, '')
  if (!/^\d+$/.test(id)) fail(`bad work ref "${ref}" — expected aic:<numeric id>`)

  // ── 1. A reviewed draft + explicit human approval are non-negotiable ───────
  const chainPath = join(DRAFTS, `aic-${id}.chain.json`)
  if (!existsSync(chainPath)) {
    fail(`no draft at ${chainPath.replace(ROOT, '.')} — run \`npm run curate aic:${id}\` and review the draft essay first. Promotion is a human decision (ADR 0002).`)
  }
  const approve = argValue(args, '--approve')
  if (!approve) {
    console.error(`Draft found. Read the essay in ${DRAFTS.replace(ROOT, '.')}/aic-${id}-*.md, then re-run with --approve "<your name>" to confirm a human reviewed it.`)
    process.exit(1)
  }

  const slug = argValue(args, '--slug')
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) fail('--slug required: lowercase letters/digits/hyphens (e.g. "the-poppy-field")')
  const hook = argValue(args, '--hook')
  if (!hook || hook.trim().length < 10) fail('--hook required: the one-line story shown in the gallery (≥10 chars)')
  const imageSrc = argValue(args, '--image')
  if (!imageSrc) fail('--image required: path to the public-domain JPEG you downloaded (Wikimedia Commons)')
  const force = args.includes('--force')

  // ── 2. Gate the draft chain ─────────────────────────────────────────────────
  const draft = JSON.parse(readFileSync(chainPath, 'utf8'))
  const chain = draft[`aic:${id}`]
  const gate = validateChain(chain)
  for (const w of gate.warnings) console.log(`  ⚠ ${w}`)
  if (!gate.ok) {
    for (const e of gate.errors) console.error(`  ✗ ${e}`)
    fail('draft chain fails the Stage-5 gate — fix the draft (or the gazetteer) before promoting')
  }
  console.log(`✓ gate: ${gate.stats.entries} entries, ${gate.stats.mapped} mapped, ${gate.stats.datedStart} dated`)

  // ── 3. Slug and key collisions ──────────────────────────────────────────────
  const featuredTs = readFileSync(FEATURED_TS, 'utf8')
  const existingSlugs = [...featuredTs.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1])
  if (existingSlugs.includes(slug)) fail(`slug "${slug}" already exists in featured.ts`)
  const all = JSON.parse(readFileSync(PROVENANCE_JSON, 'utf8'))
  if (all[`aic:${id}`] && !force) fail(`aic:${id} already in featured-provenance.json (use --force to overwrite)`)

  // ── 4. Image: validate then copy (never trust a download blindly) ───────────
  if (!existsSync(imageSrc)) fail(`image not found: ${imageSrc}`)
  const buf = readFileSync(imageSrc)
  const img = validateImageBuffer(buf)
  if (!img.ok) fail(`image rejected: ${img.why}`)
  const imageDest = join(ROOT, 'public', 'works', `${slug}.jpg`)
  copyFileSync(imageSrc, imageDest)
  console.log(`✓ image: ${img.why} → public/works/${slug}.jpg (public-domain, Wikimedia-sourced — the one manual step)`)

  // ── 5. Insert the chain (pure data — the only committed file this edits) ───
  all[`aic:${id}`] = chain
  writeFileSync(PROVENANCE_JSON, JSON.stringify(all, null, 2) + '\n', 'utf8')
  console.log(`✓ chain: aic:${id} inserted into src/lib/featured-provenance.json (approved by ${approve})`)

  // ── 6. Emit the two paste-snippets ──────────────────────────────────────────
  const firstDated = chain.find(e => e.startDate)
  const creationYear = argValue(args, '--year') ?? firstDated?.startDate ?? 'TODO'
  const draftEssays = `${DRAFTS.replace(ROOT, '.')}/aic-${id}-*.md`
  const title = 'TODO — title from the draft essay'
  const artist = 'TODO — artist from the draft essay'
  console.log(`
── paste into src/lib/featured.ts (FEATURED_WORKS) ─────────────────────────────
  {
    // <one-line curation rationale — why this work earned featuring>
    source: 'aic', id: '${id}', slug: '${slug}',
    title: '${title}',
    artist: '${artist}', year: '${creationYear}',
    hook: '${hook.replace(/'/g, "\\'")}',
    imageId: '${argValue(args, '--image-id') ?? 'TODO-from-aic-api'}', localSrc: '/works/${slug}.jpg', credit: AIC_CREDIT,
  },

── paste into scripts/preparse-provenance.mjs (FEATURED) ────────────────────────
  { id: '${id}', title: '${title}', artist: '${artist}', creationYear: ${/^\d{4}$/.test(String(creationYear)) ? creationYear : 'TODO'} },
`)

  // ── 7. Docs-rot warning ─────────────────────────────────────────────────────
  const grep = spawnSync('grep', ['-rn', '-E', String.raw`\b[0-9]+ (curated |featured )?works\b`, join(ROOT, 'docs')], { encoding: 'utf8' })
  const hits = (grep.stdout || '').trim()
  if (hits) {
    console.log('⚠ hardcoded work counts that may now be stale:')
    for (const line of hits.split('\n')) console.log(`    ${line.replace(ROOT + '/', '')}`)
  }

  // ── 8. Metrics + finishing checklist ────────────────────────────────────────
  const metrics = spawnSync(process.execPath, [join(ROOT, 'scripts', 'metrics.mjs')], { encoding: 'utf8' })
  console.log(metrics.status === 0 ? '✓ metrics regenerated' : `⚠ metrics failed: ${metrics.stderr}`)

  console.log(`
Next (human checklist):
  1. Fill the TODO title/artist in both snippets from the draft essay (${draftEssays}) and paste them.
  2. Move the reviewed essay from vault/agents/drafts/ into vault/agents/findings/.
  3. npm test && npm run check:images && npm run build && npm run honesty
  4. Commit on a feat/data/* branch and open a PR — the human merges (ADR 0001).`)
}

main()
