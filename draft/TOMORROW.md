# TOMORROW — Batch Priority Queue

Agents pull from this queue. Completed features move to PROGRESS.md.
**Last updated: 2026-06-19** — post-batch-run, post-globe-fix, post-PR-6 merge.

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

## 🔁 In PR — awaiting review + merge

- **PR #8** `feat/globe/team-stage2-active` — Stage 2 pill active, Goupil status line
- **PR #9** `feat/globe/learn-page-clean` — `/learn` provenance glossary, gap sidebar link
- **`feat/data/confidence-levels`** — confidence dots (high/medium/low) on timeline events — branch pushed, no PR yet

---

## Tier 1: High-Value Quick Wins

### 1. /pricing page — 3-tier mock
**Agent:** provenance-globe
**Why:** Needed for the demo Q&A ("what's the business model?"); static page, fast to ship.
**What:**
- `src/app/pricing/page.tsx` — server-rendered, same dark palette as `/learn` and `/team`
- Three tiers:
  | Tier | Price | Who |
  |------|-------|-----|
  | Explorer | Free | Public, students, art-curious |
  | Researcher | €99/mo | Art historians, journalists, educators |
  | Institution | €999/mo | Museums, auction houses, restitution law firms |
- CTA buttons: "Coming soon" (no Stripe yet)
- Below tiers: one-line note "Tier rationale from draft/RESEARCH_MEMO.md — restitution clients first"
- Add `/pricing` to nav (wherever `/team` and `/learn` are linked)
**Done when:** `/pricing` route renders; `npm run build` passes.
**Blocks:** None. **Globe contract:** N/A (no globe on this page).

### 2. Globe empty-state — graceful degradation
**Agent:** provenance-globe
**Why:** Searching a non-curated work shows a blank sidebar. Needs intentional fallback.
**What:**
- In `src/components/StoriesApp.tsx`, when `prov.locations.length < 2 && !prov.hasGap`:
  - Show a styled "Provenance gap" panel using existing `OBS.gap` color token
  - Text: "Ownership records for this work are incomplete."
  - Link: "Learn about provenance gaps →" pointing to `/learn`
- When `prov.hasGap === true` (gap already flagged by API): same panel, already works — verify it looks right
**Done when:** search for an uncurated work shows gap panel instead of empty space.
**GLOBE CONTRACT:** Do not touch globe init. Only modify the sidebar JSX.

### 3. Open PR for confidence-levels branch
**Agent:** provenance-globe (or provenance-data)
**Why:** Branch `feat/data/confidence-levels` is pushed but has no PR.
**What:** Just open the PR — no new code needed. Title: "feat(data): confidence levels on timeline events"
**Done when:** PR open on GitHub.
**Blocks:** None.

---

## Tier 2: Feature Expansion

### 4. Museum exhibition-loan extraction from prose
**Agent:** provenance-data
**Why:** Exhibition history is locked in museum prose ("on loan to Louvre, 1992–1995"). Structured extraction adds a whole tier of data.
**What:**
- Parse `provenance` prose fields from Met/AIC for "on loan" / "loaned" / "borrowed" markers
- Return typed `ExhibitionLoan` shape (reuse or extend `LocationEntry`)
- Test with Starry Night @ MoMA
**Done when:** query returns structured loans with dates; PR passes honesty check.
**Blocks:** None.

### 5. Cache TTL tuning + invalidation route
**Agent:** provenance-data
**Why:** Demo data must be fresh; no 429s during the recording.
**What:**
- Add `/api/cache/invalidate?source=met|aic|wikidata|rkd` route
- TTL config: Met 7d, AIC 7d, Wikidata 1d, RKD 1d
- Log cache hits/misses to console (not to UI)
**Done when:** cache invalidation works; no rate-limit errors in 10 rapid queries.

### 6. Mobile-responsive globe + sidebar
**Agent:** provenance-globe
**Why:** Globe is cramped on mobile; sidebar doesn't collapse.
**What:**
- Globe: 75% height on tablet, 50% on mobile (Tailwind breakpoints)
- Sidebar → slide-in drawer on mobile (hamburger button)
- Test on 390px viewport
**Done when:** no layout breaks on mobile; animations smooth.
**GLOBE CONTRACT:** Do not touch globe init. Only CSS/layout changes.

---

## Tier 3: Strategy & Narrative

### 7. Elevator pitches (30s / 2min / 5min)
**Agent:** provenance-story
**Why:** Demo Q&A needs crisp answers for "what is this?" at different audience levels.
**What:** Write three versions in `draft/PITCH.md`. Korean versions not needed here (DEMO_SCRIPT_KO.md already exists).
**Done when:** Three pitches filed; 30s version is under 80 words.

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
