'use client'

/**
 * LandingEditorial — the editorial landing column (timeline-hero spec §5).
 *
 * Replaces the retired scrim-over-globe stack: the globe glows undimmed at the
 * top of the first viewport and DISSOLVES into the page ground via a gradient
 * (a transition, not a scrim over a hero). Below the fold everything sits on
 * solid OBS.bg. StoriesApp stays the state orchestrator; this component only
 * renders and calls back.
 */
import Link from 'next/link'
import type { SearchResult, SearchByMode } from '@/lib/types'
import { FEATURED_WORKS, type FeaturedWork } from '@/lib/featured'
import { OBS } from '@/lib/design-tokens'
import { SourceBadge } from '../provenance/SourceBadge'
import { sourceInstitution } from '../provenance/timeline'
import { NewsletterSignup } from '../NewsletterSignup'
import { WorkCard } from './WorkCard'

const COLUMN: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 3vw, 28px)' }

export function LandingEditorial({
  query, setQuery, searchBy, setSearchBy,
  results, searching, searched,
  runSearch, onSelectFeatured, onSelectResult,
}: {
  query: string
  setQuery: (q: string) => void
  searchBy: SearchByMode
  setSearchBy: (m: SearchByMode) => void
  results: SearchResult[]
  searching: boolean
  searched: boolean
  runSearch: (q: string, by: SearchByMode) => void
  onSelectFeatured: (f: FeaturedWork) => void
  onSelectResult: (r: SearchResult) => void
}) {
  const [lead, ...rest] = FEATURED_WORKS

  return (
    <div className="obs-scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', fontFamily: 'var(--font-ui)' }}>

      {/* ── HERO — first viewport: the globe dissolves into the page ground.
          minHeight/gradient stops read the --pt-hero-* custom properties
          (globals.css, media-query-driven) rather than JS width state, so the
          server-rendered first frame already has the right value for the
          visitor's actual viewport — no post-hydration snap. ── */}
      <div
        style={{
          minHeight: 'var(--pt-hero-min)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: `linear-gradient(180deg, transparent 0%, transparent var(--pt-hero-stop-a), ${OBS.bg} var(--pt-hero-stop-b))`,
          paddingBottom: 48,
        }}
      >
        <div style={{ ...COLUMN, width: '100%' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: OBS.clay, marginBottom: 14 }}>
            Provenance Tracker
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 400, lineHeight: 1.05, color: OBS.text, letterSpacing: '-0.02em', margin: 0, maxWidth: 720 }}>
            The hidden journeys of masterpieces
          </h1>
          <p style={{ fontSize: '1rem', color: OBS.textMuted, lineHeight: 1.6, marginTop: 18, maxWidth: 560 }}>
            A curated set of famous paintings, each with a documented, dated chain of
            custody — every fact sourced, every gap shown honestly.
          </p>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: OBS.textFaint, marginTop: 22 }}>
            Every fact sourced · Every gap shown · A loan is never a move
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 26, flexWrap: 'wrap' }}>
            <a href="#collection" style={{ fontSize: '0.82rem', color: OBS.gold, fontWeight: 600, textDecoration: 'none', borderBottom: `1px solid ${OBS.gold}`, paddingBottom: 1 }}>
              Explore the collection ↓
            </a>
            <a href="/method" style={{ fontSize: '0.82rem', color: OBS.textMuted, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}`, paddingBottom: 1 }}>
              How the data is prepared →
            </a>
          </div>
        </div>
      </div>

      {/* ── Everything below sits on solid ground ── */}
      <div style={{ background: OBS.bg, paddingBottom: 80 }}>
        <div style={COLUMN}>

          {/* ── SEARCH — the entry point to everything beyond the 8 featured
              works, promoted directly under the hero rather than buried below
              the collection grid and insights cross-link. Quiet by design (no
              borderTop of its own) so the collection grid below stays the
              visual hero; #collection carries the section divider instead. ── */}
          <section id="search" style={{ paddingTop: 32 }}>
            <h2 style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: OBS.textFaint, marginBottom: 12 }}>
              Search the world&apos;s museums — six collections
            </h2>

            {/* Search-by mode toggle */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {([
                { mode: 'all' as SearchByMode, label: 'All' },
                { mode: 'artist' as SearchByMode, label: 'Artist' },
                { mode: 'title' as SearchByMode, label: 'Title' },
              ] as { mode: SearchByMode; label: string }[]).map(({ mode, label }) => {
                const active = searchBy === mode
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      setSearchBy(mode)
                      if (query.trim().length >= 2) runSearch(query, mode)
                    }}
                    aria-pressed={active}
                    style={{
                      background: active ? OBS.clay : OBS.surface,
                      color: active ? OBS.bg : OBS.textMuted,
                      border: `1px solid ${active ? OBS.clay : OBS.border}`,
                      borderRadius: 6,
                      padding: '4px 12px',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      transition: 'background 150ms, color 150ms, border-color 150ms',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
              <span style={{ fontSize: '0.72rem', color: OBS.textFaint, alignSelf: 'center', marginLeft: 4 }}>
                {searchBy === 'artist' ? 'Searching by artist name' : searchBy === 'title' ? 'Searching by painting title' : 'Searching all fields'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, maxWidth: 520, flexWrap: 'wrap' }}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runSearch(query, searchBy)}
                placeholder={
                  searchBy === 'artist' ? 'Artist surname — Monet, Klimt, Vermeer…' :
                  searchBy === 'title' ? 'Painting title — Water Lilies, The Kiss…' :
                  'Search any artist or work — Klimt, Vermeer, Water Lilies…'
                }
                style={{ flex: 1, minWidth: 240, background: OBS.surface, border: `1px solid ${OBS.border}`, borderRadius: 8, padding: '10px 14px', color: OBS.text, fontFamily: 'var(--font-ui)', fontSize: '0.875rem', outline: 'none' }}
              />
              <button
                onClick={() => runSearch(query, searchBy)}
                style={{ background: OBS.clay, color: OBS.bg, border: 'none', borderRadius: 8, padding: '10px 18px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Search
              </button>
            </div>

            {searching && <div style={{ color: OBS.textMuted, fontSize: '0.85rem', marginTop: 16 }}>Searching…</div>}
            {searched && !searching && results.length === 0 && (
              <div style={{ color: OBS.textMuted, fontSize: '0.85rem', marginTop: 16, lineHeight: 1.5, maxWidth: 520 }}>
                Nothing found for &quot;{query}&quot;
                {searchBy !== 'all' && <> ({searchBy === 'artist' ? 'artist' : 'title'} search)</>}.{' '}
                Search spans the Met, Art Institute of Chicago, Rijksmuseum, Cleveland Museum of Art,
                Europeana, and Wikidata
                {searchBy !== 'all' && <> — try switching to <strong>All</strong> or check spelling</>}.
                {' '}The eight featured works are documented in depth; search reaches full museum
                catalogues, where provenance is often sparse.
              </div>
            )}
            {results.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 720 }}>
                {results.map(r => (
                  <button
                    key={r.id}
                    onClick={() => onSelectResult(r)}
                    className="landing-result-row"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, textAlign: 'left', background: 'transparent', border: `1px solid ${OBS.border}`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer', color: OBS.text }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      {r.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.thumbnail}
                          alt=""
                          loading="lazy"
                          onError={e => { e.currentTarget.style.visibility = 'hidden' }}
                          style={{ width: 48, height: 48, flexShrink: 0, objectFit: 'cover', borderRadius: 5, background: OBS.globeLand, display: 'block' }}
                        />
                      ) : (
                        <span
                          title={r.source === 'aic' ? 'Image unavailable — AIC IIIF restriction' : undefined}
                          aria-label={r.source === 'aic' ? 'Image unavailable' : 'No image'}
                          style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 5, background: OBS.surface, border: `1px solid ${OBS.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: OBS.textFaint, fontSize: r.source === 'aic' ? '0.55rem' : '1rem', gap: 1, letterSpacing: '0.03em' }}
                        >
                          {r.source === 'aic' ? <><span style={{ fontSize: '0.7rem' }}>◇</span><span>AIC</span></> : '◇'}
                        </span>
                      )}
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: OBS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.title}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.8125rem', color: OBS.textMuted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.artist} <span style={{ color: OBS.textFaint }}>·</span>{' '}
                          {r.date ? r.date : <span style={{ color: OBS.textFaint }}>Date not recorded</span>}
                        </span>
                      </span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                      <SourceBadge source={r.source} />
                      {/* CSS-hidden (not JS isTablet) below 1024px, same reasoning as the
                          hero tokens above — correct on first paint, no width-state lag. */}
                      <span className="landing-result-institution" style={{ fontSize: '0.6875rem', color: OBS.textFaint, whiteSpace: 'nowrap' }}>
                        {sourceInstitution(r.source)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── THE COLLECTION ── */}
          <section id="collection" style={{ marginTop: 56, borderTop: `1px solid ${OBS.border}`, paddingTop: 32 }}>
            <h2 style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: OBS.textFaint, marginBottom: 18 }}>
              The collection — eight documented journeys
            </h2>
            <div className="landing-collection-grid">
              <WorkCard work={lead} lead onSelect={onSelectFeatured} />
              {rest.map(f => (
                <WorkCard key={f.id} work={f} onSelect={onSelectFeatured} />
              ))}
            </div>
          </section>

          {/* ── INSIGHTS cross-link ── */}
          <a href="/insights" className="landing-work-card" style={{ display: 'block', marginTop: 28, padding: '18px 22px', background: OBS.surface, border: `1px solid ${OBS.border}`, borderRadius: 10, textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: OBS.text, lineHeight: 1.2 }}>
              The market, in aggregate
            </div>
            <div style={{ fontSize: '0.82rem', color: OBS.textMuted, marginTop: 4, lineHeight: 1.5 }}>
              4,388 dated dealer records, 1859&ndash;1971 — transactions, prices, the dealer network, and the Paris&ndash;Chicago pipeline.{' '}
              <span style={{ color: OBS.gold }}>See the insights &rarr;</span>
            </div>
          </a>

          {/* ── DATA & RIGHTS + NEWSLETTER ── */}
          <div style={{ marginTop: 64, borderTop: `1px solid ${OBS.border}`, paddingTop: 20, fontSize: '0.72rem', color: OBS.textFaint, lineHeight: 1.6, maxWidth: 720 }}>
            <strong style={{ color: OBS.textMuted, fontWeight: 600 }}>Data &amp; rights.</strong> Provenance and exhibition facts come from
            the open APIs of the Metropolitan Museum of Art, the Art Institute of Chicago, the Rijksmuseum,
            Europeana, Wikidata, the Cleveland Museum of Art, and the Getty Research Institute
            (Knoedler &amp; Goupil dealer records, CC0 1.0).
            Images are shown only for public-domain works, credited to their institution. Gaps are shown, never invented.
            <div style={{ marginTop: 10, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Link href="/case/adele-bloch-bauer-i" style={{ color: OBS.gold, fontWeight: 600, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                See a full restitution chain →
              </Link>
              <a href="/learn" style={{ color: OBS.textMuted, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                Provenance glossary →
              </a>
              <a href="/support" style={{ color: OBS.textMuted, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                Support →
              </a>
              <a href="/feedback" style={{ color: OBS.clay, textDecoration: 'none', borderBottom: `1px solid ${OBS.border}` }}>
                Feedback →
              </a>
            </div>
            <div style={{ marginTop: 24 }}>
              <NewsletterSignup palette="obs" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
