# Tonight's Task — Night 1: The Globe

## Goal
Build a visually stunning globe interface showing the world's top 10 museums.
This is the demo's opening visual. It needs to look incredible.
Reference: war-tracker.com but for art — dark, alive, pulsing, cinematic.

## Stack for tonight
- Next.js 14 (App Router)
- Globe.gl for the 3D globe: npm install globe.gl
- Tailwind for layout
- Pretendard font: @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css")

## Design tokens (follow exactly)
```
Background:   #0a0908
Globe ocean:  #111010  
Globe land:   #1c1612
Globe border: #2a2218
Accent clay:  #c87855
Accent sage:  #6f8d7d
Pin glow:     #d4a853
Text warm:    #f6f1e8
Text muted:   #9a8f85
Font:         Pretendard
```

## File: src/components/AlibiGlobe.tsx

Create a full-screen globe component. Dynamic import with ssr:false.

```tsx
// Globe.gl setup
const Globe = GlobeGL()
  .globeImageUrl(null)
  .backgroundColor('#0a0908')
  .showAtmosphere(true)
  .atmosphereColor('#c87855')
  .atmosphereAltitude(0.12)
```

Globe land color: #1c1612
Globe ocean: #111010  
Wire grid lines: subtle #2a2218

## Museum data (hardcode this)

```ts
const TOP_MUSEUMS = [
  { id: 'louvre', name: 'Louvre', city: 'Paris', country: 'France', lat: 48.8606, lng: 2.3376, focus: 'Ancient & Renaissance', count: 38000 },
  { id: 'met', name: 'The Met', city: 'New York', country: 'USA', lat: 40.7794, lng: -73.9632, focus: 'Global / All Eras', count: 490000 },
  { id: 'national-gallery', name: 'National Gallery', city: 'London', country: 'UK', lat: 51.5089, lng: -0.1283, focus: 'Western European', count: 2300 },
  { id: 'uffizi', name: 'Uffizi', city: 'Florence', country: 'Italy', lat: 43.7678, lng: 11.2553, focus: 'Italian Renaissance', count: 20000 },
  { id: 'rijksmuseum', name: 'Rijksmuseum', city: 'Amsterdam', country: 'Netherlands', lat: 52.3600, lng: 4.8852, focus: 'Dutch Golden Age', count: 8000 },
  { id: 'prado', name: 'Prado', city: 'Madrid', country: 'Spain', lat: 40.4138, lng: -3.6922, focus: 'Spanish & Flemish', count: 8200 },
  { id: 'hermitage', name: 'Hermitage', city: 'St Petersburg', country: 'Russia', lat: 59.9398, lng: 30.3146, focus: 'Imperial European', count: 3000000 },
  { id: 'smithsonian', name: 'Smithsonian', city: 'Washington DC', country: 'USA', lat: 38.8913, lng: -77.0261, focus: 'American & Global', count: 154000 },
  { id: 'aic', name: 'Art Institute', city: 'Chicago', country: 'USA', lat: 41.8796, lng: -87.6237, focus: 'Impressionism', count: 300000 },
  { id: 'taipei', name: 'National Palace', city: 'Taipei', country: 'Taiwan', lat: 25.1024, lng: 121.5489, focus: 'Chinese Imperial', count: 700000 },
]
```

## Museum pins

Use htmlElement markers. Each pin:
- A glowing dot with a pulse animation ring
- Size: 20px dot, 40px pulse ring
- Color: #d4a853 (gold) with 0.6 opacity pulse
- On hover: scale up, show museum name tooltip

CSS animation for pulse:
```css
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}
```

## Sidebar panel (left side, 320px wide)

Show on load (not hidden):
- "ALIBI" in small caps, Pretendard, #c87855
- Subtitle: "Where art has been"
- List of all 10 museums with name, city, artwork count
- On museum click: highlight that museum's row

Background: rgba(10, 9, 8, 0.85)
Border right: 1px solid #2a2218
Backdrop blur: blur(12px)

## Arc: Guernica's journey (hardcode for demo)

Show one arc on load to demonstrate the concept:
```ts
const GUERNICA_JOURNEY = [
  { startLat: 40.7614, startLng: -73.9776, endLat: 40.4138, endLng: -3.6922,
    label: 'Guernica', detail: 'MoMA 1939 → Prado 1981',
    color: '#c87855' }
]
```

Arc style: dashed, animated, glowing clay color
Arc altitude: 0.3
Label appears on hover

## Bottom bar

Fixed bottom, full width, dark background
Left: "10 museums · 4.8M artworks tracked"
Right: "Search any painting →" with a subtle input field

## Auto-rotate

Globe slowly auto-rotates on load (speed: 0.3 deg/frame)
Stops on user interaction, resumes after 3s idle

## When done
- npm run build (fix all TypeScript errors)
- git add . && git commit -m "Night 1: globe visual + 10 museums + Guernica arc"
- git push origin main
- Update PROGRESS.md with Vercel URL
- Note: what looks best, what needs polish tomorrow
