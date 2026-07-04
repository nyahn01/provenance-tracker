# 0007 — German-language credibility pass (small scope)

**Status:** accepted · 2026-07-04

## Context
The maintainer asked for "the website in German." The site has ~15,000+ words of English
prose across static essay pages, hand-authored case-study/work data, and live English
museum-API content — a full bilingual rebuild was scoped in detail but redirected, on cost/
credibility grounds, to a much smaller first step: a real German Impressum (the page already
targets German legal form — § 5 DDG, § 18 MStV — but was written in English, a credibility
gap for an actual German-speaking visitor) plus one fully-translated, globally recognizable
case study (*Portrait of Adele Bloch-Bauer I* — *Woman in Gold*), plus honest metadata
signaling the German content exists. This is deliberately not a `/de` mirror of the whole
site.

## Decision
- **Bilingual, `/de` prefix, no library/middleware.** A literal `src/app/de/...` directory
  (not a route group) serves the two new pages — Next.js needs no config for this, existing
  English URLs are byte-for-byte unaffected, and no `[locale]` segment, i18n library, or
  middleware is justified for two static pages.
- **Prose-overlay translation, not a duplicate data file.** `RestitutionCaseTranslation`
  (`src/lib/types.ts`) carries only text fields (`summary`, `currentStatusAsOf`,
  `custodyDetail[]`, `exhibitionDetail[]`, `gapNote[]`); `case-studies.de.ts` is a slug-keyed
  sidecar, not a parallel `RestitutionCase`. Facts — dates, holders, places, `kind`, citation
  labels/URLs — stay in `case-studies.ts` and render unchanged in both languages: they are
  proper nouns and legal citations, not prose to translate, and duplicating them would risk
  drift between language versions of the same case. `getCaseTranslated()` falls back to the
  English case if a slug has no German overlay — a missing translation is a gap, never a
  broken page.
- **Operator identity hoisted once.** `src/lib/operator.ts` is now the single home for
  name/address/email; both `/impressum` and `/de/impressum` import it.
- **`<html lang>` stays `"en"` everywhere; `/de/*` overrides at the element level.** The root
  layout renders `<html>`/`<body>` once for the whole app, so it can't be made conditional
  per-route without a bigger parallel-root-layout restructure that isn't justified for two
  pages. `src/app/de/layout.tsx` wraps its children in `<div lang="de">` instead — screen
  readers and hreflang-based SEO targeting both respect this; it's a documented, accepted
  limitation, the same spirit as the drift already called out in `design-tokens.ts`.
- **Honest, not overclaimed, SEO signaling.** Root `openGraph.alternateLocale: ['de_DE']`
  signals German content exists site-wide; `alternates.languages` (hreflang) is added only to
  the specific page pairs that actually have both versions (`/impressum` ↔ `/de/impressum`,
  and `/case/[slug]` ↔ `/de/case/[slug]` only for translated slugs) — never a blanket claim on
  routes with no German version.
- **Honesty gate extended, not restructured.** `scripts/honesty-check.mjs`'s `FORBIDDEN` array
  gained German equivalents of the existing English over-claiming patterns (real-time display
  claims, undated custody claims, speculative ownership) — a small, mechanical, locale-
  agnostic addition; the file-walking/comment-skipping logic is unchanged.
- **No language switcher, no locale-aware nav/footer.** Each of the two new pages carries its
  own single "In English →" / "Auf Deutsch →" link (the latter conditional on a translation
  actually existing) rather than threading a `locale` prop through `SiteNav`/`SiteFooter` for
  two pages.

## Consequences
- A German-fluent reviewer must read `/de/impressum` and `/de/case/adele-bloch-bauer-i` before
  this merges — legal notices and Nazi-era restitution history are precision-critical, and
  translation (even careful translation) can subtly shift meaning in exactly the way this
  project's honesty contract exists to prevent.
- Cross-language links out of the German pages (e.g. `/learn#provenance-gap`, which has no
  German version) are visibly labeled "(auf Englisch)" rather than silently mixing languages.
- A full bilingual site-wide build (every static page, both case studies, work "hook"
  descriptions, a real `locale`-aware nav/switcher, an explicit honesty verdict on which
  interactive/live-API routes can never be pre-translated) was designed in the same session
  and shelved, not rejected — it can be resumed as a follow-up if this small pass proves out.
