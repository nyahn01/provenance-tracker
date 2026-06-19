# TOMORROW — Batch Priority Queue

Agents pull from this queue daily (6am UTC). Completed features move to PROGRESS.md.

---

## TONIGHT — Immediate Batch (Max, triggered manually before demo)

### T1. Seed Getty GPI — Goupil & Cie dataset
**Agent:** provenance-data
**Why:** Degas Yellow Dancers AIC provenance text explicitly names "Goupil et Cie, Paris on July 25, 1891". Seeding this closes the paper trail for our best demo work. CC0, same S3 bucket pattern as Knoedler.
**Data URL:** `https://jpgt-or-prd-provenance-index-csv.s3.us-west-2.amazonaws.com/goupil/goupil.csv`
**What:**
- Create `scripts/seed-goupil.mjs` (mirror of seed-getty.mjs, filter same 30-artist list)
- Output to `public/data/getty-goupil.json`
- Edit `src/lib/getty.ts`: `searchGetty()` loads+merges both datasets; tag `sourceLabel: "Getty GPI — Goupil & Cie (1846–1919)"`
**Done when:** `searchGetty('Edgar Degas')` returns records from BOTH datasets; a Goupil record near 1891 appears for Yellow Dancers.
**Blocks:** None.

### T2. Globe contrast + city dots
**Agent:** provenance-globe
**Why:** User cannot distinguish continents on the globe — ocean (#111010) vs land (#1c1612) contrast too low. Demo-critical visual issue.
**What:**
- `src/components/StoriesApp.tsx` globe config: land color → `#2a2218` (warmer, more visible)
- Globe borders → `#4a3d2e`
- Add static city dots (altitude 0.3, rgba(246,241,232,0.35)) for: Paris, London, Amsterdam, NYC, Chicago, Florence, Madrid, Vienna, Tokyo, Seoul
- City data: hardcode lat/lng as `CITY_DOTS` array near globe init
**Done when:** Screenshot in PR shows continents clearly distinguishable; arcs pop against land.
**Blocks:** None.

### T3. Team page: Stage 2 pill active
**Agent:** provenance-globe
**Why:** Max subscription is active now. Stage 2 pill still shows as inactive/muted. Demo script says "agents working right now."
**What:**
- `src/app/team/page.tsx`: Stage 2 pill `active: false` → `active: true`
- Stage 2 text → "Background automation via Max — live now"
- Add one line below subtitle: "Overnight enrichment running: Goupil & Cie dataset → in progress"
**Done when:** Stage 2 pill renders gold/active; copy updated.
**Blocks:** None.

---

## Tier 1: High-Value Quick Wins (1–2 days per feature)

### 0. /learn page — provenance glossary (NEW)
**Agent:** art-historian drafts content → provenance-globe builds page
**Why:** Art & AI book club audience needs this; links from sidebar gap entries ("What is a provenance gap?"); static page, fast to build.
**What:**
- `src/app/learn/page.tsx` — server-rendered, static, same dark palette
- Sections: Chain of custody vs exhibition loan | What a provenance gap means (legal implications) | GPI / Knoedler / Goupil explained | WWII era (1933–1945) | Korean cultural heritage — 직지심체요절 as a case study
- Link from sidebar gap events: "Learn about provenance gaps →"
**Done when:** `/learn` route renders; all sections present; `npm run build` passes.
**Blocks:** None.

### 1. Reconciliation reconciliation: fix the uncertainty display
**Agent:** provenance-data  
**Why:** Sparse data points (5.5% Wikidata coverage) should show confidence levels, not gaps.  
**What:** Add `confidence: "high" | "medium" | "low"` to provenance timeline shape. Wikidata P276 = medium, exhibition catalogs = high, web extraction = low.  
**Done when:** provenance-timeline returns typed confidence; panel renders a "confidence badge" next to each event.  
**Blocks:** None.

### 2. Museum exhibition-loan extraction from prose
**Agent:** provenance-data  
**Why:** Exhibition history is locked in museum prose ("on loan to Louvre, 1992–1995"). Claude can extract it; deterministic extraction is fallback.  
**What:** Parse museum collection pages for "on loan" / "loaned" / "borrowed" markers. Return typed `ExhibitionLoan` shape. Test with Starry Night @ MOMA.  
**Done when:** Query returns structured loans with dates; PR passes honesty checklist.  
**Blocks:** None (Anthropic key is funded after 6/19).

### 3. Polish globe empty-state (unscripted search, thin data)
**Agent:** provenance-globe  
**Why:** When a user searches a non-curated work, the globe shows nothing. Needs graceful degradation.  
**What:** When data is sparse (< 3 locations), show a "Provenance gap — help improve this record" panel. Link to a form stub (no submission needed yet).  
**Done when:** Empty search degrades to intentional-looking UI, not broken. Screenshot in PR.  
**Blocks:** None.

### 4. Refresh Met/AIC API caching (TTL tuning)
**Agent:** provenance-data  
**Why:** Current TTL is 24h; museum updates are rare, but demo data should be fresh.  
**What:** Implement cache-invalidation route (`/api/cache/invalidate?source=met`). Add per-API TTL config (Met: 7d, AIC: 7d, Wikidata: 1d). Document in PR.  
**Done when:** Cache hits/misses logged; invalidation works; no 429s during demo.  
**Blocks:** None.

## Tier 2: Feature Expansion (2–3 days per feature)

### 5. RKD (Rijksmuseum Kunsthistorisch Documentatiecentrum) integration
**Agent:** provenance-data  
**Why:** RKD has ~75k artworks with documented provenance. Free API; high credibility.  
**What:** Implement RKD query (https://api.rkd.nl/). Merge results with Met/AIC. Test with a work known to RKD.  
**Done when:** RKD results show in search; source line says "RKD"; no API key required.  
**Blocks:** None (requires WebFetch whitelist update for api.rkd.nl).

### 6. Europeana data integration (exhibition-history enrichment)
**Agent:** provenance-data  
**Why:** Europeana has 60M items with rich metadata. Free tier; high coverage for non-US works.  
**What:** Query Europeana API (pro.europeana.eu) for exhibition history and provenance notes. Merge into timeline.  
**Done when:** Europeana results appear in curated works; source attributed correctly.  
**Blocks:** None (requires API key in env; already whitelisted for WebFetch).

## Tier 3: Design & UX Polish (1–2 days per feature)

### 7. Team page animation & museum data cards
**Agent:** provenance-globe  
**Why:** Team page is static. Each agent card should show the museum/dataset count they're working with.  
**What:** Add museum-pin icons to agent cards. Animate them on scroll. Show live cache stats (e.g., "Met: 347 in cache, updated 3h ago").  
**Done when:** Cards animate smoothly; stats refresh; responsive on mobile.  
**Blocks:** None.

### 8. Mobile-responsive globe + sidebar collapse
**Agent:** provenance-globe  
**Why:** Globe is cinematic on desktop, cramped on mobile. Sidebar should collapse into hamburger.  
**What:** Use Tailwind responsive breakpoints. Globe shrinks to 75% height on tablet, 50% on mobile. Sidebar → slide-in drawer. Test on iPhone 15.  
**Done when:** Works on mobile; no layout breaks; animations smooth.  
**Blocks:** None.

## Tier 4: Business & Strategy (parallel, can run anytime)

### 9. Pricing model exploration for B2B
**Agent:** provenance-strategy  
**Why:** Need to validate if museums / insurers would pay for provenance API.  
**What:** Desk research: Smithsonian, Getty, insurance underwriters. What data do they want? What's the TAM (total addressable market)?  
**Output:** 1-page research memo in draft/RESEARCH_MEMO.md. No code.  
**Done when:** Memo filed; findings inform positioning.  
**Blocks:** None.

### 10. Craft elevator pitch (30 sec, 2 min, 5 min versions)
**Agent:** provenance-story  
**Why:** Demo script exists; need three versions for different audiences (museum director, tech investor, art-curious person).  
**What:** Write three versions in draft/PITCH.md. Film 30-sec video if possible (or script it).  
**Done when:** Three pitches in file; team reviews; 30-sec version passes "would watch to the end" test.  
**Blocks:** None.

---

## Legend

- **Done when:** Clear acceptance criteria. If met, agent opens PR; main session runs honesty gate.
- **Blocks:** Which agents are upstream (data before UI) or which async work is needed.
- **Tier 1** agents run **every day** (small, high-impact).
- **Tier 2–3** run **every 3 days** (bigger features, can batch).
- **Tier 4** run **weekly** (strategy/narrative, no code merges needed, just files).

---

## How Agents Pick Work

1. Agent wakes up (via scheduled workflow run).
2. Reads this file (current priority).
3. Picks the FIRST uncompleted item in their domain.
4. Reads the acceptance criteria ("Done when").
5. Branches, codes, tests, opens PR.
6. Main session runs honesty gate, merges or requests changes.
7. Item moves to PROGRESS.md. Next agent wakes up and picks #2.

---

## How to Pause All Agents

```bash
# In Claude Code, stop the scheduled workflow
/schedule --list              # See all scheduled jobs
/schedule --cancel <job-id>   # Cancel the specific batch-agent job
```

Agents will not spawn until you restart the schedule. To resume:
```bash
/schedule --resume <job-id>
```

---

## How to Pause One Agent

Edit the agent's entry in this file:
```markdown
### [PAUSED] 1. Reconciliation reconciliation: fix the uncertainty display
```

Next run, agent skips it. When ready to resume, remove `[PAUSED]`.

---

See also: draft/PROGRESS.md (completed features), draft/INSIGHTS.md (lessons learned).
