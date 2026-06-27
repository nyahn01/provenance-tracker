# DESIGN SYSTEM — Provenance Tracker
### Version 1.0 — Hybrid (Observatory → Gallery)

Every build agent follows this contract. Do not deviate from tokens. If a value you
need is absent, ask `design-director` to add it — never invent ad-hoc styles.

---

## 0. Philosophy

The UI lives in two modes that share DNA:

**Observatory** (landing / globe) — near-black, luminous, cinematic. The globe is the
hero. Typography is restrained: one serif headline, small-caps labels, nothing competing
with the rotating earth. Colour used as light: clay arcs trace journeys, gold pins pulse
like distant stars.

**Gallery** (detail / provenance) — warm off-white, editorial, generous margins. Walks
the user from the planetarium into the exhibition room. The artwork is the hero: large,
unmanipulated, captioned like a catalogue raisonné entry. Every fact carries a visible
source badge. Gaps are beautiful invitations, never broken states.

The transition between modes is the product's most important moment: 400 ms ease-out,
background fades from near-black to warm paper.

---

## 1. Colour tokens

### 1a. Observatory palette (dark mode — globe / landing)

| Token                | Hex / rgba                     | Use |
|----------------------|-------------------------------|-----|
| `--obs-bg`           | `#0a0908`                     | Page background, globe sky |
| `--obs-surface`      | `#131110`                     | Panels, raised cards |
| `--obs-surface-2`    | `#1c1a17`                     | Nested cards, hover rows |
| `--obs-border`       | `#2a2218`                     | All hairline dividers |
| `--obs-border-mid`   | `#3d3228`                     | Emphasis borders (selected state) |
| `--obs-text`         | `#f6f1e8`                     | Primary readable text |
| `--obs-text-muted`   | `#9a8f85`                     | Secondary / meta text |
| `--obs-text-faint`   | `#5c5449`                     | Placeholder, disabled |
| `--obs-clay`         | `#c87855`                     | Primary accent — arcs, active states |
| `--obs-clay-dim`     | `rgba(200,120,85,0.15)`       | Hover fills, subtle tints |
| `--obs-clay-border`  | `rgba(200,120,85,0.30)`       | Bordered clay elements |
| `--obs-gold`         | `#d4a853`                     | Museum pins, premium badge |
| `--obs-sage`         | `#6f8d7d`                     | Tier-B badges, secondary accent |
| `--obs-panel`        | `rgba(10,9,8,0.88)`           | Translucent sidebars |
| `--obs-dropdown`     | `rgba(13,12,11,0.97)`         | Search dropdown |
| `OBS.globeOcean`     | `#060504`                     | Globe water fill (runtime token in design-tokens.ts, not a CSS var) |
| `OBS.globeLand`      | `#7a5828`                     | Globe continent fill (runtime token) |
| `OBS.globeBorder`    | `#a87848`                     | Globe country lines (runtime token) |

### 1b. Gallery palette (light mode — detail / provenance panel)

| Token                | Hex / rgba                     | Use |
|----------------------|-------------------------------|-----|
| `--gal-bg`           | `#f7f4ee`                     | Page / panel background |
| `--gal-surface`      | `#ffffff`                     | Card / image well |
| `--gal-surface-2`    | `#ede9e2`                     | Timeline track, alt rows |
| `--gal-border`       | `#d8d2c8`                     | Hairline dividers |
| `--gal-border-mid`   | `#b8afa3`                     | Emphasis lines |
| `--gal-text`         | `#1a1714`                     | Primary body copy |
| `--gal-text-muted`   | `#6b6460`                     | Secondary copy, dates |
| `--gal-text-faint`   | `#9e9790`                     | Labels, placeholders |
| `--gal-clay`         | `#b06840`                     | Accents on light (darkened for contrast) |
| `--gal-clay-dim`     | `rgba(176,104,64,0.08)`       | Hover fills |
| `--gal-sage`         | `#4a6b5e`                     | Tier-B badge on light |
| `--gal-gold`         | `#a07830`                     | Selected / starred items |

---

## 2. Typography

### 2a. Faces

| Role       | Family                | Weight(s)  | CDN |
|------------|-----------------------|------------|-----|
| **Display / Serif** | Cormorant Garamond | 400, 500, 600, 700 | Google Fonts |
| **UI / Grotesque**  | Pretendard          | 300, 400, 500, 600 | cdn.jsdelivr.net |

