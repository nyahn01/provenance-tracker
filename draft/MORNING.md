# MORNING report — read this first

This is the single thing to check when you wake up. The loop appends one block per
cycle below. Newest at the top.

## How to verify in 60 seconds
1. `git log --oneline -15` — every commit here passed the ship gate (build + live
   contract + honesty grep). Commits are real, verified work.
2. `npm run verify` — re-runs the live gate now. Must print `✓ GREEN`.
3. Open the app (`npm run dev` → localhost:3000), search a painting, click a result —
   confirm it shows real sources and an honest gap state where data is thin.
4. Anything below marked **BLOCKED** is where I need your judgment.

## Cycle log format (the loop appends these)
```
### <cycle n> — <backlog item> — <SHIPPED | BLOCKED>
- agent: <which agent>
- gate: <GREEN | which stage failed>
- commit: <hash + message>   (or)   blocked because: <reason + what it tried>
- note: <anything the human should know / any idea or assumption flagged>
```

---

<!-- loop appends below this line -->
