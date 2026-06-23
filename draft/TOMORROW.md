# TOMORROW — Batch Priority Queue

Agents pull from this queue. Completed features move to PROGRESS.md.
**Last updated: 2026-06-22** — #6 mobile-responsive merged (PR #19). #5 cache TTL built & green, awaiting human merge (PR #20). Parseable queue now empty — needs replenishment (see "Queue empty" note below).

---

## ⚠️ GLOBE CONTRACT — READ THIS BEFORE TOUCHING StoriesApp.tsx

The globe rendering is locked. Do NOT deviate from this. The agent team has already broken it twice:

```typescript
// ✅ CORRECT — this is the only approved globe init pattern:
const oc = document.createElement('canvas'); oc.width = 2; oc.height = 2
const ox = oc.getContext('2d')!; ox.fillStyle = '#060504'; ox.fillRect(0, 0, 2, 2)
globe.globeImageUrl(oc.toDataURL()).backgroundColor(OBS.bg).showAtmosphere(false)

// ❌ NEVER DO THESE:
// globe.showAtmosphere(true)          — any atmosphere makes the globe orange
// globe.atmosphereColor(...)          — forbidden, see above
// scene.traverse(...)                 — causes black noise artifacts when zooming
// material.shininess = ...            — breaks depth buffer
// enableZoom = false                  — zoom must stay enabled
```

Design tokens (OBS object) are also locked:
```
globeOcean: '#060504'   // near-black — do not darken or lighten
globeLand:  '#7a5828'   // warm brown — continent silhouettes
globeBorder:'#a87848'   // polygon stroke
```

If your task requires touching globe init: re-read this section and do ONLY what's needed. Do not "improve" adjacent settings.

---

## ✅ Completed (do not re-queue)

- **Goupil & Cie seeding** — `scripts/seed-goupil.mjs`, 1,760 records merged with Knoedler (4,388 total)
- **RKD integration** — `src/lib/rkd.ts`, 4th parallel fetch, teal badge in sidebar
- **Globe canvas fix** — ocean via data URL, no atmosphere, zoom enabled (on main)
- **Honesty gate CI** — `scripts/honesty-check.mjs` + `.github/workflows/honesty-gate.yml`
- **Obsidian research vault** — `vault/` with 13 notes, agent writing instructions
- **Pricing research memo** — `draft/RESEARCH_MEMO.md` filed (restitution-first positioning, 3 tiers)
- **Team Stage 2 active** — Stage 2 pill live, Goupil enrichment status line (was PR #8)
- **`/learn` provenance glossary** — 6-section glossary with gap anchor (was PR #9)
- **Confidence levels** — `LocationEntry.confidence` + `ConfidenceDot` on timeline events (merged to main)
- **`/pricing` page** — 3-tier cards (Explorer / Researcher / Institution), nav links sitewide
- **Sidebar empty-state** — "░ Provenance gap" panel with `/learn` link when records sparse
- **`/demo` scrollytelling** — 5-section animated origin story, arc legend, data-flow SVG
- **`/demo/source`** — 12-section NotebookLM source doc with Q&A prep and key quotes
- **Demo polish** — fact corrections, sourced claims, internal refs removed, PROGRESS.md updated
- **Exhibition-loan extraction** — `src/lib/exhibition-loans.ts`, typed `ExhibitionLoan`, prose parser for Met + AIC (merged)
- **Elevator pitches** — `draft/PITCH.md`, three versions 30s/2min/5min, 30s = 75 words (merged)
- **Mobile-responsive globe + sidebar** (was #6) — globe height breakpoints + slide-in sidebar drawer, CSS/layout only, globe init untouched (merged, PR #19)

---

## In review (PR open — awaiting human merge; do NOT re-queue)

- **#5 Cache TTL tuning + invalidation route** (provenance-data) — `/api/cache/invalidate?source=…` route + TTL config (Met/AIC 7d, Wikidata/RKD 1d) + console hit/miss logging. Built on `feat/provenance-data/priority-5`, **PR #20 open**, honesty + build + Vercel checks all green. Human merges, then move to Completed above.

---

## Tier 2: Feature Expansion

_(empty — replenish)_

---

## Tier 3: Strategy & Narrative

_(empty — replenish)_

---

## ⚠️ Queue empty — needs replenishment

As of 2026-06-22 there are no un-started `### N.` priorities. The batch-agent-squad
workflow only picks `### N.` headings, so it now correctly finds nothing to build.
Before the next batch run does useful work, add new priorities under Tier 2/3 in the
`### N. Title` + `**Agent:** <domain>` + `**Done when:** …` format. Candidates worth
considering (NOT yet committed as priorities — human to confirm scope):
- Restitution case-study deep-dive page (art-historian + provenance-data)
- Per-IP rate limiting on API proxy routes (provenance-data) — noted in draft/CLAUDE.md as a coding rule, not yet verified implemented
- Source-citation hover cards on timeline events (dataviz-engineer)

---

## How Agents Pick Work

1. Agent reads this file (current priority, tier order).
2. Reads the GLOBE CONTRACT if touching StoriesApp.tsx.
3. Branches: `feat/<agent-domain>/<short-slug>`
4. Codes, runs `npm run build`, runs `npm run honesty`, fixes errors.
5. Opens PR — does NOT merge.
6. Main session runs honesty gate, merges or requests changes.
7. Item moves to PROGRESS.md. Next run picks the next item.

---

## How to Pause All Agents

Edit this file — prepend `[PAUSED]` to any priority heading.
The batch workflow skips `[PAUSED]` items automatically.

---

See also: draft/PROGRESS.md (completed), draft/INSIGHTS.md (lessons), draft/RESEARCH_MEMO.md (strategy).
