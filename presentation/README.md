# Presentation — Provenance Tracker · 바사해

A 30-minute talk in two versions, built to match the project's own Observatory design language
(near-black, gold/sage/clay, Cormorant Garamond + Pretendard). Three parts: **the project**,
**the AI agent team** (the headline — how the human worked less and the agents worked more), and
**an honest hackathon retrospective for busy people**.

## Files

| File | What it is |
|---|---|
| `index-en.html` | **English deck** (Reveal.js). Also the cleanest narration for NotebookLM visuals. |
| `index-ko.html` | **Korean deck** — fluent KR, English terms glossed inline. The live-stage version. |
| `notebooklm-script-en.md` | Flat English narration (one block per slide). **Feed this to NotebookLM** to generate the Audio/Video Overview. |
| `SHOT_LIST.md` | What's already captured vs. what to shoot live from the deployed site. |
| `theme.css` | Shared Observatory theme (mirrors `src/lib/design-tokens.ts`). |
| `assets/` | Real screenshots (auto-captured via Playwright). |
| `vendor/` | Reveal.js + fonts, self-hosted — **the decks work fully offline** (no CDN, venue-wifi-proof). |

## Present it

Open `index-en.html` or `index-ko.html` in any modern browser.

- **Arrows / Space** — navigate.
- **`S`** — speaker-notes view (notes carry the narration + rough timing per slide).
- **`F`** — fullscreen · **`Esc`** — slide overview · **`?`** — all shortcuts.

The decks are self-contained: no build step, no network. Just open the file.

## NotebookLM video (English)

1. Open NotebookLM → new notebook → add `notebooklm-script-en.md` as a source.
2. Generate an Audio or Video Overview. The script is written as continuous spoken narration so the
   voice flows naturally (~28–30 min).
3. Optionally screen-record `index-en.html` alongside for matching visuals.

## Before the talk

- Replace the two live-demo **placeholders** (populated custody chain; Getty dealer record) with
  real captures from the **deployed** app — see `SHOT_LIST.md`. (Museum APIs are blocked on
  localhost, so those moments must come from the live site or be shown live on stage.)
- Every on-screen number traces to a repo doc (cited on each slide's source tag) — consistent with
  the project's honesty contract.
