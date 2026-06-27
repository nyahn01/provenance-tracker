# Setup Journey — the narration script

The notes behind the ~30-minute walkthrough video: how this project was built as an
agent-run codebase with honesty as its moat. Eight beats, each a slide-able section
with the exact commands to show on screen. Reconciled to how the repo works *today*
(GitHub-Issues queue, Vercel previews, deterministic fallback when a Claude call fails) — not
the original draft's markdown queue.

> Tone: tell the *journey* (why these choices), then *demo* the product. Keep claims
> honest on camera — the same rule the app lives by.

---

## Beat 1 — Why agents (≈3 min)

**The problem.** Provenance is messy: a work's history is split across museum prose,
dealer ledgers, and structured open data, each partial and differently formatted.
Reconciling that reliably — and *honestly* — is more than one prompt can hold.

**The thesis.** A small team of specialized agents, each owning a domain and a rule set,
beats one generalist prompt. Honesty is the moat: the product is only worth trusting if
gaps are shown, not faked. So the workflow is built to make over-claiming *mechanically
hard*.

Show: the live site (`/`), pick a featured work, trace its journey, point at a gap.

## Beat 2 — Project bootstrap (≈4 min)

`CLAUDE.md` is the constitution — it loads on every agent turn and carries the
non-negotiables: the honesty rules, the "one fact, one home" table, design tokens, and
the locked **globe contract**.

Show:
```bash
sed -n '1,40p' CLAUDE.md          # honesty rules + one-fact-one-home
cat .claude/settings.json         # SessionStart hook: ff-sync + warn on stale/dirty tree
```
Point out: `docs/VISION.md` is the north star agents read for *intent*; `CLAUDE.md` for
*rules*. Neither restates the other.

## Beat 3 — The agent team (≈4 min)

Eleven roles in `.claude/agents/`, chosen so each owns one domain: `provenance-globe`
(UI + token fidelity), `provenance-data` (APIs + reconcile), `provenance-story`,
`provenance-strategy`, specialists (`design-director`, `dataviz-engineer`,
`art-historian`, `art-insurance-advisor`), `feedback-triage`, and the blocking
`provenance-honesty-review`.

**Model tiers:** sonnet for builders (mechanical edits, cheap), opus reserved for
review/strategy/honesty (judgment). Don't burn opus on a rename.

**Why a *blocking* honesty gate:** credibility can't be a best-effort. The review agent
plus `npm run honesty` in CI must pass before anything merges.

Show: `ls .claude/agents/` and open `provenance-honesty-review.md`.

## Beat 4 — The ship gate (≈3 min)

Agents never `git commit` raw product code. `scripts/ship.mjs` is the gate:
build → serve → verify (`scripts/verify.mjs` hits `/api/search`, `/api/provenance`, and a
depth check on a known work) → honesty grep → only then commit.

Show:
```bash
npm run build        # production build + strict type check
npm run honesty      # static honesty check on the diff
npm run ship         # the full gate
```
Lesson on camera: *the gate proves behavior + honesty, not pixels* — which is why visual
work is additionally checked against screenshots (Beat 8).

## Beat 5 — The queue + loop (≈4 min)

The work queue lives in **GitHub Issues**, not a markdown file. A priority is an open
Issue labeled `priority` + `agent:<domain>` (`paused` to skip). The batch workflow
(`.claude/workflows/batch-agent-squad.mjs`) reads `gh issue list --label priority`,
routes each to its specialist, branches, builds, runs the honesty gate, and opens a PR.
A PR with `Closes #N` auto-closes the issue on merge — the queue self-cleans. The
Projects board is the phone-readable view.

`main` is protected: PR required, honesty + build checks must pass, no direct pushes.
**Agents never merge — the human does.**

Show: the Projects board, an open `priority` issue, a PR with its Vercel preview link.

## Beat 6 — Proposing direction without autopilot (≈3 min)

How the system suggests a *better* idea without running away with it: ideation is filed
as an open Issue labeled **`proposal`** (not `priority`). It's a suggestion, not queued
work. The **human promotes** one by relabeling it `priority` + `agent:<domain>`; only
then does the batch workflow build it.

Two human checkpoints — *proposal → priority* promotion, and *PR → merge* — are what keep
the agent team a teammate, not an autopilot. (See `docs/VISION.md`.) This reuses the
GitHub-Issues queue; no separate file, no automation that can build unreviewed work.

## Beat 7 — Skills & MCP (≈3 min)

What's connected and why:
- **GitHub** (MCP / `gh`) — PR and issue operations inside the loop.
- **Vercel** — auto-deploy on push to `main`, a preview per PR via `vercel[bot]`; the
  place to verify a change against a real URL and read runtime logs back.
- **Honesty + build CI** — the blocking gate on every PR.

On **API vs subscription:** building the project with Claude Code is separate from the
*product's own* runtime Claude calls (prose extraction + `/api/reconcile`), which are
Anthropic-API-billed. When those credits are absent the product uses its deterministic
fallback — so **the demo needs zero API spend**. Featured works are pre-parsed
(`scripts/preparse-provenance.mjs`) for zero runtime cost.

## Beat 8 — Lessons (≈3 min)

The hard-won ones, worth telling honestly:
- **The globe contract.** The globe init broke twice (orange atmosphere; black noise on
  zoom). It's now locked in `CLAUDE.md` with the exact approved init — touch only what a
  task needs. A cautionary tale about "improving" adjacent settings.
- **Token drift.** The same palette was redefined inline in several files and silently
  diverged. Fix: one source of truth (`src/lib/design-tokens.ts`); never restate a hex
  in markdown — it rots.
- **The gate proves behavior, not pixels.** Build + honesty can't catch a color
  regression, so visual changes are checked against before/after screenshots.

Close on the product: open a work, show the dated chain, the sourced badges, an honest
gap, and the deterministic Provenance Intelligence card. The story *is* the sourcing.

---

*Optional:* regenerate these beats as slides later via a pptx skill — out of scope here.
