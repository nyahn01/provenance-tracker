# Provenance Tracker — Progress Log

Append one entry per working session (newest at top). See AGENTS.md for the loop.

Template:
```
## YYYY-MM-DD — session title
- Shipped:
- Broke / fixed:
- Honesty gate caught:
- Next:
- Team/process improvement:
```

---

## 2026-06-17 — Strategy rescope + agent team setup + rename Alibi → Provenance Tracker
- Shipped: honest rescope of CLAUDE.md, DEMO_SCRIPT.md, TOMORROW.md; new BUSINESS_CASE.md;
  five-agent team in .claude/agents/; AGENTS.md orchestration + improvement loop; git initialized.
  Renamed from "Alibi" to "Provenance Tracker" throughout (product name, agent names, all docs).
  Dropped the "alibi angle" (provenance-integrity/theft/repatriation niche); now positioning as
  general-purpose, broad-appeal, multi-customer provenance tracker.
- Honesty gate caught (in review of original draft): demo claimed live cross-museum "on view" and a
  movement-arc for any work — not supported by Met/AIC `is_on_view` (own-collection only) or Wikidata
  P276 (~5.5% coverage). Rescoped to documented provenance + honest "gap" states.
- Strategy shift: globe = funnel; provenance DATA API to insurers/auction houses/registrars = product.
  Dropped €3 PDF as the model.
- Next: scaffold Next.js app; build priority-0 honest unscripted-search path before globe polish.
- Team/process improvement: established provenance-honesty-review as a BLOCKING gate before every ship.
