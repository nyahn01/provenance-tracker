# Provenance Tracker — Elevator Pitches

Three versions for demo Q&A. Audience: museum technologists, restitution researchers,
hackathon judges, and art-curious general public. No Korean versions here — see DEMO_SCRIPT_KO.md.

---

## 30-second pitch (under 80 words)

Most museum websites say "provenance unknown before 1922." That gap can mean a looted work.
Provenance Tracker traces the custody chain — every documented ownership change, every dealer
receipt, every exhibition loan — on a live 3D globe. Sources cited on screen. Gaps shown
honestly, never faked. We reconcile records from the Met, Art Institute of Chicago, and the
Getty Provenance Index into a single, dated chain of custody.

---

## 2-minute pitch

**The problem.** Art provenance is scattered across museum websites, dealer archives, and
academic databases — in prose, in PDFs, in languages the buyer doesn't read. A collector or
researcher trying to verify clean title for a $2M work spends weeks stitching that together by
hand. A restitution lawyer searching for the 1933–1945 gap in a painting's ownership history
does it for every single case.

**What we built.** Provenance Tracker reconciles multi-source provenance records into one dated
chain of custody and renders it on a cinematic 3D globe. Each arc on the globe is a documented
event — gold for ownership change, sage for exhibition loan. We never conflate the two, because
that distinction is what courts and insurers care about. Every fact on screen carries a visible
source. Sparse data shows as a gap, not an invented date.

**Where the data comes from.** The Metropolitan Museum API, the Art Institute of Chicago API,
Wikidata, and the Getty Provenance Index — the Knoedler & Company stock books, 4,388 records
spanning Paris and New York, 1872 to 1970. All public data, zero fabrication.

**The business.** Explorer tier is free — the globe is the funnel. Researcher tier at €99/month
targets independent provenance researchers and journalists. Institution tier at €999/month serves
museums, auction houses, and restitution law firms with API access and conflict-flagging. The
moat is the reconciled, gap-flagged custody graph, not the raw APIs — those anyone can call.

---

## 5-minute pitch

**The question nobody can answer quickly.**

When Monet finished Water Lilies in 1906, it was in Paris. When the Art Institute of Chicago
bought it, it was in Chicago. What happened in between? The museum website says "provenance
unknown before 1922." That is a 16-year gap in the custody record of a painting worth tens of
millions of dollars. It is also, depending on what happened between 1933 and 1945, potentially
a legal problem.

This is not an edge case. The Commission for Looted Art in Europe estimates 600,000 artworks
were looted during the Nazi era. Fewer than 20% have been identified. The bottleneck is not
political will — it is research infrastructure. Provenance records are scattered across
hundreds of institutions in half a dozen languages, many of them in prose that has never been
parsed, indexed, or linked.

**What Provenance Tracker does.**

We take the documented provenance records from public museum APIs — the Met, the Art Institute
of Chicago, Wikidata, the Rijksmuseum — and from the Getty Provenance Index, which contains
the actual dealer stock books: Knoedler & Company's records of who bought what, from whom, for
how much, in Paris and New York from 1872 to 1970. We reconcile those fragments into a single,
dated chain of custody. We render it on a 3D globe so the journey is immediately legible —
Paris to Chicago, Berlin to New York, Amsterdam to London.

Every arc on that globe is a documented event. Gold arcs are ownership transfers. Sage arcs are
exhibition loans — the painting moves, but the owner does not change. We enforce that
distinction because courts and insurers enforce it. Every fact on screen carries a source line.
When the record is sparse, we show a gap. We never invent a date or a location to fill it.

**The gap between what exists and what we built.**

Existing collections-management tools — Gallery Systems, Artsystems, ArtBase — are databases
that a registrar types into. They do not reconcile across institutions. They do not flag custody
gaps. They do not tell you whether the 1938 entry and the 1946 entry describe the same
painting passing through two different dealer networks, or a different painting entirely.
We do.

**The people who need this most.**

Restitution law firms are the acute case. A firm like Rowland & Petroff, which has recovered
roughly $70M in looted works, bills provenance research by the hour on contingency-funded
cases. A tool that pinpoints the 1933–1945 gap in a custody chain and surfaces the relevant
dealer records saves days of billable research time. Those firms will pay €999 per month per
seat because one recovered work pays for years of the subscription.

Museum registrars are the expansion lane. They carry provenance burden on every acquisition,
every deaccession, every loan agreement. They do not need another database — they need a
reconciliation layer on top of what already exists. That is what we are building.

**Business model.**

Three tiers. Explorer is free — the globe and the curated stories are the funnel, they build
the credibility that makes institutions trust the paid product. Researcher at €99/month
captures independent researchers, journalists, and small dealers below the procurement
threshold. Institution at €999/month is the revenue driver: multi-seat access, API export,
conflict-flagging for acquisitions under review.

Honest serviceable ARR ceiling: roughly 2,700 accounts at a blended €4,000/year is an €11M
market. Niche, but defensible. The moat is the reconciled custody graph and the user
corrections that improve it over time — not the raw public APIs, which any competitor can
also call.

**What you are looking at today** is a working demo with real data: Water Lilies, traced from
Monet's studio to the Art Institute of Chicago, with Knoedler stock-book records filling part
of the gap, and the 16-year gap shown honestly where the record runs out. That is the product.
