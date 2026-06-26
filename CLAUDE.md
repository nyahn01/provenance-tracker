# Provenance Tracker — operating contract (read first)

Curated, rigorously-sourced provenance storytelling: famous paintings shown with a dated,
fully-sourced **chain of custody** — every gap honest, exhibition loans kept separate from
ownership. Audience: museums, educators, the art-curious. A method proof-of-concept for future
B2B due-diligence. **Not**: an insurance-grade API, live "where is it now" tracking, or
exhaustive coverage.

## Honesty rules (non-negotiable — these protect credibility)
- NEVER claim live cross-museum "currently on view" status — no public API supports it.
- Every on-screen fact carries a visible source (Met / AIC / Rijksmuseum / Wikidata / Cleveland / Getty / RKD).
- Sparse data is shown as a gap, never faked. No invented dates, coordinates, or risk scores.
- Custody (ownership) is never conflated with exhibition loans (a loan is not a move).
- Images shown ONLY for public-domain works, credited to the institution.
- The unscripted-search path degrades gracefully and honestly.

The honesty gate (`npm run honesty`, CI on every PR) enforces these mechanically.

## One fact, one home (anti-slop — do not duplicate state)
| State | Single source of truth |
|---|---|
| Visual tokens (colors/fonts) | `src/lib/design-tokens.ts` — never restate hex anywhere else |
| Data shapes / types | `src/lib/types.ts` (types-first: add the shape here before any other file) |
| What to build / in-flight / done | **GitHub Issues + Projects board** (not markdown queues) |
| Durable rules / contracts | this file |
| Decisions / accepted plans | `docs/decisions/` (ADRs) |
| Research / strategy / lessons | `vault/` + `docs/` |

Rules: link, never copy a value. Before creating a doc, evolve an existing one. No dated/dormant
files — done work closes an Issue; a lesson merges into `docs/lessons.md`. Keep this file lean
(~150 lines max) — it loads on every turn of every agent.

## ⚠️ GLOBE CONTRACT — read before touching StoriesApp.tsx / GlobeContainer.tsx
The globe init is locked (it has been broken twice). Tokens live in `src/lib/design-tokens.ts`
(`OBS.globeOcean/globeLand/globeBorder` = `#060504 / #7a5828 / #a87848`). Init pattern:

```typescript
// ✅ the only approved globe init:
const oc = document.createElement('canvas'); oc.width = 2; oc.height = 2
const ox = oc.getContext('2d')!; ox.fillStyle = '#060504'; ox.fillRect(0, 0, 2, 2)
globe.globeImageUrl(oc.toDataURL()).backgroundColor(OBS.bg).showAtmosphere(false)
// ❌ NEVER: showAtmosphere(true) / atmosphereColor(...) (turns globe orange);
//           scene.traverse(...) (black noise on zoom); material.shininess (breaks depth);
//           enableZoom = false (zoom must stay enabled)
```
If a task needs globe init, do ONLY what's needed — don't "improve" adjacent settings.

## Design tokens
Source of truth: `src/lib/design-tokens.ts`. Three palettes coexist on purpose and are NOT
interchangeable: `OBS` (dark app chrome + globe), `GAL` (light detail panel), `MARKETING`
(static pages). Known intentional drift is documented in that file's header. Font: Pretendard.
Do not put hex values in markdown — they rot (see the file header note).

## Tech stack
Next.js 16 (App Router) · TypeScript (strict) · Tailwind · Globe.gl (dynamic import, `ssr:false`)
· Pretendard (CDN) · Anthropic SDK (`claude-sonnet-4-6`) · Vercel (auto-deploy on push to main;
preview per PR via `vercel[bot]`).

## APIs (all keyless unless noted — full detail in docs/data-sources.md)
Met · AIC · Rijksmuseum Linked Art · Wikidata SPARQL · Cleveland · Getty GPI (Knoedler+Goupil
seeded via `scripts/seed-goupil.mjs`) · RKD (`src/lib/rkd.ts`) · Europeana (`EUROPEANA_API_KEY`).
**Anthropic API is OUT OF CREDITS** — extraction falls back to deterministic prose mining; do
not call `/api/reconcile` in the demo.

## Coding rules
- TypeScript strict. Never hardcode keys — always `process.env`.
- Globe.gl dynamically imported with `ssr: false`. Tailwind for all styling.
- All external API calls go through Next.js API routes (server-side only). Cache/pre-warm
  responses; add per-IP rate limiting (we proxy rate-limited free APIs).
- Types-first: new data shapes go in `src/lib/types.ts` before any other file.
- Conventional commits. One PR per Issue (`Closes #N`). Commit early, push often — uncommitted
  work doesn't travel across devices.

## Work tracking (queue lives in GitHub, not files)
A priority = an open Issue labeled `priority` + `agent:<domain>` (+ `paused` to skip). A PR with
`Closes #N` auto-closes it on merge — the queue self-cleans. The Projects board is the at-a-glance
view (readable on phone). The batch workflow reads `gh issue list --label priority`, not markdown.

`main` is protected by the `protect-main` ruleset (PR required, honesty+build checks must pass,
no direct pushes). Approvals are intentionally OFF for the solo maintainer — see
`docs/decisions/0001-branch-protection-solo-dev.md`. Agents NEVER merge; the human merges.

## Agent team (definitions in .claude/agents/)
`provenance-globe` (globe/UI + token fidelity) · `provenance-data` (Wikidata/Met/AIC/RKD, reconcile,
honest empty states) · `provenance-story` (demo/narrative) · `provenance-strategy` (business case) ·
`design-director` / `dataviz-engineer` / `art-historian` / `art-insurance-advisor` (specialists) ·
`provenance-honesty-review` (BLOCKING gate: overclaiming, missing sources, faked data) ·
`feedback-triage`. Each profile owns its domain rules — don't duplicate them here.

## Workflow
Read this file + open Issues at session start. Branch `feat/<domain>/<slug>`. Build →
`npm run build` (fix all TS errors) → `npm run honesty` → open PR (do NOT merge; human gate).
Verify against the PR's Vercel preview URL. Run `npm run build` before every push.
