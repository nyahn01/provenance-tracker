# Timeline-Led Hero — Redesign Spec (#115)

Status: **sign-off spec** for the #115 hero redesign. This is the **target** the build
agents follow for the new hero. On implementation, this folds into
`docs/DESIGN_SYSTEM.md` (§0 Philosophy + §6 components), replacing the Observatory /
globe-hero sections. **Until that PR lands, `DESIGN_SYSTEM.md` v1.0 still describes the
live product** and the ⚠️ GLOBE CONTRACT in `CLAUDE.md` still governs the current globe.

This document does NOT restate hex values — colors are named by their token in
`src/lib/design-tokens.ts` (the single source of truth). Where a new token is required,
this doc names it and specifies its *role/treatment*; the hex is set in the token file at
build time under design review.

Decision record: `docs/decisions/0004-timeline-led-hero.md`.

---

## 0. Principle in one line

An exhibition wall label given room to breathe. The **artwork is the hero**, the
**chain of custody is the caption**, and the **provenance gap is the most beautiful
state on the page**. Restraint, typography, and honest hierarchy first.

---

## 1. Type scale ramp

Two families, already wired in `src/app/globals.css`:
- `var(--font-display)` → **Cormorant Garamond** — titles, years/dates, the one hero line.
- `var(--font-ui)` → **Pretendard** — all structure, names, controls, badges, running prose.

**Hard rule:** the visualization's own labels (timeline year ticks, node labels, map
markers) use these families. Zero charting-library default typography reaches the screen.

| Role | Family | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|---|
| Hero artwork title | display | `clamp(2.4rem, 5vw, 3.8rem)` | 400 | `-0.02em` | 1.05 |
| Hero lede / one statement | ui | `1rem` | 400 | `0` | 1.6 |
| Section eyebrow (small caps) | ui | `0.7rem` | 600 | `0.18em` UPPERCASE | 1.4 |
| Timeline event **year/date** | display | `1.1rem` | 400 | `-0.01em` | 1.2 |
| Timeline gap-span **years** | display | `1.1rem` | 400 (italic) | `-0.01em` | 1.2 |
| Event **owner / holder name** | ui | `0.9rem` | 500 | `0` | 1.4 |
| Event **institution / role** | ui | `0.8rem` | 400 | `0` | 1.45 |
| Event **type tag** (Custody / Loan / Sale) | ui | `0.7rem` | 600 | `0.12em` UPPERCASE | 1.3 |
| Source badge | ui | `0.7rem` | 600 | `0.1em` UPPERCASE | 1.3 |
| Gap **label** ("Provenance gap") | ui | `0.7rem` | 600 | `0.14em` UPPERCASE | 1.3 |
| Gap **invitation copy** | ui | `0.8rem` | 400 (italic) | `0` | 1.5 |
| Running prose / evidence excerpt | ui | `0.85rem` | 400 | `0` | 1.55 |

Ramp discipline: dates in the **serif** signal "archival record"; structure in the
**grotesque** signals "UI." Do not swap them.

---

## 2. Color roles → tokens

Home is `OBS` (dark chrome). The dark ground lets a public-domain painting glow like a
lit object. Names below are `design-tokens.ts` keys — never inline the hex.

| Role | Token | Rule |
|---|---|---|
| Page ground | `OBS.bg` | The gallery wall. |
| Panel / card surface | `OBS.surface` | Recessed, quiet. |
| Hairline / lane rule | `OBS.border`, `OBS.borderMid` | Structure, never decoration. |
| Primary text | `OBS.text` | Names, titles. |
| Secondary text | `OBS.textMuted` | Institutions, meta. |
| Faint text | `OBS.textFaint` | De-emphasized captions. |
| **Custody (ownership)** | `OBS.gold` | Primary weight. The unbroken spine. |
| **Exhibition loan** | `OBS.sage` | Distinct + quieter than custody. Branches and returns. |
| **Dealer / market record** | `accent.dealer` | Getty GPI (Knoedler/Goupil). Sparing third voice. |
| **Interaction only** | `OBS.clay` | Hover, focus, selected event. **Never a data category.** |
| Confidence: high | `state.successDot` | On the event card dot. |
| Confidence: medium | `state.warningDot` | " |
| Confidence: low | `state.faintDot` | " |

**Discipline:** at most three data hues on screen (gold / sage / dealer-purple). If an
encoding needs a fourth, the encoding is doing too much — escalate before adding paint.
Interaction (`clay`) and data hues must never collide, or hover reads as meaning.

### New token — the gap state (proposed; add to `design-tokens.ts` under review)

- **Name:** `OBS.gapWeave` (and mirror `accent.gap` in the semantic layer).
- **Role:** the visual voice of an *honestly undocumented* span. Replaces the current
  apologetic muted-grey `state.gap` for the hero.
