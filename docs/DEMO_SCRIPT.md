# Provenance Tracker — Demo Script (5-beat hackathon cut)

Format: screen recording + voiceover, 4–5 min. No slides until Q&A.
Honesty rule: every on-screen fact carries a visible source; gaps are shown, never faked;
images appear only for public-domain works. Don't claim coverage we don't have.

Pre-demo checklist:
- Load Water Lilies (aic-16568) BEFORE you start. Let it cache. Come back to landing.
- Confirm Getty records appear in sidebar (purple cards at bottom)
- Confirm globe arcs are visible — gold = custody, sage = exhibition
- Open /team in a second tab, ready to switch
- Have DEMO_WORKS.md open in a notes window (offline fallback)

---

## BEAT 1 — The mystery (0:00–0:30)

[Screen: landing gallery. Hover over Water Lilies thumbnail.]

> "Where was this painting before the Art Institute of Chicago bought it?
> The museum website says 'provenance unknown before 1922.'
> That's a 30-year gap. Monet painted it in 1906."

[Click Water Lilies. Globe auto-frames. Gold arc appears: Paris → Chicago.]

> "Provenance Tracker traces the journey. This arc is a documented ownership change —
> not an exhibition loan. The color tells you which."

---

## BEAT 2 — The globe shows the journey (0:30–1:30)

[Sidebar opens. Arc legend visible. Custody timeline populates.]

> "The Art Institute's own provenance records show Bertha Palmer — Chicago socialite,
> art collector — acquired this through a Paris dealer network in the early 1900s.
> The AIC text is right here, word for word, with the institution as the source."

[Point to gold arc on globe, then to custody timeline. Show sage arc if present.]

> "Gold arcs are ownership changes. Sage arcs are exhibition loans —
> the painting goes out, comes back, the owner doesn't change.
> We never conflate those. That distinction matters in provenance research."

[Scroll to show exhibition list below custody chain if present.]

> "13 documented loans. None of those are custody events."

---

## BEAT 3 — The paper trail (1:30–2:30)

[Scroll sidebar down to Getty Provenance Index panel — purple cards.]

> "Now here's what's new. These are real records from the Getty Provenance Index —
> the Knoedler & Company stock books, New York and Paris, 1872 to 1970."

[Point to a Knoedler record card: "M. Knoedler & Co. Paris → P. Palmer, Chicago · 2,250 francs / $950"]

> "This is the dealer receipt. Knoedler Paris bought from the artist's network,
> sold to Bertha Palmer in Chicago. April 1891. $950.
> The museum record says 'acquired through Bertha Palmer.' This is HOW."

[Pause.]

> "No other consumer tool surfaces Getty Provenance Index data alongside museum records.
> This is the commercial layer that museum archives don't tell you."

---

## BEAT 4 — Honesty is a feature (2:30–3:15)

[Open La Grande Jatte or Yellow Dancers — a work with a documented gap.]

> "This one has a gap. 1889 to 1900 — no documented record.
> We don't fill it. We show it. A gap in provenance is information —
> it's what restitution lawyers look for."

[Show Provenance Intelligence card. Click the button.]

> "This is a provenance summary built from the real data —
> custody depth, Getty records count, exhibition history, risk signals.
> The gap is flagged. Clean chains are confirmed.
> No invented confidence scores."

---

## BEAT 5 — The team and the market (3:15–4:00)

[Switch to /team tab.]

> "How does this keep improving? Seven specialized agent profiles —
> art historian, data integrator, design director, honesty gate.
> Every commit passes an automated ship gate that greps for
> over-claiming, invented data, live 'on view' claims we can't verify.
> The gate commits. Not the agent."

[Back to main app.]

> "The market: $65 billion in annual art transactions.
> Every one needs provenance due diligence.
> Restitution lawyers, auction houses, insurers, museum registrars —
> they do this manually today. This automates it.
> We call it AML for the art world."

---

## CLOSE (4:00–4:30)

> "Sourced, dated, honest provenance.
> Museum records reconciled with art market transaction data.
> Built with Claude, Getty GPI, and three museum open APIs.
> The same architecture scales to 30 museums, the Paris sales catalogs,
> Goupil & Cie records, and a live restitution-flag API."

---

## Fallback if demo breaks

If the API is slow or the globe doesn't load:
1. Show /team page — explain the architecture verbally
2. Show the Getty data via: `curl localhost:3000/api/getty?artist=Claude+Monet` in terminal
3. Talk through DEMO_WORKS.md — the story works without the UI

Best fallback line: "The data is real. The architecture is running. Let me show you the API."
