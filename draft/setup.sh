#!/bin/bash
# =============================================
# ALIBI — Painting Location Tracker
# Run once in an empty folder to scaffold everything
# Usage: bash setup.sh
# =============================================

set -e

echo ""
echo "🎨 Setting up Alibi..."
echo ""

# --- Prerequisites check ---
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install from nodejs.org"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git not found. Install git first."; exit 1; }
echo "✅ Node $(node --version) found"
echo "✅ Git found"

# --- Scaffold Next.js app ---
echo ""
echo "📦 Creating Next.js app..."
npx create-next-app@latest . --typescript --tailwind --app --yes --silent

# --- Install extra dependencies ---
echo "📦 Installing Leaflet + Anthropic SDK..."
npm install leaflet @types/leaflet @anthropic-ai/sdk --silent

# --- Create folder structure ---
mkdir -p memory
mkdir -p src/app/api/search
mkdir -p src/app/api/summary
mkdir -p src/components

echo "📁 Folders created"

# --- CLAUDE.md ---
cat > CLAUDE.md << 'CLAUDEEOF'
# Alibi — Painting Location Tracker

## What Alibi does
Users search any famous painting. Alibi shows:
- Where it is right now (on view / in storage / on loan)
- Which museum, which gallery number
- A Leaflet.js map pin at the current museum
- A 3-sentence AI summary: location, what it is known for, one surprising fact
- Movement history for the last 10 years (Night 2)
- A transit risk score for insurance use (Night 3)
- Stripe payment for a painting passport PDF export (Night 4)

## Tech stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Leaflet.js (maps)
- Anthropic SDK (claude-sonnet-4-6 for summaries)
- Supabase (data persistence, Night 2+)
- Vercel (deployment, auto-deploys on git push)

## APIs available
- Metropolitan Museum API — no key needed
  Base: https://collectionapi.metmuseum.org/public/collection/v1
- Art Institute of Chicago API — no key needed
  Base: https://api.artic.edu/api/v1
- Wikidata SPARQL — no key needed
  Endpoint: https://query.wikidata.org/sparql
- Rijksmuseum API — key in .env.local as RIJKSMUSEUM_KEY
  Base: https://www.rijksmuseum.nl/api/en/collection
- Anthropic API — key in .env.local as ANTHROPIC_API_KEY

## Museum coordinates (hardcode these)
- Metropolitan Museum of Art: 40.7794, -73.9632
- Art Institute of Chicago: 41.8796, -87.6237
- Rijksmuseum Amsterdam: 52.3600, 4.8852
- Louvre Paris: 48.8606, 2.3376
- Tate Modern London: 51.5076, -0.0994
- Prado Madrid: 40.4138, -3.6922
- Uffizi Florence: 43.7678, 11.2553
- Hermitage St Petersburg: 59.9398, 30.3146
- MoMA New York: 40.7614, -73.9776
- Musée d'Orsay Paris: 48.8600, 2.3266

## Coding rules
- Always use TypeScript with proper types
- Never hardcode API keys — use process.env
- Keep components small, one responsibility per file
- Use async/await, never .then() chains
- After each task, commit with a clear message and push to GitHub
- Update PROGRESS.md after every session
- Read TONIGHT.md at session start
- Read MEMORY.md for full context

## Deployment
Vercel auto-deploys on git push to main.
Always verify the Vercel build passes after pushing.
CLAUDEEOF

echo "✅ CLAUDE.md created"

# --- MEMORY.md ---
cat > MEMORY.md << 'MEMEOF'
# Memory Index

Read these files in order at session start:

1. TONIGHT.md — current task for this session
2. PROGRESS.md — what was done in the last session
3. memory/project-status.md — current build state
4. memory/api-inventory.md — which APIs are working
5. memory/decisions.md — architectural decisions already made
6. memory/feedback.md — corrections from Anna

Do not skip any file. Context from previous sessions matters.
MEMEOF

echo "✅ MEMORY.md created"

# --- PROGRESS.md ---
cat > PROGRESS.md << 'PROGEOF'
# Progress Log

## Session 0 — Setup
- Project scaffolded with Next.js 14, TypeScript, Tailwind
- CLAUDE.md, MEMORY.md, TONIGHT.md created
- Ready for Night 1

## Next priority
Build search UI + Met Museum + AIC API integration + Leaflet map
PROGEOF

# --- memory files ---
cat > memory/project-status.md << 'EOF'
# Project Status

Phase: Night 1 — Search UI
Deployed URL: not yet
Last working feature: scaffold only
Blockers: none
Next priority: search input → Met + AIC API → map pin → Claude summary
EOF

cat > memory/api-inventory.md << 'EOF'
# API Inventory

## Working
- None yet (Night 1 starts now)

## To test tonight
- Met Museum search endpoint
- AIC search endpoint

## Pending setup
- Rijksmuseum (register at rijksmuseum.nl/en/api for free key)
- Wikidata SPARQL (Night 2)
- Stripe (Night 4)
EOF

cat > memory/decisions.md << 'EOF'
# Architectural Decisions

