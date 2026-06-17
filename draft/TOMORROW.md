# Tomorrow Night's Task — Night 2: Live Data + Demo Polish

## Goal
Add real API data and one working search. Make it demo-ready.
The 5-minute video gets recorded the morning after this.

## Priority order (stop when time runs out)
0. HONEST unscripted-search path FIRST: search → real data → graceful "Provenance gap" empty state
1. Search that lights up museum pins (documented locations only — NOT live cross-museum "on view")
2. Painting detail panel with real image + visible "Sources: Wikidata · Met · AIC" line
3. Arc animation for the documented journey (dated P276 chain; degrade to single dot honestly)
4. Claude: reconcile multi-source fragments into one timeline + flag gaps (not just a summary)
5. (Skip for hackathon) Stripe — passport export is a throwaway line, not a build target

## Feature 1: Search

Search input (already in bottom bar from Night 1) queries:
- Met Museum API: GET https://collectionapi.metmuseum.org/public/collection/v1/search?q={query}&hasImages=true
- AIC API: GET https://api.artic.edu/api/v1/artworks/search?q={query}&fields=id,title,is_on_view,gallery_title,artist_display,image_id

On result:
- If is_on_view (NOTE: this is ONLY that museum's own collection, not cross-museum loans):
  that museum's pin FLARES up (scale 3x, bright gold)
- Other museum pins dim to 0.3 opacity
- Side panel updates to show the painting + its documented location history
- Never present a single-museum is_on_view as global "where it is now"

Test queries to make work: "Starry Night", "Nighthawks", "Vermeer", "Monet"

## Feature 2: Painting detail panel

When a painting is found, side panel shows:
- Painting image (full width in panel)
- Title, artist, date
- Status: ON VIEW at [Museum] · [Gallery]
- OR: Currently in storage
- A subtle "ALIBI CONFIRMED" or "LOCATION UNKNOWN" badge

Badge styles:
- Confirmed: background #6f8d7d20, text #6f8d7d, border #6f8d7d40
- Unknown: background #c8785520, text #c87855, border #c8785540

## Feature 3: Journey arc

After showing current location, call Wikidata for historical locations:

SPARQL query:
```sparql
SELECT ?locationLabel ?startDate ?endDate WHERE {
  ?item rdfs:label "{PAINTING_TITLE}"@en.
  ?item p:P276 ?locationStatement.
  ?locationStatement ps:P276 ?location.
  OPTIONAL { ?locationStatement pq:P580 ?startDate. }
  OPTIONAL { ?locationStatement pq:P582 ?endDate. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
```

Use results to draw arcs between historical locations.
Each arc: clay color, dashed, animated, 0.5s stagger between arcs.

Fallback if Wikidata empty: use hardcoded Guernica arc from Night 1.

## Feature 4: Claude provenance reconciliation (the real AI moment)

After search result loads, call /api/reconcile route with the raw fragments collected from
Wikidata + museum exhibition endpoints. Prompt Claude to:
- merge them into ONE chronological timeline (location, dates, source for each entry)
- explicitly FLAG gaps and conflicts ("no record 1945–1958", "two sources disagree on owner")
- never invent dates or locations; if unknown, say unknown
Stream the timeline into the panel. This is the "only an LLM does this" beat — not a flavor summary.

## Feature 5: Stripe — SKIP for hackathon

Do not build payment. Passport export is a one-line mention in the pitch, not a feature.
If asked, the business model lives in BUSINESS_CASE.md (API to insurers/auction houses).

## Polish (agent should do this last)

- Loading state: globe spins a glowing ring while API fetches
- Empty state: "Search any painting, artist, or museum"
- Mobile: sidebar collapses to bottom sheet on screens < 768px
- Page title: "Alibi — Where art has been"
- Favicon: a small magnifying glass or compass

## When done
- npm run build
- git commit -m "Night 2: search + detail panel + journey arcs + Claude summary"
- git push
- Write DEMO_NOTES.md: which features work, which to skip in the demo video
