# Provenance Tracker · 바사해 — NotebookLM narration source (English)

> **How to use this file.** Drop it into NotebookLM as a source and ask it to generate an
> Audio/Video Overview. It is written as continuous spoken narration — one section per slide,
> no slide chrome, no "see the screenshot" references — so the generated voice flows naturally.
> Target length ~28–30 minutes when read at a relaxed pace. Pair it with the deck
> (`index-en.html`) if you want matching visuals.

**One-line summary for NotebookLM:** A solo builder explains how they built *Provenance Tracker* —
a sourced, gap-honest art chain-of-custody app on a 3D globe — in about a day and a half, using a
*team* of AI coding agents, and shares an honest retrospective on doing it solo. The throughline:
how the human worked less and the agents worked more.

---

## Opening — the hook

Hi everyone. This is Provenance Tracker. I built it for 바사해 — a "hackathon for busy people," where
the whole point wasn't really the product; it was the story of how you got the agents to do the work
for you. So in the next thirty minutes I'll do three things: first, show you the product and why it
exists; second — and this is the part people most want — exactly how I used a *team* of AI agents to
build it; and third, an honest personal review of doing a hackathon as a busy person, solo. The whole
story is really one sentence: how I worked less, and the agents worked more.

Let me start with a mystery. When Monet finished *Water Lilies* in 1906, it was in Paris. When the
Art Institute of Chicago acquired it, it was in Chicago. What happened in between? The museum label
says "provenance unknown before 1922." That's a sixteen-year gap in the ownership history of a
painting worth tens of millions of dollars. That gap is the whole reason this project exists.
Provenance — the documented chain of who owned a work, where, and when — is real, fascinating, and
almost never shown to the public.

## Part One — the project

So what is provenance, and why should anyone care? Provenance is the documented chain of custody of
an artwork — every owner, every dealer, every move, with dates. It matters in three ways. Legally:
roughly six hundred thousand works were looted during the Nazi era, and fewer than twenty percent
have been identified — so a gap between 1933 and 1945 is a red flag in restitution law. Commercially:
a clean, continuous chain of title is worth real money at auction. And intellectually, the gaps are
where the most interesting history hides. The key insight is this: the gap is not a failure of the
data — it's the most important part of it.

Now, anything that shows art data online has a credibility problem: how do you get people to trust
it? My answer is a hard honesty contract — five non-negotiable rules. Never claim a live "on view"
status, because no public API can actually verify it. Every fact on screen carries a visible source.
Sparse data is shown as a gap, never faked — no invented dates, no invented coordinates. Ownership
is never confused with exhibition loans — a loan is not a change of ownership. And images only appear
for public-domain works. The important part: these aren't good intentions. They're enforced
mechanically by a check that runs on every single change. I'll come back to that gate.

Here's the product. You land on a curated set of eight famous, public-domain paintings — Monet,
Seurat, Degas, Van Gogh, Cézanne, Cassatt — each chosen because it has deep, dated, scholarly
provenance. Behind them, a 3D globe. There's a legend that runs through the whole app: gold is
custody — a change of ownership; sage-green is an exhibition loan; and amber is a dealer transaction.
You pick a masterpiece, and we trace its documented journey.

Let me take Monet's Water Lilies. The moment you click, two things happen. The globe draws the gold
custody arcs — Paris, to New York, to Chicago — and a warm "gallery" panel slides in with the dated
timeline. Monet held it in Paris in 1906. It went to the dealer Durand-Ruel in Paris, then their New
York branch, then a Chicago collector named Ryerson, and finally the Art Institute. Every single stop
is dated, carries a badge telling you which archive documents it, and a confidence dot — green for
high, gold for medium, grey for low. Nothing here is invented; this chain is pre-parsed from the
museum's own scholarly provenance text.

And this is the part I'm proudest of. When our sources genuinely don't document a period, the app does
not invent a chain to look finished. It says, plainly: "No documented chain of custody found in our
sources." It still names the sources it checked — the Met, the Art Institute, Rijksmuseum, Wikidata —
it still credits the image, and it invites anyone to flag an error. For a restitution lawyer or a
historian, an honest gap is exactly the thing you need to investigate. Showing the gap honestly is
worth more than a confident lie.

One more layer. Museums document who *owned* a work — but not the dealers who *sold* it. For that we
use the Getty Provenance Index: handwritten stock books from the great American dealer Knoedler, who
operated from 1872 to 1970, plus the Goupil house. Forty-three hundred of those records are now public
domain, and they're seeded into the app. Degas's Yellow Dancers alone matches over two hundred of them.
Each record shows the seller, the buyer, the price, the date — and links back to the original ledger
scan. This is the commercial history museums simply don't surface.

