# Feedback

Triaged user feedback. Each file here is one piece of feedback that the
`feedback-triage` agent judged genuinely useful and worth keeping in the
repository as a durable record and backlog input.

## How feedback flows

```
visitor → /feedback form → /api/feedback → GitHub issue (label: feedback)
                                                  │
                          feedback-triage agent (manual, on-demand)
                                                  │
                  valid?  ── yes ──→ feedback/YYYY-MM-DD-<slug>.md  →  PR  →  you review/merge
                          ── no  ──→ labeled & noted in the PR description, issue left open
```

The agent only files **valid, actionable** feedback here. Spam, duplicates, and
out-of-scope requests are not saved — they're noted in the triage PR description
and the source issue is left open for you to close.

## Naming convention

```
feedback/YYYY-MM-DD-<short-kebab-slug>.md
```

- `YYYY-MM-DD` — the GitHub issue's creation date.
- `<short-kebab-slug>` — a few words capturing the gist (e.g. `vermeer-missing-loan`).

## File format

```markdown
---
issue: 42
date: 2026-06-20
author: <github-handle or "anonymous">
category: bug | data-correction | feature | ux | general
priority: high | medium | low
status: triaged
---
## Summary
One-line distillation of the feedback.

## Original feedback
> Verbatim quote from the issue. Never paraphrased, never invented.

## Assessment
Why it's valid / actionable. Links to related code or [[memory]] if relevant.

## Recommended action
The concrete next step (a file to change, a work to add, a follow-up to make).
```

Once feedback is acted on, update `status:` (e.g. `addressed`) or move the file
under a `feedback/done/` subfolder — your call.
