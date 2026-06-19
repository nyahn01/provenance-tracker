# Demo Works — Annotated Shortlist

Private reference. Ranked by data completeness for live demo use.

---

## 1. Water Lilies — Claude Monet (AIC 16568) ★★★★★

**Best for:** Opening the demo. Richest end-to-end story.

**Data coverage:**
- AIC provenance prose: ~800+ chars, dated chain from Paris dealer
- Getty/Knoedler records: **167 records** for Monet
- Globe arcs: Giverny → Paris (Knoedler dealer) → Chicago
- Exhibition history: multiple AIC loans documented

**The story in 30 seconds:**
Bertha Palmer acquired Monet water lilies through Knoedler & Co. Paris in the 1890s.
The Knoedler stock book confirms: "The Poppy Field" bought for 2,250 francs, sold to
P. Palmer, Chicago for $950 (April 1891). This is the dealer receipt that explains the
custody arc. AIC acquired the water lily series through Mrs. Palmer's bequest in 1922.

**Demo beat:** Open → globe lights up → gold arc Paris→Chicago → sidebar shows AIC prose +
Getty records below. "The museum tells you what it owns. Getty tells you who sold it."

**Hook line:** "Here is the receipt for the deal that brought this painting to Chicago."

---

## 2. A Sunday on La Grande Jatte — Georges Seurat (AIC 27992) ★★★★

**Best for:** Second in demo. Most famous work in the collection. Gap story.

**Data coverage:**
- AIC provenance prose: rich (Félix Fénéon, Lucie Cousturier, donated 1924)
- Getty/Knoedler records: **48 records** for Seurat
- Globe arcs: Paris → Brussels → Paris → Chicago
- Known gap: French ownership chain 1889–1900 partially documented

**The story:**
Painted 1884–86. Exhibited at the 8th Impressionist Exhibition 1886 (Paris) and in
Brussels (Les XX). Purchased by Félix Fénéon (critic), sold to Lucie Cousturier, then
Frederic Clay Bartlett who donated it to AIC in 1926. The Brussels exhibition creates
a cross-border custody arc that shows well on the globe.

**Demo beat:** Second painting — "Same platform, different story. This one crossed
three countries. And there's a gap here — 1889 to 1900 — we can show that honestly."

**Hook line:** "Provenance gaps are a feature, not a failure. This is what honest data looks like."

---

## 3. Yellow Dancers (In the Wings) — Edgar Degas (AIC 18951) ★★★★

**Best for:** Third beat — showing the dealer chain explicitly from AIC's own provenance text.

**Data coverage:**
- AIC provenance prose: **542 chars**, names Goupil & Cie explicitly
- Getty/Knoedler records: **201 records** for Degas (highest in our dataset)
- Globe arcs: London → Paris → Chicago
- Provenance text excerpt: "Shipped by the artist to the art dealer, Charles W. Deschamps,
  London, around May 15, 1876... sold to Goupil et Cie, Paris on July 25, 1891"

**The story:**
Degas shipped the painting directly to his dealer Deschamps in London (1876). James
Staats Forbes (collector) owned it briefly, then Goupil & Cie (Paris dealers) acquired
it in 1891. This is EXACTLY the kind of dealer record the Getty Provenance Index
documents — though Goupil's records are a separate GPI dataset we can reference.

**Demo beat:** "Look at the provenance text. Degas shipped this directly to his dealer.
We know the date. We know the price. This is 1876. The painting arrived at AIC in
the 1940s. The Getty records give us the market layer the museum record skips over."

**Hook line:** "The artist's own letter, the dealer's address, the sale date. All documented."

---

## 4. Stacks of Wheat (End of Summer) — Claude Monet (AIC 64818) ★★★

**Best for:** Backup Monet if Water Lilies has data issues on demo day.

**Data coverage:**
- Getty/Knoedler: 167 records for Monet (same pool as Water Lilies)
- Different visual — the wheat series, golden palette

**Use if:** Water Lilies provenance API is slow or thin on demo day.

---

## Works to avoid for demo (explain to judges if asked)

| Work | Why to avoid for demo |
|------|-----------------------|
| Self-Portrait (Van Gogh, AIC 80607) | 0 Getty records; removed from featured works |
| The Bedroom (Van Gogh, AIC 28560) | 0 Getty records; good story but no market layer |
| Paris Street / Caillebotte (AIC 20684) | Only 4 Getty records; visual anchor but thin data |

---

## Demo fallback order

If live API is slow:
1. Try Water Lilies (aic-16568) — usually cached after first load
2. If empty, try La Grande Jatte (aic-27992)
3. If that fails, show Degas Yellow Dancers (aic-18951) — provenance text is pre-loaded

Always load the demo artwork BEFORE starting your presentation.
Navigate to it, let it load, then go back to the landing page.
The 10-minute cache will keep the data warm.
