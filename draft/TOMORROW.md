# TOMORROW — Batch Priority Queue

Agents pull from this queue. Completed features move to PROGRESS.md.
**Last updated: 2026-06-23** — #6 mobile merged (#19); #5 cache TTL built + verified on branch, awaiting human merge. Active Tier 2 queue is now empty — refill needed.

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
- **Mobile-responsive globe + sidebar** (was #6) — merged as PR #19 (commit `a5a2a69`); globe height breakpoints + slide-in drawer sidebar

---

## 🔜 Built — awaiting human merge (do not re-queue)

### 5. Cache TTL tuning + invalidation route — ✅ built + verified
**Agent:** provenance-data
**Branch:** `feat/provenance-data/priority-5` (commit `7994b88`, pushed to origin)
**Status:** Built; `npm run build` + `tsc --noEmit` + `npm run honesty` all pass; honesty gate **APPROVED** 2026-06-23. **No PR opened** — gh CLI unavailable in this env. Human: merge the branch directly.
**Delivered:** `/api/cache/invalidate?source=met|aic|wikidata|rkd`, `/api/cache` stats route, `CACHE_TTL` config (Met/AIC 7d, Wikidata/RKD 1d), console HIT/MISS/EXPIRED/SET/INVALIDATED logging.
**Reviewer note (non-blocking):** `CACHE_KEY_PREFIXES` maps `search:` under both `met` and `aic`, but search keys hold mixed Met/AIC/Rijksmuseum/Europeana results — invalidating `met` or `aic` purges all search results (over-broad, harmless: just extra cache misses).

---

## Tier 2: Feature Expansion

_Empty — needs refill. Both prior Tier 2 items resolved: #6 merged (#19), #5 built + verified awaiting merge._

---

## Tier 3: Strategy & Narrative

_Empty._

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