- App Router (not Pages Router) — modern Next.js pattern
- API routes in src/app/api/ for all external API calls (keeps keys server-side)
- Leaflet for maps (lightweight, no Google Maps billing)
- Claude API called server-side only (never expose key to client)
- Tailwind for all styling (no CSS modules)
EOF

cat > memory/feedback.md << 'EOF'
# Anna's Feedback

(Agent updates this when Anna leaves corrections in TONIGHT.md)
EOF

echo "✅ Memory files created"

# --- TONIGHT.md (Night 1 task) ---
cat > TONIGHT.md << 'TONIGHTEOF'
# Tonight's Task — Night 1

Build the core search page for Alibi.

## What to build

A single page at / with:
1. Centered search input with placeholder "Search any painting..."
2. On submit, call /api/search?q={query} (build this route)
3. Display top result below the search bar

## API route: src/app/api/search/route.ts

Call these two APIs in parallel using Promise.all:

### Met Museum
Search: GET https://collectionapi.metmuseum.org/public/collection/v1/search?q={query}&hasImages=true
Returns objectIDs array. Fetch top 3:
GET https://collectionapi.metmuseum.org/public/collection/v1/objects/{id}
Fields needed: isOnView, GalleryNumber, primaryImageSmall, artistDisplayName, objectDate, title, department

### AIC
GET https://api.artic.edu/api/v1/artworks/search?q={query}&fields=id,title,is_on_view,gallery_title,artist_display,image_id,thumbnail
Image URL: https://www.artic.edu/iiif/2/{image_id}/full/400,/0/default.jpg

Merge results. Remove duplicates by title similarity (lowercase match).
Return top 3 results as JSON.

## Result card component: src/components/PaintingCard.tsx

Show for top result:
- Painting image (use primaryImageSmall or AIC image URL)
- Title + artist + date
- Status badge: green "On view — Gallery {X}" or grey "Not currently on display"
- Museum name

## Map component: src/components/PaintingMap.tsx

Use Leaflet to show a single map pin at the current museum.
Use the museum coordinates from CLAUDE.md.
Match museum name from API result to coordinates.
Dynamic import with ssr: false (Leaflet requires browser).

## Summary: src/app/api/summary/route.ts

After showing the card, fetch a summary from this route.
Call Anthropic claude-sonnet-4-6 with:
"Write exactly 3 sentences about {painting title} by {artist}.
Sentence 1: where it is now and what gallery.
Sentence 2: what it is most known for.
Sentence 3: one surprising fact about its history or journey."
Stream the response to the client.

## When done
- npm run build (fix any TypeScript errors)
- git add . && git commit -m "Night 1: search UI + Met + AIC + map + summary"
- git push origin main
- Update PROGRESS.md: what works, what the Vercel URL is, what is next
TONIGHTEOF

echo "✅ TONIGHT.md created (Night 1 task ready)"

# --- .env.local.example ---
cat > .env.local.example << 'ENVEOF'
# Copy this file to .env.local and fill in your keys
# Never commit .env.local to git

ANTHROPIC_API_KEY=your_anthropic_api_key_here
RIJKSMUSEUM_KEY=your_rijksmuseum_key_here

# Get Anthropic key: https://console.anthropic.com
# Get Rijksmuseum key: https://www.rijksmuseum.nl/en/api (free, instant)
ENVEOF

echo "✅ .env.local.example created"

# --- run-agent.sh (the nightly command) ---
cat > run-agent.sh << 'RUNEOF'
#!/bin/bash
# =============================================
# ALIBI — Nightly Agent Runner
# Run this before bed: bash run-agent.sh
# =============================================

echo ""
echo "🌙 Starting Alibi overnight build..."
echo "📋 Tonight's task:"
echo ""
cat TONIGHT.md
echo ""
echo "Agent will run autonomously. You can sleep."
echo "Check PROGRESS.md in the morning."
echo ""

# Keep Mac awake and run Claude Code in headless mode
# --dangerously-skip-permissions: agent edits files without asking each time
# Only use on your own machine at home

caffeinate -i claude --dangerously-skip-permissions -p "$(cat TONIGHT.md)"

echo ""
echo "✅ Session complete. Check PROGRESS.md for results."
RUNEOF

chmod +x run-agent.sh
echo "✅ run-agent.sh created"

# --- .gitignore addition ---
echo ".env.local" >> .gitignore
echo "✅ .env.local added to .gitignore"

# --- Git init ---
git add .
git commit -m "Alibi: initial scaffold + agent architecture"
echo "✅ Initial git commit done"

echo ""
echo "============================================"
echo "✅ Alibi is ready."
echo ""
echo "Before tonight:"
echo "  1. cp .env.local.example .env.local"
echo "  2. Add your ANTHROPIC_API_KEY to .env.local"
echo "  3. Push to GitHub: gh repo create alibi --public --source=. --push"
echo "  4. Connect Vercel: vercel"
echo ""
echo "Every night before bed:"
echo "  bash run-agent.sh"
echo ""
echo "Every morning on commute:"
echo "  Read PROGRESS.md on GitHub mobile"
echo "============================================"
echo ""
