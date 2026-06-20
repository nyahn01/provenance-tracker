---
sprint: "GitHub-native feedback loop (form → issue → triage agent → PR)"
status: shipped
approved: 2026-06-20
shipped: 2026-06-20
commit: 5dd7db5
goals:
  - Replace mailto: feedback links with a real in-app form at /feedback
  - POST /api/feedback files a labeled GitHub issue (no visitor account needed)
  - Email fallback when GITHUB_TOKEN is absent (graceful degradation)
  - feedback-triage agent: on-demand, reads open issues → writes feedback/ files → opens PR
  - Honesty gate updated to exclude feedback/ (user-quoted text may trip forbidden phrases)
files_touched:
  - src/app/api/feedback/route.ts (new — POST handler; rate limit 5/min, honeypot, GitHub API)
  - src/components/FeedbackForm.tsx (new — client component, design tokens matching marketing pages)
  - src/app/feedback/page.tsx (new — static shell; overflow: auto pattern; renders FeedbackForm)
  - src/app/pricing/page.tsx (modified — both mailto: CTAs → <Link href="/feedback">)
  - .claude/agents/feedback-triage.md (new — sonnet agent, docs-only, PR branch workflow)
  - .github/ISSUE_TEMPLATE/feedback.yml (new — structured issue form with feedback label)
  - feedback/README.md (new — naming convention + file format for triaged feedback)
  - scripts/honesty-check.mjs (modified — exclude feedback/ from path filter)
  - AGENTS.md (modified — feedback-triage in roster + ship-gate exception documented)
  - README.md (modified — GITHUB_TOKEN env var + Feedback section)
  - .env.local.example (modified — GITHUB_TOKEN documented with setup instructions)
  - .gitignore (modified — *_consult.txt excluded)
---

## Context

The user wanted feedback from visitors to flow into a structured, agent-reviewable
backlog rather than a raw inbox. Primary intake: in-app form (no GitHub account
required, right for the non-technical museum/researcher/lawyer audience). Fallback:
email link always visible. Triage: manual on-demand, not scheduled (scheduled triage
would need Anthropic API credits, currently blocked).

## Key decisions

**Intake = Both (form primary, email fallback)** — user confirmed. The email fallback
(`ahn.ny01@gmail.com`) always shows on the form; it's emphasized when the API returns
`{ fallback: 'email' }` or a 5xx.

**Triage = Manual / on-demand** — user confirmed. The `feedback-triage` agent is
invoked in a session ("triage feedback"), not on a schedule.

**Honeypot anti-spam** — hidden `website` field; non-empty → silent 200 drop, no issue
created. Standard pattern for forms without CAPTCHA.

**Rate limit** — 5 requests/min/IP (stricter than the default 20/min used by search).
Derived from `checkRateLimit(ip, 5, 60_000)` in `src/lib/cache.ts`.

**Graceful degradation** — no `GITHUB_TOKEN` → 503 `{ ok: false, fallback: 'email' }`.
Matches the project's pattern for absent API keys (Anthropic, Europeana). Form shows
email prominently rather than an opaque error.

**Ship-gate exception** — `feedback-triage` commits docs-only files under `feedback/`
via plain `git` + `gh` on a PR branch, never `src/`. Human-reviewed PR + `honesty-gate.yml`
CI provides equivalent guarantee to `ship.mjs`. All product-code commits still go through
`ship.mjs`.

**Honesty gate exclusion** — `feedback/` excluded from the diff-file filter in
`scripts/honesty-check.mjs`. Reason: feedback files quote real users verbatim; a user
asking "is this currently on view?" would trip the `currently on view` forbidden phrase
despite being a legitimate quote. Product code (`src/`, `public/data/`) remains fully gated.

## One-time manual setup (user)

1. Create fine-grained PAT at https://github.com/settings/tokens?type=beta
   — scope: `nyahn01/provenance-tracker`, permission: Issues: Read & write
   — add as `GITHUB_TOKEN` in `.env.local` and Vercel project env
2. `gh label create feedback --color FFDD00 --description "User feedback via in-app form"`

## API verification (curl, no token)

- `POST /api/feedback` with no body → 400 (validation)
- `POST /api/feedback` with valid body, no GITHUB_TOKEN → 503 `{ fallback: 'email' }`
- `POST /api/feedback` with `website` non-empty → 200 silent drop
- 6 rapid POSTs → 6th returns 429

## Commit

- `5dd7db5` feat(feedback): in-app form → GitHub issue intake with email fallback
