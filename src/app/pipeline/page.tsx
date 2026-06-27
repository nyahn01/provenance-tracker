/**
 * /pipeline — How a provenance chain is prepared.
 * Walks the data pipeline: multi-museum search → object record → custody
 * extraction (Claude → deterministic → Wikidata) → merge loans + dealer trail
 * → one sourced, gap-honest timeline. Describes the existing pipeline; it does
 * not fetch or change any data.
 * Server component — no client-side JS required (CSS-only motion).
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING } from '@/lib/design-tokens'

export const metadata: Metadata = {
  title: 'How the data is prepared — Provenance Tracker',
  description:
    'How a provenance chain is built: parallel museum APIs, Claude prose extraction with a deterministic fallback, Wikidata location qualifiers, the Getty/RKD dealer trail — merged into one dated timeline where every fact carries its source and every gap is shown, never faked.',
}

// MARKETING base; sage override matches /team's preserved drift (#4a7a6a).
const C = { ...MARKETING, sage: '#4a7a6a' }

// ─── Pipeline stages (left → right flow) ──────────────────────────────────────
const PIPELINE_STAGES = [
  { id: 'search', label: 'Search', sub: 'parallel APIs' },
  { id: 'record', label: 'Object record', sub: 'title · artist · image' },
  { id: 'extract', label: 'Extract custody', sub: 'Claude → fallback', isKey: true },
  { id: 'merge', label: 'Merge trail', sub: 'loans · Getty · RKD' },
  { id: 'timeline', label: 'Timeline', sub: 'sourced · gap-honest' },
]

// ─── Live sources, with credibility tier (mirrors docs/DATA_SOURCES.md) ───────
// Color follows SourceBadge's tier logic: GPI → purple, RKD → sage, else gold.
interface Source { name: string; tier: 'A' | 'B'; what: string; accent: string; keyless: boolean }
const SOURCES: Source[] = [
  { name: 'The Met', tier: 'A', what: 'Object detail, image, the museum’s own location. No provenance prose.', accent: C.gold, keyless: true },
  { name: 'Art Institute of Chicago', tier: 'A', what: 'Object detail, provenance_text, and a dedicated exhibition_history field.', accent: C.gold, keyless: true },
  { name: 'Rijksmuseum', tier: 'A', what: 'Linked Art records; Dutch Golden Age ownership prose (Getty AAT 300444174).', accent: C.gold, keyless: true },
  { name: 'Cleveland Museum of Art', tier: 'A', what: 'Open access with dated, structured provenance — richer than most prose.', accent: C.gold, keyless: true },
  { name: 'Getty Provenance Index', tier: 'A', what: 'Knoedler + Goupil dealer ledgers, seeded as CC0; the pre-museum market trail.', accent: C.purple, keyless: true },
  { name: 'RKD Netherlands', tier: 'A', what: 'Old Masters provenance research; structured owner and herkomst entries.', accent: C.sage, keyless: true },
  { name: 'Wikidata', tier: 'B', what: 'Location chain P276 with P580/P582 dates and P625 coordinates, via SPARQL.', accent: C.gold, keyless: true },
  { name: 'Europeana', tier: 'B', what: '50M+ objects from 3,000+ institutions; provenance field when a provider supplies it.', accent: C.gold, keyless: false },
]

// ─── Extraction tiers (how prose becomes a custody chain) ─────────────────────
const EXTRACTION = [
  {
    tag: 'Tier A',
    title: 'Claude prose extraction',
    accent: C.gold,
    body: 'Museum provenance text and exhibition history go to Claude Haiku with one rule: extract only what the text states — never invent a date or a place. Each result is cached so the same artwork is never billed twice.',
  },
  {
    tag: 'Tier B',
    title: 'Wikidata qualifiers',
    accent: C.sage,
    body: 'When prose yields nothing, SPARQL reads the structured location chain — P276 with its P580/P582 date qualifiers and P625 coordinates — as a verifiable open-data fallback.',
  },
  {
    tag: 'Fallback',
    title: 'Deterministic mining',
    accent: C.purple,
    body: 'If Claude is unavailable, a deterministic parser splits the prose by clause, geocodes each place against a fixed gazetteer, and pulls explicit years — degrading honestly, never guessing.',
  },
]

export default function PipelinePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        .flow-dot { animation: flow-along 2.8s linear infinite; }
        @keyframes flow-along {
          0%   { opacity: 0; }
          5%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse-key {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,83,0); }
          50%       { box-shadow: 0 0 12px 3px rgba(212,168,83,0.18); }
        }
        .key-pulse { animation: pulse-key 3s ease-in-out infinite; }
        .src-card:hover { border-color: ${C.borderMid} !important; background: ${C.surface2} !important; }
        a { text-decoration: none; }
        @media (prefers-reduced-motion: reduce) {
          .flow-dot, .key-pulse { animation: none !important; }
          * { transition-duration: 0.01ms !important; }
        }
      ` }} />

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-ui)', color: C.text }}>

        {/* Nav */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>← Back to journeys</Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: '0.8rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Provenance Tracker · The data</span>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 32px 100px' }}>

          {/* Hero */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 16 }}>
              How the data is prepared
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 400, color: C.text, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 20 }}>
              From eight archives<br />to one honest chain.
            </h1>
            <p style={{ fontSize: '1rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 600, marginBottom: 16 }}>
              No single museum knows where a painting has been. We read eight public archives,
              extract the ownership story without inventing a word of it, and merge it into one
              dated timeline. Every fact keeps its source. Every gap is shown — never filled.
            </p>
            <div style={{ fontSize: '0.76rem', color: C.textMuted, lineHeight: 1.6 }}>
              The fuller written reference lives in{' '}
              <Link href="/learn" style={{ color: C.gold, borderBottom: `1px solid ${C.border}` }}>the glossary</Link>;
              this page shows the pipeline itself.
            </div>
          </div>

          {/* The pipeline diagram */}
          <div style={{ marginBottom: 80 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              The pipeline
            </div>
            <p style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.6, maxWidth: 600, marginBottom: 28 }}>
              What happens when you pick a work — five stages, one request. Custody extraction
              (stage 03) is where prose becomes a chain.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <svg viewBox="0 0 860 110" width="100%" style={{ maxWidth: 860, display: 'block' }} role="img" aria-label="Pipeline: search, object record, extract custody, merge trail, timeline">
                {/* Connector lines + flowing dots */}
                {[0, 1, 2, 3].map(i => {
                  const x1 = 78 + i * 190
                  const x2 = x1 + 120
                  const y = 44
                  const isKeyLine = i === 1 // line going TO the extraction stage
                  return (
                    <g key={i}>
                      <line x1={x1} y1={y} x2={x2} y2={y}
                        stroke={isKeyLine ? C.gold : C.border}
                        strokeWidth={isKeyLine ? 1.5 : 1} />
                      {[0, 1, 2].map(d => (
                        <circle key={d} r={2.5}
                          fill={isKeyLine ? C.gold : C.textFaint}
                          className="flow-dot">
                          <animateMotion
                            dur={isKeyLine ? '2.2s' : '2.8s'}
                            begin={`${d * (isKeyLine ? 0.73 : 0.93)}s`}
                            repeatCount="indefinite"
                            path={`M${x1},${y} L${x2},${y}`} />
                        </circle>
                      ))}
                    </g>
                  )
                })}

                {/* Stage nodes */}
                {PIPELINE_STAGES.map((stage, i) => {
                  const cx = 40 + i * 190
                  const isKey = stage.isKey
                  return (
                    <g key={stage.id}>
                      <circle cx={cx} cy={44} r={isKey ? 32 : 28}
                        fill={isKey ? 'rgba(212,168,83,0.08)' : C.surface}
                        stroke={isKey ? C.gold : C.border}
                        strokeWidth={isKey ? 1.5 : 1} />
                      {isKey && (
                        <circle cx={cx} cy={44} r={36}
                          fill="none" stroke={C.gold} strokeWidth={0.5} strokeOpacity={0.3} />
                      )}
                      <text x={cx} y={isKey ? 38 : 40} textAnchor="middle"
                        fill={isKey ? C.gold : C.text}
                        fontSize={isKey ? 8.5 : 8} fontWeight={600}
                        style={{ fontFamily: 'inherit', letterSpacing: '0.02em' }}>
                        {stage.label}
                      </text>
                      <text x={cx} y={isKey ? 52 : 54} textAnchor="middle"
                        fill={C.textFaint} fontSize={7}
                        style={{ fontFamily: 'inherit' }}>
                        {stage.sub}
                      </text>
                      <text x={cx} y={96} textAnchor="middle"
                        fill={C.textFaint} fontSize={6.5}
                        style={{ fontFamily: 'inherit' }}>
                        {`0${i + 1}`}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* The sources */}
          <div style={{ marginBottom: 80 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              The sources ({SOURCES.length} live · tiered by credibility)
            </div>
            <p style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.6, maxWidth: 620, marginBottom: 12 }}>
              Coverage is thin by default; the answer is more sources and honest tiers, never
              invented data. <strong style={{ color: C.gold }}>Tier A</strong> is scholarly and
              institutional; <strong style={{ color: C.gold }}>Tier B</strong> is structured open
              data. Each fact’s tier stays visible to you — we never launder a lower tier as a higher one.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {SOURCES.map(s => (
                <div key={s.name} className="src-card"
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', transition: 'border-color 0.2s, background 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{s.name}</div>
                    <span style={{
                      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '2px 7px', borderRadius: 3, flexShrink: 0, whiteSpace: 'nowrap',
                      background: `${s.accent}1a`, color: s.accent, border: `1px solid ${s.accent}40`,
                    }}>Tier {s.tier}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: C.textMuted, lineHeight: 1.55, marginBottom: 10 }}>{s.what}</div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: s.keyless ? C.sage : C.textFaint }}>
                    {s.keyless ? 'Keyless' : 'Free API key'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extraction tiers */}
          <div style={{ marginBottom: 80 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              Turning prose into a chain
            </div>
            <p style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.6, maxWidth: 620, marginBottom: 28 }}>
              Most provenance arrives as a paragraph of prose. Three tiers turn it into dated,
              geocoded custody entries — each tagged with its source and a high / medium / low
              confidence. Exhibition loans are pulled out separately: a loan is not a change of ownership.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {EXTRACTION.map(e => (
                <div key={e.tag} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `2px solid ${e.accent}`, borderRadius: 10, padding: '20px 22px' }}>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: e.accent, marginBottom: 6 }}>{e.tag}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: C.text, marginBottom: 10 }}>{e.title}</div>
                  <div style={{ fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.6 }}>{e.body}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, padding: '14px 20px', background: 'rgba(212,168,83,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1rem', color: C.gold, flexShrink: 0 }}>★</span>
              <span style={{ fontSize: '0.82rem', color: C.textMuted, lineHeight: 1.6 }}>
                The eight <strong style={{ color: C.text }}>featured works</strong> are pre-parsed once and
                committed to the repo — so the homepage renders deep, verified custody chains at
                <strong style={{ color: C.gold }}> zero runtime cost</strong>, and never depends on a live model call.
              </span>
            </div>
          </div>

          {/* Honesty callout */}
          <div className="key-pulse" style={{ background: 'rgba(212,168,83,0.04)', border: `1px solid rgba(212,168,83,0.20)`, borderRadius: 12, padding: '28px 32px', marginBottom: 72 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>
              The honesty contract
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px 28px', marginBottom: 18 }}>
              {[
                'Every on-screen fact carries a visible source.',
                'Custody is never conflated with an exhibition loan.',
                'Gaps are shown as gaps — no invented dates or places.',
                'Unmapped cities stay off the globe; coordinates are never faked.',
                'Images appear only for public-domain works, credited to the institution.',
                'No live cross-museum “on view” status — no public API supports it.', /* honesty-ok */
              ].map(rule => (
                <div key={rule} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: C.gold, flexShrink: 0, marginTop: 2, fontSize: '0.8rem' }}>✓</span>
                  <span style={{ fontSize: '0.84rem', color: C.textMuted, lineHeight: 1.55 }}>{rule}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: C.textFaint, lineHeight: 1.7, maxWidth: 620 }}>
              These rules aren’t a promise — they’re enforced mechanically. An automated honesty
              gate runs on every change and blocks anything that overclaims, fakes data, or drops a source.
            </p>
          </div>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '0.72rem', color: C.textFaint }}>
              Sources: Met · AIC · Rijksmuseum · Cleveland · Getty GPI · RKD · Wikidata · Europeana
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Link href="/learn" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Provenance glossary →
              </Link>
              <Link href="/team" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                How it&apos;s built →
              </Link>
              <Link href="/demo" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Our story →
              </Link>
              <Link href="/" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Explore journeys →
              </Link>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