CSS family declarations:
```css
--font-display: 'Cormorant Garamond', 'Georgia', serif;
--font-ui:      'Pretendard', 'system-ui', sans-serif;
```

Cormorant Garamond is used for:
- The landing headline ("Provenance Tracker")
- Artwork title in the detail view
- Section headings in the provenance timeline
- The "Provenance gap" state headline
- The primary H1/H2 headings on every marketing page (applied consistently site-wide via `var(--font-display)`)

Pretendard is used for everything else: body copy, labels, badges, inputs, buttons.

### 2b. Type scale

| Token           | Size   | Line-height | Tracking      | Weight | Font     | Use |
|-----------------|--------|-------------|---------------|--------|----------|-----|
| `--type-hero`   | 4.5rem | 1.0         | –0.02em       | 400    | Display  | Landing headline |
| `--type-display`| 2.25rem| 1.1         | –0.01em       | 500    | Display  | Artwork title in panel |
| `--type-heading`| 1.5rem | 1.2         | 0             | 500    | Display  | Section headings |
| `--type-label`  | 0.65rem| 1.0         | +0.12em       | 600    | UI       | Small caps labels (SOURCE, MOVEMENT HISTORY) |
| `--type-body`   | 0.875rem| 1.6        | 0             | 400    | UI       | Body copy |
| `--type-body-sm`| 0.8125rem| 1.5       | 0             | 400    | UI       | Secondary / meta text |
| `--type-caption`| 0.6875rem| 1.4       | +0.02em       | 400    | UI       | Source URLs, footnotes |

All small-caps labels: `text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.65rem; font-weight: 600; font-family: var(--font-ui)`.

### 2c. Body copy on observatory background

Max line length: 60ch on the landing hero; panel copy wraps at the panel width (never
text running to full screen width). Use `max-w-[60ch]` on prose blocks.

---

## 3. Spacing scale

Based on a 4 px base unit. Use multiples:
`2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 px`.
Tailwind equivalents: `0.5 / 1 / 2 / 3 / 4 / 6 / 8 / 12 / 16 / 24 / 32`.

Panel padding: `24px` (p-6). Section spacing: `32px` (mb-8).
Timeline vertical gap: `24px` between entries (space-y-6).

---

## 4. Radii and elevation

| Token            | Value   | Use |
|------------------|---------|-----|
| `--radius-sm`    | `4px`   | Badges, source chips |
| `--radius-md`    | `8px`   | Cards, input fields |
| `--radius-lg`    | `12px`  | Panels, drawers |
| `--radius-xl`    | `16px`  | Modal overlays |
| `--radius-full`  | `9999px`| Pills, avatar rings |

Elevation:
| Level | Shadow |
|-------|--------|
| 0     | none |
| 1     | `0 1px 3px rgba(0,0,0,0.4)` — cards in observatory |
| 2     | `0 4px 16px rgba(0,0,0,0.5)` — floating panels |
| 3     | `0 8px 40px rgba(0,0,0,0.6)` — search dropdown |

---

## 5. Motion spec

> Curatorial, not decorative. Every animation must serve comprehension, never distract.

| Token               | Duration | Easing                         | Use |
|---------------------|----------|-------------------------------|-----|
| `--ease-gentle`     | 200ms    | `cubic-bezier(0.4,0,0.2,1)`  | Hover states, badge reveals |
| `--ease-panel`      | 400ms    | `cubic-bezier(0.25,0.1,0,1)` | Panel slide-in/out, mode transition |
| `--ease-cinematic`  | 600ms    | `cubic-bezier(0.16,1,0.3,1)` | Globe rotate to new location, arc trace |

Globe rotation: 0.4 deg/s auto-rotate. Arcs: `arcDashAnimateTime 4000ms`.
Arc appearance on artwork selection: 600 ms ease-in trace.

Mode transition (observatory → gallery):
1. Right panel slides in from the right (400ms, `--ease-panel`)
2. Panel background transitions from `--obs-panel` to `--gal-bg` (400ms, same ease)
3. Typography swaps: no fade, instant re-layout (panel is freshly rendered)

Reduced motion: all transforms and transitions collapse to `0ms`. Globe still rotates
(spatial context), arcs still appear, but without animation.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Component specifications

