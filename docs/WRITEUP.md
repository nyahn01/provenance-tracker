# Running a supervised-autonomy agent team on a solo project

*How this project uses Claude Code agents without letting "autonomous" erode the one thing
it sells — credibility. Closes issue #150.*

I'm building [Provenance Tracker](https://provenance-tracker-tan.vercel.app) alone, nights and
weekends: a tool that shows the documented chain of custody for famous paintings, sourced from
museum APIs, with every gap in the record shown honestly instead of papered over. The product
is small. The part I think is actually worth writing about is how it gets built — a team of
Claude Code agents that sense, triage, build, and propose, with a human (me) as the gate, not
the bottleneck.

This is a write-up of what that looks like in practice: the mechanism that keeps it honest, the
label convention that separates "an agent had an idea" from "work is queued," two ways the globe
visualization broke in the process, and why the backlog lives in GitHub Issues instead of a
TODO.md that nobody re-reads.

## The honesty contract as CI, not as a prompt

The product's entire premise is that provenance data is often incomplete, and incompleteness
should be shown, not hidden. That's an easy rule to state in a system prompt and a surprisingly
easy one for an agent to quietly violate under time pressure — a plausible-sounding fallback
value here, a "currently on view" claim there, because it makes a demo screenshot look more
finished.

So the rule isn't a sentence in `CLAUDE.md` that agents are trusted to remember. It's
`scripts/honesty-check.mjs` — a script that greps every diff for a fixed list of forbidden
patterns and fails the build if it finds one. A few real entries from that list:

```js
{ pattern: /currently (held|housed|located|owned) (at|by)/i,
  reason: 'Present-tense custody claim without a date — add a dated source' },
{ pattern: /\blikely (owned|held|passed through)\b/i,
  reason: 'Speculative provenance — mark as gap instead' },
{ pattern: /"lat"\s*:\s*0[,\s}]/,
  reason: 'Null-island lat:0 in data — use null for unknown coordinates' },
```

It's deliberately dumb — a regex, not a model judging its own output. That's the point. A
mechanical gate can't be talked into an exception the way a person (or another model) can be.
It runs on every PR in CI, alongside the build and the test suite, and it's a **required**
check on `main` — no PR merges without it passing, agent-authored or not.

The interesting failure mode this catches isn't an agent lying. It's an agent being
*helpful* in a way that quietly breaks the contract: filling a missing city with a plausible
guess so the map looks fuller, or writing "on view" because it reads better than "as of the
museum's last public record." A prompt says "don't do that." A grep that fails the build says
it can't ship regardless of how reasonable it felt in the moment.

## Proposal vs. priority: separating ideation from execution

Every agent in this project — data integration, globe visualization, business strategy, a
dedicated honesty reviewer — can open a GitHub issue at any time with an idea. What it can't do
is decide that idea is worth building. That split is enforced with two labels:

- **`proposal`** — an agent's idea. Ideation, not a commitment. Anyone (well, any agent) can file
  one; nothing happens as a result.
- **`priority` + `agent:<domain>`** — queued, human-approved work. Only a human relabels a
  `proposal` to `priority`. That relabel is the entire "go" signal in the system.

This sounds like a small distinction but it changes the shape of the whole workflow. Without
it, "the agent thought this was a good idea" and "this is what we're building next" collapse
into the same signal, and an autonomous system with enough initiative starts building whatever
it thinks is good — which is a fast way to end up with a feature nobody asked for and a backlog
nobody trusts. With it, agents get to be prolific about ideas (cheap, reversible, useful) while
a single human click remains the only thing that turns an idea into committed work.

The project's autonomy model (`docs/decisions/0002-stage3-autonomy-model.md`) generalizes this
into one invariant: *agents may do anything except cross an irreversible or outward-facing
line — merge to `main`, close a user's feedback issue, publish — without a human.* Promotion,
merge, and closing feedback are the three lines. Everything else — sensing, triaging, building,
opening draft PRs — is fair game for full autonomy.

