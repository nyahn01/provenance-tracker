# 0003 — STORM-style curation pipeline (multi-perspective, conflict-surfacing)

- Status: proposed
- Date: 2026-06-29
- Related: `0002-stage3-autonomy-model.md`, `docs/BUSINESS_CASE.md` (25-works gate), `docs/VISION.md`

## Context
Featured works are curated by hand, one at a time (`scripts/preparse-provenance.mjs`,
`src/lib/featured.ts`). The product gate in `docs/BUSINESS_CASE.md` wants **25 curated works**; we
have ~10. Curation — not infrastructure — is the bottleneck.

Stanford's **STORM** method (Shao et al., 2024) generates cited, encyclopedic articles on an unknown
topic via multi-perspective question-asking against retrieved sources. Its three ingredients already
exist in this repo but are **not wired into a loop**:

- **Perspectives** — the `art-historian`, `art-insurance-advisor`, and `provenance-strategy` agents
  (`.claude/agents/`).
- **Retrieval-grounded expert** — `/api/search` + `/api/provenance` already parallel-query
  Met/AIC/RKD/Wikidata/Getty (`Promise.allSettled`).
- **Citation-first output** — `LocationEntry.source`, `confidence`, and `CaseSource[]` in
  `src/lib/types.ts`, enforced by the honesty gate.

A provenance write-up for one artwork *is* a STORM article: multi-source, multi-perspective, and
citation-grounded. The gap is the loop, not the parts.

## Decision
Add a STORM-style curation pipeline (`scripts/curate.mjs`) that turns one candidate work into a
reviewable, fully-sourced **draft**:

1. **Retrieve** — call the existing provenance/search routes; collect each source's raw prose +
   records.
2. **Question-ask (perspectives)** — for each of the three perspective agents, generate the
   questions that perspective would ask of the sources (scholarship / risk / market), grounded only
   in retrieved text.
3. **Reconcile + surface conflicts** — merge per-source `LocationEntry` fragments. **Non-negotiable
   rule unique to this ADR:** when sources disagree (e.g. AIC 1891 vs Getty 1892), emit an explicit
   `conflicts[]`/gap note and **never** collapse to a single fabricated "consensus" value. A conflict
   is a visible gap, consistent with the honesty contract.
4. **Draft outputs** — write (a) a `LocationEntry[]` chain in the same shape as
   `src/lib/featured-provenance.json` and (b) a cited essay to
   `vault/agents/findings/<date>-<slug>.md` (from `vault/_templates/agent-finding.md`).
5. **Gate** — run `npm run honesty` + `scripts/verify.mjs` on the draft. Nothing commits if red.

The output is a **proposal for human review**; it never auto-merges (per ADR 0002: autonomy is a dial
on *initiation*, never *veto*). It reuses existing routes, scripts, agent profiles, and types — **no
schema change is required**.

## Consequences
- Curation scales from a hand operation to a reviewable agent run → real progress toward the
  25-works gate.
- The `vault/` is populated as a byproduct (the project's documented knowledge-flow), not a second
  knowledge base.
- **New maintenance surface:** `scripts/curate.mjs` and its prompts. Mitigated by a known-answer
  test — regenerate Water Lilies (`aic:16568`, already featured) and diff against the committed
  chain in `featured-provenance.json`.
- **Cost:** each run makes Claude calls (extraction + per-perspective questions). Bounded by running
  on-demand (not on a cron) and by the existing per-call `max_tokens` guards; featured output stays
  pre-parsed so there is zero *runtime* cost added.
- **Rejected alternatives:** switching agent runners / redesigning (discards the orchestration moat);
  adding more MCP servers or skills (context bloat, doesn't address the real constraint); a separate
  "LLM wiki" (the `vault/` already is one — let the pipeline populate it).