A quick word on the data, because honesty starts here. We pull from eight live sources, ranked by
credibility. Tier A is museum-published and scholarly: the Met, the Art Institute, Rijksmuseum, the
Getty index, the Dutch RKD, Cleveland. Tier B is structured open data: Wikidata and Europeana. Here's
the honest reality most people get wrong — Wikidata only gives you about one location per work, the
current museum. It cannot produce a journey. The real chains live in the museums' own written
provenance text. Extracting that prose, geocoding it, and merging it with the dealer records — that's
the actual work.

## Part Two — the AI agent team

Now the part you actually came for — and honestly, the part the hackathon was really about. 바사해
didn't ask us to show a product; it asked us to tell the story of how the human worked less and the
agents worked more. When I demoed, the agent *team* was the thing people most wanted to copy. So: how
do you build all of this, solo, in a day and a half, without doing all the work yourself?

Honest origin story. I keep entering these hackathons because I love building good products *with good
people* — that's the part I enjoy most. This year, time forced me to go solo. And on top of that, I'd
grown tired of AI hype — there are so many tools, I'd stopped following. But I still wanted that team
feeling, so I set myself one goal for this hackathon: do a single project, but build it with a *team*
anyway — a team of agents. My constraints were brutal — minimal idea, minimal
tooling, minimal time, and because of my day job I only started a day and a half before the deadline.
Phase one was just talking. Claude Pro on the Sonnet model, and me, riffing on ideas. I mentioned I
love flight-trackers and ship-trackers, those beautiful open-source map products — and it suggested
the niche: art provenance. Educational, not grim, and genuinely useful. I want to be clear — I'm not
an expert, and this is not "the best way." It's an honest path from scratch, and I'm sharing it so
people with less technical background waste fewer tokens than I did.

Which brings me to my first honest mistake, and it's a common one. Early on I wired in a pile of
plugins and integrations — all of them, "just in case." The problem: every one of them loads context
into every turn, whether you use it or not. My first rough prototype cost far more in tokens than it
should have. The lesson is simple: start lean. Add a tool only when a specific task needs it. Context
you load is context you pay for, every single turn. If you're new to this, that one habit will save
you the most money.

Here's the team. Instead of one generalist assistant, I set up a studio of specialists — thirteen
agent profiles plus me as the orchestrator. Three groups do most of the work. The builders run on the
cheaper, faster Sonnet model: one owns the 3D globe and front-end, one owns the data and APIs, one owns
the information design — the timeline and the arcs. The domain experts run on Opus, the smarter model,
because their job is judgment: an art historian who ranks how trustworthy each source is, an insurance
advisor, a business strategist, a design director. And then narrative and the gate: one agent owns the
demo and pitch, and one — the honesty reviewer — can *block* a commit. There are also operations agents
for triaging feedback, and some that are wired but switched off. Each one has a written profile defining
its domain, so they don't step on each other. And this isn't just a config file — the team is documented
as a page on the live site, because being transparent about how the thing is built is part of the product.

So why does a team save effort instead of multiplying it? Four reasons. First, routing — each task goes
to the one specialist who owns that domain, so I'm not paying to re-explain context. Second, types-first:
the data agent defines the exact data shape before any interface is built, which stops the classic
failure where the UI invents fake data just to look finished. Third, parallelism — agents work in
separate copies of the repository, so several can build at once without stepping on each other's files.
Fourth, the work queue isn't a to-do list in a text file — it's GitHub Issues, where labels are the
grammar: "priority plus a domain" means build it, "proposal" means it's just an idea, "paused" means
skip it. And there's a hard budget cap — maximum tokens and maximum pull requests per run — in a single
config file.

This next idea is the single most important one in the whole system. Agents are confident — they'll
happily tell you "I built X, it works great." But an agent's prose report is a *proposal*, not a result.
So no agent is ever allowed to commit code directly. Every change goes through one script — the ship
gate. It does four things in order: it builds the app, it starts a real server, it runs a verify step
that checks both the data contract and the honesty rules against the running app, and only if all of
that is green does it commit. If the gate is red, the work simply does not exist — the agent has to fix
it and re-run. This is what lets me *not* read every line of every commit. The machine proves the work
is real, built, and honest.