- **Treatment (spec, hex set at build):** a **dimmed, warm-neutral** value derived from
  the `textFaint`/`borderMid` family — *not* red, *not* the ocean black, *not* a data hue.
  Rendered as a **textured / dashed / low-contrast weave** across the span, reading
  "honestly unknown," never "error" and never "failed to render." It must be legible and
  dignified enough to sit beside a documented event without looking broken.
- Contrast: the gap **label text** must meet AA against the ground even though the weave is
  faint. The *weave* may be sub-AA (it is texture, not text); the *label* may not.

---

## 3. Motion tokens

Curatorial, not ambient. **Auto-rotate is retired and does not return.**

| Token | Value | Use |
|---|---|---|
| `motion.dur.micro` | 200ms | hover, focus ring, badge reveal |
| `motion.dur.event` | 350–450ms | one event fading/drawing in |
| `motion.dur.reveal` | 500–600ms | map reveal open/close |
| `motion.ease.standard` | `cubic-bezier(0.25, 0.1, 0, 1)` | everything (slow-out) |
| `motion.stagger.chain` | 90ms | delay between consecutive events assembling |

**Signature behavior — "the chain assembles":** on work selection, events fade/draw in
**oldest → newest**, each `motion.dur.event`, staggered by `motion.stagger.chain`. The
animation *is the argument* — you watch custody advance through time.

**Gap holds a beat:** when assembly reaches a gap span, it **pauses ~250ms** and lets the
gap draw in *at its measured width* before the next documented event appears. The absence
is honored, never skipped.

**No** bounce, spring, spinner-as-personality, or ambient loop anywhere.

**`prefers-reduced-motion: reduce`:** render the **final assembled state instantly**;
cross-fade only (≤200ms opacity). Map reveal opens without the draw animation. This is a
hard requirement, not a nicety.

---

## 4. Component specs

### 4.1 Chronological chain-of-custody timeline (the hero)

- **Orientation:** horizontal on desktop/tablet (left = earliest); vertical stack on
  mobile (top = earliest). Chronology is the primary axis.
- **Lane structure — two tiers:**
  - **Custody spine** (`OBS.gold`): a single **unbroken** primary line carrying
    `ProvenanceResponse.locations` (`LocationEntry[]`) in date order. This is the backbone.
  - **Loan tier** (`OBS.sage`): `ProvenanceResponse.exhibitions` (`ExhibitionLoan[]`)
    render as a **secondary track that visibly branches off the spine and returns to it**
    at the same custody point — a loop above/beside the spine that never breaks or advances
    the custody line. This is the structural enforcement of *custody ≠ loan*.
  - **Dealer/market events** (`accent.dealer`): `gettyRecords` (`GettyRecord[]`) render as
    marks *on or beneath the spine* at their `saleDate`, tying a transaction to the custody
    change it documents. Sparing.
- **Date axis:** derived from event `startDate`/`endDate`. **Gaps are drawn to scale** —
  an undocumented 1912–1919 span occupies its real width (§4.3). Never compress a gap to a
  point; that would hide it.
- **Selection:** a click/focus on any event highlights it in `OBS.clay`, surfaces its card
  (§4.2), and enables the map reveal (§4.5) for that event.

### 4.2 Per-event card

Content, top to bottom:
1. **Year/date** — display serif (§1). Range if `startDate`–`endDate`.
2. **Owner / holder name** — from `LocationEntry.name` (ui, weight 500).
3. **Institution / role** — from `.institution` (ui, muted).
4. **Type tag** — CUSTODY / LOAN / SALE (ui small-caps, colored by data hue).
5. **Confidence dot** — from `.confidence` (`high|medium|low`) → `state.successDot` /
   `warningDot` / `faintDot`. A tooltip states what the level means (mirror the type
   comments in `types.ts`).
6. **Source badge** (§4.4) — always present. No card ships without one.

Surface `OBS.surface`, hairline `OBS.border`, generous internal padding (≥16px). Selected
state: border → `OBS.clay`. Hover: 200ms lift + border warm, `motion.ease.standard`.

### 4.3 Gap state — first-class, the most beautiful state on the page

Drives from `ProvenanceResponse.gaps` (`GapEntry[]`) and `hasGap`.

- **Rendered as a labeled span**, sized to the real interval (`from`→`to`), using the new
  `OBS.gapWeave` treatment (§2): a quiet, dignified, textured passage in the timeline.
- **Label:** `PROVENANCE GAP` (ui small-caps) + the years (display serif italic) +
  `GapEntry.note` as the honest sentence (e.g. *"No documented owner, 1912–1919."*).
- **Tone: inviting, never an error.** No red, no warning iconography, no dialog. Where the
  chain is thin (`hasGap === true` with the fallback note), include the standing invitation
  *"Help complete the record"* as a quiet link — the gap is a feature and a call to
  contribute, not a failure.
- **Open-ended gaps** (`from` or `to` null) fade the weave toward the unknown edge rather
  than terminating with a hard cap.