## What broke (twice) — and what that taught me about "green"

The 3D globe is the visual centerpiece of the landing page, and it broke in the same general
way twice within one week, both times from an agent trying to improve it:

**Break 1 — the orange glow.** `globe.gl`'s `showAtmosphere(true)` with any warm
`atmosphereColor` wraps the whole sphere in a warm glow that composites additively over both
land and ocean — no amount of retuning the hex fixed it, because the glow itself was the bug,
not the color value chosen. The fix was to kill the atmosphere entirely and set the ocean color
through the underlying Three.js material instead.

**Break 2 — black noise on zoom.** The immediate follow-up fix used
`onGlobeReady` + `scene.traverse(...)` to walk the internal mesh materials directly — which
caused z-fighting and black rendering artifacts whenever a visitor zoomed in. The eventual fix
was almost comically low-tech: bake a 2×2 canvas to a data URL for the ocean texture instead of
touching the Three.js scene graph at all.

Neither break was caused by an agent doing something reckless — both were reasonable-looking
changes to code that has surprisingly few safe entry points. What actually fixed this for good
wasn't a smarter agent; it was writing the constraint down as an explicit, checkable contract.
`CLAUDE.md` now carries a locked init pattern for the globe with an explicit list of *specific
API calls that are never allowed* (`showAtmosphere(true)`, `scene.traverse(...)`,
`material.shininess`, disabling zoom) and instructs every agent to do only what a task strictly
needs there, nothing adjacent. It's a narrow, ugly-looking rule. It has held since.

The broader lesson generalizes past the globe: **a green build is not the same claim as
"this works."** Once, a PR's build passed cleanly while the actual `/api/provenance` route was
fully broken underneath it — the build check only proves the TypeScript compiles, not that the
product does what it claims. The fix was `scripts/ship.mjs`: a pipeline that builds, serves the
app, exercises the real routes against live contracts, and only then runs the honesty grep.
Agents' prose descriptions of what they did are proposals. The gate — build, live-contract
verify, honesty check — is what makes something real, and it doesn't care what the PR
description says.

## The queue lives in GitHub, not in a markdown file

Early on, "what to build next" lived in a `TOMORROW.md`-style file that agents would read,
edit, and inevitably let drift out of sync with what was actually in flight. It's a familiar
failure mode: a TODO file nobody fully trusts because it's always slightly stale, so people
stop checking it, so it gets staler.

The fix was to delete the concept of a markdown backlog entirely. A priority is an open GitHub
Issue labeled `priority` + `agent:<domain>`; a PR with `Closes #N` auto-closes it on merge. The
queue self-cleans — there's no separate "mark this done" step to forget, because merging *is*
marking it done. The GitHub Projects board is just a read-only view over the same Issues, kept
because it's legible from a phone in a way a `gh issue list` isn't.

This matters more than it sounds like it should, for one reason: a markdown queue is a second
copy of the truth, and second copies rot. An Issue with labels *is* the truth — there's no
sync step to skip, and "is this actually still open" is a question GitHub answers directly
instead of a question a stale file might be lying about.

## What this adds up to

None of these four things is exotic on its own — CI gates, label conventions, locked-down
init code, issue-tracker-as-backlog are all familiar practices individually. What's been worth
writing down is that together they let a solo project run something that behaves like a small
autonomous team — sensing its own bugs, proposing its own ideas, building drafts overnight —
without the credibility risk that "autonomous" usually implies for a product whose entire pitch
is "we show you the truth, including the gaps." The honesty gate is what makes it safe to let
agents move fast; the proposal/priority split is what keeps a human's judgment as the only path
from idea to committed work; and the two globe incidents are the concrete reminder that even a
reasonable-looking agent change needs a mechanical contract behind it, not just a good prompt.

— *Full architecture in `docs/decisions/` and `AGENTS.md`; the honesty gate itself is
`scripts/honesty-check.mjs`, and it runs on this repository's own PRs, including the one that
shipped this write-up.*