Around that gate is a ring of guardrails, because the two risks with agents are that they *lie* —
overclaim, invent data — or that they *break* things. So: the honesty gate runs in continuous
integration on every pull request, searching for forbidden phrasings like "on view" or "probably owned
by," and for fake zero-zero coordinates. The build must pass under strict type-checking, and design
tokens can't silently drift. A metrics heartbeat takes an offline snapshot of data quality and warns
me if it's decaying. Security and secret-scanning keep keys out of the code. And the hard boundary:
agents never merge. Branch protection means a human — me — merges every change into the main branch.
The agents propose; I dispose.

Phase two is where it got fun. The night before, I'd write a big list of everything I wanted — I
literally had a file I thought of as "tomorrow." In the morning, I'd kick off a batch run, and then
I'd go to my actual job. While I was at work, the orchestrator was triaging that list out to the
expert agents, distributing the work in a way that saves tokens — because I'd told it to. And here's
the crucial detail: this only works because it runs in the cloud, not on my laptop. I tracked the
whole thing from my phone, watching pull requests land between meetings. For this I did pay for the
Max plan — I wanted the token budget rather than burning metered API credits, and honestly, paying to
learn was worth it.

For a while I bounced between phase one — hands-on, interactive sessions — and phase two — the batch
runs — across my laptop, my phone, my tablet. It produced a great demo, but also a mess: stale
half-features, plans I'd lost, sessions siloed on different devices. The fix was GitHub. When you plan
inside a chat session, that plan is ephemeral — if you don't finish it, it vanishes, and across devices
I lost a lot of them. So plans became GitHub Issues — durable, visible, promotable. And user feedback,
which I'd hated getting in my email, also became Issues: a triage agent reviews them, keeps the good
ones, and opens a pull request I can review. GitHub turned a pile of siloed sessions into one backbone.

The whole system is designed to grow along one axis. I think of autonomy as a dial — but the thing the
dial turns up is *initiation*: who starts the work. It never turns up *veto*: who gets the final say.
Stage one, where I am now, is manual — I open a session, agents build. Stage two is scheduled — a timer
reads the issue queue and runs the batch; it's wired but currently switched off. Stage three is the
vision: event-driven, where monitoring agents notice problems and file their own issues, and a
visionary-and-critic pair proposes the next direction. But notice
what's constant across all three stages: a human merges every change. The dial turns up how much the
agents can *start*; it never touches the human's final word. That's the safety model in one sentence.

## Part Three — an honest review, for busy people

If you take five things away, take these. One: do one session per feature. Scope it tightly, see it
through, ship it — don't leave ten things half-built. Two: a plan you don't finish is a plan you lose,
so move plans out of the chat and into GitHub Issues where they survive across devices. Three: GitHub
beats a to-do list in a text file — issues, labels, automated checks, and branch protection do the
bookkeeping for you. Four: guardrails don't just stop the agents from lying — they also stopped me,
with my clumsy git skills, from breaking the main branch. And five: start lean and avoid AI slop —
don't generate a thousand throwaway documents; keep one home for each fact.

A little perspective — this was my third year doing this. Year one, our AI club's hackathon, we built
an app for seniors; I learned to vibe-code, and it was a great team — inspiration, story, programming,
design, all clicking. Year two, similar synergy, we wired several tools together into a web app with a
witty touch. This year, year three, is the most "me" — it's full of my taste in story and philosophy,
and honestly, all those verification layers grew out of my own lack of knowledge, my need to not trust
blindly. It took the least time and it's the most complete thing I've made. But it was solo.

And that brings me to the honest tension at the heart of this. Building a real product out of nothing
but words and thoughts is astonishingly productive — and I'll admit, a little addictive. I'd type an
idea and watch the thing genuinely improve. That feeling is intoxicating. But it's also lonely. The
agents are powerful, they saved me enormous amounts of time, and they enriched this product far beyond
what I could have built alone in a day and a half. And yet — there's an energy, and a kind of
completeness, that only comes from a team of humans. I started by telling you I keep entering these for
the people. This year I proved I can ship without them — and honestly, it only made me more sure that I
don't want to. I missed that.

So where does it go? Phase three — the fully event-driven design — exists on paper, but it needs API
credits to actually run, and I'm not there yet. Now that the hackathon is over, what I most want is
real human feedback — expert critique. I want to redesign the agent team with everything I've learned.
But the real goal, the thing I'm actually chasing, is this: to max out these agent loops *inside* a
cooperative team of humans. Not agents instead of people — agents amplifying people.

I'll leave you with three words that sum up the whole thing. Build less — let a well-designed team of
agents do the building. Ship honest — make honesty a mechanical gate, not a good intention, because
that's the only moat that lasts. And bring people — because the agents are extraordinary, but they're
better with a team around them. That's Provenance Tracker. Thank you — and genuinely, I'd love your
feedback.