- This is the moment that proves the brand: when a reviewer sees the gap rendered as
  carefully as a documented event, they trust everything else.

### 4.4 Source badge

- Small-caps, tracked, `OBS.textMuted` — **present but quiet**. Legible on inspection,
  never shouting.
- Label from the fact's `source` string (e.g. "Wikidata P276", "Met API", "AIC",
  "Getty GPI", "RKD"). Reuse the existing `SourceBadge` component's vocabulary.
- Every on-screen fact carries one. Sourcing that is visible-but-calm is what separates
  "credible archive" from "trust me."

### 4.5 Secondary map reveal (second chair, on demand)

- **Trigger:** from a **selected event** only ("See this journey on a map"). Never the
  landing hero; never always-on.
- **Content:** shows the geographic move *for the selected custody transition* (and its
  neighbors), using the same data hues (custody gold / loan sage). It illustrates a genuine
  distance story (e.g. a transatlantic sale, a wartime displacement) — the one thing
  geography does better than a timeline.
- **Honesty:** the map still obeys §6 — no arc bridges a gap; a loan's mark is visually
  distinct from a custody move; nothing implies live/"currently on view."
- **Motion:** opens with `motion.dur.reveal`; reduced-motion opens instantly.
- **⚠ Dependency choice for the maintainer — flag, do not decide unilaterally:**
  - **Option A (reuse Globe.gl):** retain the existing globe as the second-chair map. Pro:
    no new dependency; the locked init pattern (post-supersession) can be reused. Con:
    3D globe for a single point-to-point move is heavy and re-imports the arc encoding we
    just demoted; risk of the arc metaphor creeping back.
  - **Option B (flat map, e.g. lightweight SVG/canvas projection or a static basemap):**
    Pro: quiet, gallery-appropriate, cheap, no globe-init fragility. Con: a new (small)
    rendering path.
    - **Recommended (design):** a **flat map** reads calmer and more "archival" for a
      single journey, and avoids re-normalizing arcs as the primary metaphor.
  - Whichever is chosen: the map is a *reveal*, not a hero, and inherits all guardrails.

---

## 5. Layout, spacing, restraint

- **The object first.** The public-domain painting is present, large, uncropped, properly
  lit against `OBS.bg`. The timeline serves it; it never upstages it.
- **Generous margins.** Real breathing room around the object and the chain. Do not repeat
  the current landing's crammed stack (hero + 3 beats + card grid + search + footer behind
  a dimmed globe). Supporting UI recedes until invited.
- **No landing scrim over the hero.** The 72%-opacity dim over the old globe is retired —
  a hero you must hide behind a scrim is not a hero.
- **Grid:** a real content column (~`max-width 1100`), consistent gutter, aligned baselines
  between the serif dates and the grotesque names.
- **Spacing scale:** reuse the app's existing rhythm (multiples of 4/8, per
  `DESIGN_SYSTEM.md` §3). Whitespace is the feature.

---

## 6. Accessibility (quality = credibility)

- **Contrast ≥ WCAG AA** for all text (the gap *label* included; the gap *weave* is texture
  and exempt as non-text).
- **Keyboard step-through:** the chain is fully navigable without a mouse — Tab/Arrow moves
  event-to-event in chronological order, Enter selects, focus opens the card and enables the
  map reveal. Visible focus ring in `OBS.clay`.
- **Focus states** on every interactive node (events, gap invitation link, map trigger).
- **"Full chain as text" aria pattern must survive.** The current
  `role="img"` + `aria-label` pattern carries over: the timeline exposes an accessible text
  equivalent of the ordered chain, including gaps and sources.
- **Reduced motion:** §3 fallback is mandatory.

---

## 7. Honesty acceptance checklist (build must satisfy all)

- [ ] **No invented continuity across gaps.** No line/arc/animation bridges or smooths a
      gap. Every gap in `gaps[]` renders explicitly, to scale, labeled (§4.3).
- [ ] **Custody ≠ loan — structural AND chromatic.** Custody = unbroken gold spine
      (`locations`); loans = sage branch-and-return (`exhibitions`) that never advance the
      spine. Verifiable by looking at the timeline.
- [ ] **Interaction color ≠ data color.** `OBS.clay` is hover/focus/selection only;
      gold/sage/dealer-purple carry meaning.
- [ ] **Sourcing always visible.** Every event and gap shows its source (§4.4). No fact
      ships without one.
- [ ] **PD-only images, credited.** Hero imagery obeys the public-domain-only rule with
      institution credit (existing `credit` line).
- [ ] **No live-tracking copy.** No "currently on view" / real-time location language in any
      label, tooltip, or reveal — on the timeline or the map.
- [ ] **All viz labels use the type system** (§1) — no library-default fonts/ticks.
- [ ] **Reduced-motion + AA + keyboard step-through** all pass (§6).
