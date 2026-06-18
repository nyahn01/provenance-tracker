# INSIGHTS — the running log of everything learned (never lose an insight)

Append-only. Newest at top. Every agent and every session drops insights here the moment
they appear — a finding, a dead end, a better source, a design decision, a risk. If it isn't
written to a file, it's lost when the context window rolls. This file is the safety net.

## Capture protocol (Claude Code ⇄ Obsidian best practice)
- **Write it down immediately.** Insight → one bullet here, tagged `#data #design #insurance
  #strategy #risk #process`. Don't wait for "later."
- **Durable cross-session facts** also go to `memory/` (Claude Code memory) with an index line
  in `memory/MEMORY.md`. Insights here are the stream; memory/ is the curated, recalled set.
- **Decisions** (we chose X over Y, and why) go here AND, if they change the spec, into the
  relevant doc ([[CLAUDE.md]], [[BUSINESS_CASE.md]], [[DESIGN_SYSTEM]], [[DATA_SOURCES]]).
- **Wikilink liberally** so Obsidian's graph view connects everything: `[[note-name]]`.
- **Nothing important lives only in chat.** Chat is volatile; files are the record.
- The loop appends a one-liner here each cycle (what was learned), separate from `MORNING.md`
  (what shipped). MORNING = status; INSIGHTS = knowledge.

---

<!-- append insights below, newest first -->

- `#process` Agents' prose reports are proposals, not results — only `scripts/ship.mjs` (build +
  live contract verify + honesty grep) makes work real. A "build passes" green check hid a fully
  broken provenance route once. See [[agent-workflow-preferences]].
- `#data` Wikidata exact-label match misses works with em-dashes/date suffixes (e.g. "A Sunday on
  La Grande Jatte — 1884" returned no P276). Need normalized + altLabel + artist-title matching.
- `#data` Coverage is thin by design (Wikidata P276 ≈ 5.5%). The fix is more sources + honest
  credibility tiers, not invented data. See [[DATA_SOURCES]].
- `#design` Current hackathon UI judged "hideous" — bar is now museum/gallery quality. New
  `design-director` owns the system; see [[DESIGN_SYSTEM]] (to be authored).