### 6a. Search bar
- Position: bottom-center of the globe view, centered between the sidebars
- Width: 480px on desktop, full-width minus 32px on mobile
- Background: `--obs-surface` with 1px `--obs-border` border, `--radius-md`
- Focus ring: `2px solid --obs-clay` (meets WCAG AA, no box-shadow tricks)
- Placeholder text: `--obs-text-faint`; font-ui, 0.875rem
- Submit arrow: clay `→`, no background, 200ms hover opacity 0.6
- Label above: `SEARCH ANY PAINTING` in small-caps style (type-label)

### 6b. Search results dropdown
- Anchors directly above the search bar, same width
- Background: `--obs-dropdown`; border: `1px solid --obs-border-mid`; shadow: elevation 3
- Each row: 64px tall, thumbnail 40×40 (rounded-sm) left, title + artist right
- Hover state: `--obs-clay-dim` background fill, 200ms
- Source badge: top-right corner of each row; see badge spec below
- Max 5 results shown; overflow is hidden (not scrollable — short list is the UX)
- Empty / no-results: renders the "Provenance gap" discovery state (see 6e)

### 6c. Museum list (left sidebar — observatory mode)
- Width: 280px, translucent `--obs-panel`, backdrop-blur 16px
- Museum entry: 3-line card — name (`--obs-text`, body), city + country (`--obs-text-muted`, caption), focus (`--obs-text-muted`, caption)
- Active/selected: `--obs-clay-dim` fill, `--obs-border-mid` border left 2px
- No artwork count shown (removes the low-signal noise)
- Header: serif "Provenance" headline + "Tracker" in large display type

### 6d. Provenance timeline (gallery mode — right panel)
**Panel:** 380px wide, slides in from right. Background transitions to `--gal-bg`.

**Artwork hero block:**
- Thumbnail image: full width of panel, fixed height 200px, `object-fit: contain`, `object-position: center`, black background behind it — never crop. Fall back to a text-only plate if null.
- Title: `--type-display` in `--font-display`, `--gal-text`, 1.1 line-height
- Artist: `--type-body`, `--gal-text-muted`
- Date: `--type-body-sm`, `--gal-text-faint`
- Source badge: below the date (see 6f)

**Timeline:**
- Section label: `MOVEMENT HISTORY` in small-caps, `--type-label`
- Vertical track: `1px solid --gal-border-mid`, `left: 7px`
- Entry dot: `14px` circle, `--gal-surface` fill, `2px solid --gal-clay` border
- Date range: `--type-caption`, `--gal-text-faint`
- Location name: `--type-body`, weight 500, `--gal-text`
- Source badge on each entry (see 6f)
- Spacing: `space-y-6` (24px between entries)

**Sources footer:**
- Always visible at panel bottom
- Format: `Sources: Wikidata · Met · AIC` in `--type-caption`, `--gal-text-muted`
- `border-top: 1px solid --gal-border`

### 6e. Provenance gap state ("Provenance gap — help complete it")
This is a first-class content state, not an error. Designed to be beautiful and to
invite contribution. Never use warning colours.

**In the search dropdown (no results found):**
- Icon: a small horizontal dashed line (not an X, not a warning icon)
- Headline: "Record not yet found" in `--type-body`, `--obs-text`
- Sub-copy: "Try a different title or artist. Coverage is thin by design — only sourced, dated records appear here." in `--type-body-sm`, `--obs-text-muted`
- No error colors. Calm informational tone.

**In the provenance panel (work found but location chain empty):**
- Presented as a timeline entry with a hollow circle dot (not filled)
- Dashed border card: `border: 1px dashed --gal-border-mid`
- Headline in `--font-display`: "Provenance gap"
- Body: "No documented movement history found in structured sources (Wikidata P276, Met, AIC). Help complete the record." in `--type-body-sm`, `--gal-text-muted`
- Displayed with the same generous padding as a real entry — never collapsed
- After the gap card: a subtle "Why gaps exist" expandable note (not implemented in v1 — placeholder for future)

### 6f. Source / credibility-tier badges
Every visible fact on-screen — location entries, artwork metadata, timeline items —
carries one of these badges. Non-negotiable per honesty rules.

| Tier | Label | Background | Text | Border |
|------|-------|------------|------|--------|
| A — Institutional | `MET` / `AIC` | `rgba(212,168,83,0.10)` | `--obs-gold` | `rgba(212,168,83,0.25)` |
| B — Structured open | `WIKIDATA` | `rgba(111,141,125,0.12)` | `--obs-sage` | `rgba(111,141,125,0.25)` |
| Other / unknown | source string | `--obs-clay-dim` | `--obs-clay` | `--obs-clay-border` |

