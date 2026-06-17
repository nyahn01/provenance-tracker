## Task

[Link to TOMORROW.md priority or describe feature]

## What changed

- [Describe changes concisely]
- [What files were added/modified]
- [What feature was built]

## How to test

1. [Step-by-step instructions]
2. [What to verify]
3. [Expected outcome]

Example:
```
1. npm run dev
2. Search "Starry Night"
3. Verify painting appears in detail panel with source badge "Met Museum"
```

## Honesty Checklist

- [ ] All on-screen facts have visible sources (Wikidata / Met / AIC / museum)
- [ ] No invented fields (no confidence scores, risk assessments without source)
- [ ] Sparse data shown as gap, not faked
- [ ] Unscripted search path tested (unknown painting degrades gracefully)
- [ ] No over-claiming (e.g., no "currently on view" without single-source certainty)
- [ ] Error states tested (API down, rate limit, no results)

## Breaking Changes

- [ ] None
- [ ] Yes, describe:
  ```
  - Renamed `painting.location` → `painting.locations[]`
  - Removed `painting.confidence` field (unscourced)
  ```

## Related Issues

Closes #[issue-number]
Related-to: TOMORROW.md priority [number]

---

### For Reviewers (Honesty Gate)

The `provenance-honesty-review` agent will check:
- ✅ No over-claiming
- ✅ All sources visible
- ✅ Graceful degradation
- ✅ No faked data

Comments with blockers or approval.
