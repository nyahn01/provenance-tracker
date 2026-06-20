# Provenance Tracker — Elevator Pitches

Three versions for demo Q&A. No Korean needed here — see DEMO_SCRIPT_KO.md.
Honesty rule: every claim maps to a fact in BUSINESS_CASE.md or the live app.

---

## 30-second pitch (under 80 words)

Most museum websites list a famous painting's provenance as "unknown before 1922."
Provenance Tracker traces the actual documented journey — every owner, every city,
every dealer receipt — sourced back to the institution that recorded it.
We separate ownership transfers from exhibition loans, and we show gaps honestly
instead of hiding them. It is the hidden journeys of masterpieces, made visible.

---

## 2-minute pitch

A painting can travel from a Paris studio to a Chicago socialite to a major museum
over a century — and the full story is scattered across auction archives, dealer
stock books, and museum provenance notes that almost no one reads.

Provenance Tracker curates a small set of famous, public-domain works and
reconstructs each one's documented chain of custody: every ownership change dated,
every fact sourced back to the Art Institute of Chicago, the Rijksmuseum,
Wikidata, or the Getty Provenance Index. When the record runs dry, we show the gap
as a gap — we never invent data to fill it.

Two things make this different from a museum website. First, we distinguish
ownership from loans. A painting on loan to the Louvre for three years never
changed hands — conflating the two is a common error in provenance research, and
it matters for restitution claims. Second, the 3D globe auto-frames to each work's
actual journey, so you can watch a century of moves play out in seconds.

The primary audience is museums and educators who need credible, embeddable
provenance storytelling in an era where restitution scrutiny is real. The data
method — multi-source reconciliation, gap-aware, custody-vs-loan separated —
is also a proof-of-concept for any future due-diligence product.

---

## 5-minute pitch

### The problem

Provenance — the documented history of who owned a work and where it went — is one
of the most consequential facts in the art world. It is also almost invisible to
the public. A famous painting's museum page might say "provenance unknown before
1922." That is a 30-year gap for a work painted in 1906. The records that would
fill it — Knoedler stock books, Goupil & Cie ledgers, Wikidata custody chains,
AIC acquisition notes — exist, but they are scattered, inconsistent in format, and
never reconciled in one readable place.

This matters for two reasons that are only growing. First, restitution cases hinge
on exactly this data: who held the work, when, and under what circumstances.
Second, the art-curious public has no beautiful, honest way to experience a
masterpiece's actual journey — only a dry legal disclaimer on a museum wall.

### What we built

Provenance Tracker is a curated provenance-storytelling app. A small set of famous,
public-domain works — Monet's Water Lilies, Vermeer's Girl with a Pearl Earring,
van Gogh's The Bedroom — each shown with a fully sourced, dated chain of custody
and a cinematic 3D globe that auto-frames to that work's journey.

Every fact on screen carries a visible source: the institution or database that
recorded it. Every gap in the record is shown as a gap, with an invitation to help
complete it. We never fake dates, coordinates, or risk scores.

The one structural distinction that runs through everything: ownership transfers
versus exhibition loans. A gold arc on the globe is a custody event — the work
changed hands. A sage arc is a loan — the work traveled and came back, the owner
did not change. That distinction is standard in provenance research and almost
never surfaced in public-facing tools. It matters: a work "on loan" for a year
is not provenance evidence, but it can look like one if you conflate the two.

### The data layer

Sources are tiered by reliability. Primary: museum provenance prose from the
Art Institute of Chicago and Rijksmuseum, which publish structured or semi-structured
records. Secondary: Wikidata SPARQL for locations and dates. Tertiary: Getty
Provenance Index — specifically the Knoedler & Company and Goupil & Cie stock
books, which cover the dealer network that moved Impressionist work from Paris to
American collectors between 1872 and 1970. These are real dealer receipts: buyer,
seller, price in francs and dollars, date.

Reconciliation is deterministic prose-mining today (the Anthropic API key is
unfunded). The architecture is ready for Claude-assisted conflict detection and
gap narration once credits are restored. All external calls are server-side;
keys never reach the client; per-IP rate limiting protects the free APIs we proxy.

### Who it is for

The immediate audience is museums, art educators, and journalists who need
provenance storytelling that is credible enough to cite. The restitution era means
institutions are under scrutiny; a sourced, gap-honest tool is a different kind
of asset than a marketing gallery.

The secondary audience — long-term — is dealers and researchers who need a
method proof-of-concept for ownership-trail due diligence. We are not pitching
insurance-grade data; coverage is too narrow for that. But the method — sourced,
dated, custody-vs-loan separated, gap-aware — is the foundation that a B2B
product would stand on.

The top of the funnel is the art-curious public: anyone who has ever wondered
where a famous painting was before the museum bought it.

### Why credibility is the moat

We are curated, not comprehensive, and we say so. The sourced, reconciled,
gap-aware dataset compounds as we add works and sources. A competitor who fakes
data or hides gaps destroys trust in one viral counterexample. We do not.
That is not just an ethics position — it is the only durable competitive advantage
in a domain where the underlying facts are verifiable.
