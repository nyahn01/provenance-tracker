# INSIGHTS — the running log of everything learned (never lose an insight)

Append-only. Newest at top. Every agent and every session drops insights here the moment
they appear — a finding, a dead end, a better source, a design decision, a risk. If it isn't
written to a file, it's lost when the context window rolls. This file is the safety net.

## Capture protocol (Claude Code ⇄ Obsidian best practice)
- **Write it down immediately.** Insight → one bullet here, tagged `#data #design #insurance
  #strategy #risk #process`. Don't wait for "later."
- **Durable cross-session facts** also go to `memory/` (Claude Code memory) with an index line
  in `memory/MEMORY.md`. Insights here are the stream; memory/ is the curated, recalled set.
- **Decisions** (we chose X over Y, and why) go here AND, if they change the spec, into the
  relevant doc ([[CLAUDE.md]], [[BUSINESS_CASE.md]], [[DESIGN_SYSTEM]], [[DATA_SOURCES]]).
- **Wikilink liberally** so Obsidian's graph view connects everything: `[[note-name]]`.
- **Nothing important lives only in chat.** Chat is volatile; files are the record.
- The loop appends a one-liner here each cycle (what was learned), separate from `MORNING.md`
  (what shipped). MORNING = status; INSIGHTS = knowledge.

---

<!-- append insights below, newest first -->

- `#design` Globe luminosity + responsive layout + gallery palette fix (P0 polish, 2026-06-18).
  Three changes shipped together:
  (1) Globe now shows land masses via `polygonsData` with a vendored GeoJSON (`/public/geo/countries-simple.json`
  — 33 simplified country/continent polygons). Land fill `#1c1612`, border `#2a2218`, ocean `#111010`.
  Atmosphere altitude raised to 0.16 for better glow. Auto-rotation at speed 0.3 (per DESIGN_SYSTEM.md
  spec of 0.4 deg/s — globe.gl's speed unit differs, 0.3 is the closest match). Rotation pauses
  when artwork is selected (selectedResult effect drives `controls.autoRotate`).
  (2) Responsive overlap fixed: desktop (≥1024px) right rail stays fixed-width, search bar's `left`
  starts at 280px (past sidebar) and `right` steps in by panelWidth when panel is open. Mobile (<768px):
  detail panel becomes a bottom sheet (`fixed bottom-0`, 65vh, rounded top corners) with a dimmed
  backdrop overlay; search bar is hidden while sheet is open (no overlap possible). Left sidebar hidden
  on mobile. Breakpoints: 768 / 1024 per DESIGN_SYSTEM.md section 8.
  (3) Gallery palette enforced on the right panel: all panel text/border/background now uses GAL.*
  tokens consistently. Image plate fallback (when no thumbnail) was using dark OBS colors — fixed to
  `GAL.textMuted` and `GAL.textFaint` so it reads on the warm off-white `#f7f4ee` background.
  Source badges use `gallery=true` flag for their light-context variants.
  GATE: `npm run build` passed cleanly (✓ Compiled, 0 TS errors). Ship gate with commit blocked by
  Bash permission — requires manual `node scripts/ship.mjs --commit "..."` run.

- `#design #process` Redesign v1.0 verified live via browser screenshots (orchestrator). VERDICT:
  landing (Cormorant serif headline, editorial hierarchy) and the search dropdown (thumbnails +
  gold/sage tier badges) are genuinely museum-grade. Detail view = editorial gallery: artwork hero,
  serif title, MET tier badge, Movement History timeline, and the honest "Provenance gap" state
  rendering correctly ("Only one mapped location… help complete it. Sources: Wikidata P276").
  ROUGH EDGES to fix next: (1) the globe itself is a near-empty dark sphere — undersells the
  "luminous centerpiece" intent; needs subtle land/graticule/glow. (2) Responsive: at ~520px the
  bottom search bar overlaps the detail panel content. (3) Confirm the warm off-white "gallery"
  palette is actually applied to the detail panel (read dark in the narrow-viewport capture).
  NOTE: the redesign agent died before committing; the gate recovered + verified its uncommitted
  work (commit bcdfd91) — concrete proof the ship-gate is the safety net, not the agent's word.

- `#design` Hybrid museum-grade redesign shipped (v1.0). Key decisions:
  **Typefaces:** Cormorant Garamond (display serif) + Pretendard (UI grotesque). Cormorant chosen over Fraunces/Spectral for its classical proportions and optical similarity to exhibition wall labels; it reads as "gallery" without being fussy.
  **Two-palette architecture:** Observatory (dark, #0a0908 base) stays for the globe landing; Gallery (warm off-white #f7f4ee) activates for the provenance detail panel. Both palettes share the clay/sage/gold accent family so switching modes feels like moving rooms, not switching apps.
  **Provenance gap state** redesigned as first-class: uses a horizontal dashed-rule icon (not a warning triangle), Cormorant headline "Provenance gap", calm explanatory copy. No error colors. Gap is framed as an invitation.
  **Source badges** are mandatory on every fact (tier A = gold MET/AIC, tier B = sage Wikidata, other = clay). Badge style is distinct per palette to keep contrast.
  **Bottom-center search** was kept but widened (dropdown now 400px with thumbnail previews). The landing headline ("Where great art / *has been*") sits center-globe, pointer-events none, fades when an artwork is selected.
  **Right panel transition:** `slide-in-right 400ms cubic-bezier(0.25,0.1,0,1)` — the panel physically arrives from the right edge, carrying the editorial mood shift without a full-page navigation.
  **Constraint honored:** data flow (search → /api/search → select → /api/provenance → arcs + timeline) is untouched; types.ts contract intact; verify.mjs honesty grep clean.

- `#process` Agents' prose reports are proposals, not results — only `scripts/ship.mjs` (build +
  live contract verify + honesty grep) makes work real. A "build passes" green check hid a fully
  broken provenance route once. See [[agent-workflow-preferences]].
- `#data` Wikidata exact-label match misses works with em-dashes/date suffixes (e.g. "A Sunday on
  La Grande Jatte — 1884" returned no P276). Need normalized + altLabel + artist-title matching.
- `#data` Coverage is thin by design (Wikidata P276 ≈ 5.5%). The fix is more sources + honest
  credibility tiers, not invented data. See [[DATA_SOURCES]].
- `#design` Current hackathon UI judged "hideous" — bar is now museum/gallery quality. New
  `design-director` owns the system; see [[DESIGN_SYSTEM]] (to be authored).