Style: `border-radius: --radius-sm; padding: 2px 6px; font-size: 0.625rem; font-family: --font-ui; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase`.

On gallery (light) background: use `--gal-*` variants of the same hue family.

---

## 7. Accessibility

- All text combinations must meet WCAG AA contrast (4.5:1 body, 3:1 large text).
- Focus states: `outline: 2px solid --obs-clay; outline-offset: 2px` on all interactive
  elements. Never remove the outline without a custom replacement.
- The provenance panel close button is `aria-label="Close provenance panel"`.
- Search input is `aria-label="Search artworks by title or artist"`.
- The globe container has `role="img" aria-label="Interactive globe showing art provenance"`.
- Reduced-motion: see Section 5. The globe's auto-rotation persists (it is spatial
  context, not decorative), but arcs render without animation.

---

## 8. Layout grid

Landing (full screen): globe takes 100vw × 100vh. Left sidebar overlays (z-10), right
panel overlays. Bottom search bar overlays. Globe is always behind (z-0).

Sidebar widths (desktop): left 280px, right 380px.
On tablet (< 1024px): left sidebar collapses to icon strip (not implemented in v1 — sidebar hides, museum pins clickable on globe). Right panel: 320px.
On mobile (< 768px): right panel becomes a bottom sheet (60vh), left sidebar hidden.

---

## 9. Do / Don't

| Do | Don't |
|----|-------|
| Use Cormorant for titles and serif moments | Mix weights randomly; always pick from the scale |
| Show every source badge, always | Hide or omit sources to look cleaner |
| Show gap states prominently and beautifully | Collapse gaps into a single dim line |
| Transition smoothly between observatory and gallery | Instant background swaps without CSS transition |
| Use space as a design element — generous margins | Cram the panel with every available field |
| Use clay sparingly — 1–2 accent elements per panel | Paint everything in the accent colour |
| Let the artwork image breathe — contain, never cover | crop or squish thumbnails to fit |
| Keep motion purposeful, 200–600ms | Add bounce, spring, or stagger effects |
| Write copy in the museum's editorial register | Use tech jargon ("API", "404") in UI copy |

---

## 10. Token quick reference (CSS variables)

```css
:root {
  /* Observatory (dark) */
  --obs-bg:           #0a0908;
  --obs-surface:      #131110;
  --obs-surface-2:    #1c1a17;
  --obs-border:       #2a2218;
  --obs-border-mid:   #3d3228;
  --obs-text:         #f6f1e8;
  --obs-text-muted:   #9a8f85;
  --obs-text-faint:   #5c5449;
  --obs-clay:         #c87855;
  --obs-clay-dim:     rgba(200,120,85,0.15);
  --obs-clay-border:  rgba(200,120,85,0.30);
  --obs-gold:         #d4a853;
  --obs-sage:         #6f8d7d;
  --obs-panel:        rgba(10,9,8,0.88);
  --obs-dropdown:     rgba(13,12,11,0.97);
  /* globe trio = runtime tokens (OBS.globeOcean/Land/Border in design-tokens.ts), NOT CSS vars */
  /* OBS.globeOcean #060504 · OBS.globeLand #7a5828 · OBS.globeBorder #a87848 */

  /* Gallery (light) */
  --gal-bg:           #f7f4ee;
  --gal-surface:      #ffffff;
  --gal-surface-2:    #ede9e2;
  --gal-border:       #d8d2c8;
  --gal-border-mid:   #b8afa3;
  --gal-text:         #1a1714;
  --gal-text-muted:   #6b6460;
  --gal-text-faint:   #9e9790;
  --gal-clay:         #b06840;
  --gal-clay-dim:     rgba(176,104,64,0.08);
  --gal-sage:         #4a6b5e;
  --gal-gold:         #a07830;

  /* Typography */
  --font-display: 'Cormorant Garamond', 'Georgia', serif;
  --font-ui:      'Pretendard', 'system-ui', sans-serif;

  /* Motion */
  --ease-gentle:    cubic-bezier(0.4,0,0.2,1);
  --ease-panel:     cubic-bezier(0.25,0.1,0,1);
  --ease-cinematic: cubic-bezier(0.16,1,0.3,1);

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

---

*This file is the single source of truth for visual decisions. Any deviation requires a
design-director decision and an update to this file before implementation.*
