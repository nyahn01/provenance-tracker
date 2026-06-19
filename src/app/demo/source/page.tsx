/**
 * /demo/source — Structured source document for NotebookLM ingestion.
 * No animations. Content-dense, readable prose.
 * Design tokens: draft/CLAUDE.md (exact hex values)
 */

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Source Document — Provenance Tracker',
  description:
    'Structured source document for NotebookLM. Covers project overview, origin story, data sources, agent team, business model, and honesty principles.',
}

// Design tokens — exact values from draft/CLAUDE.md
const C = {
  bg:        '#0a0908',
  surface:   '#111010',
  surface2:  '#161413',
  border:    '#2a2218',
  borderMid: '#3a3028',
  text:      '#f6f1e8',
  textMuted: '#9a8f85',
  textFaint: '#5a5248',
  gold:      '#d4a853',
  sage:      '#6f8d7d',
  clay:      '#c87855',
}

interface ContentSection {
  id: string
  number: string
  title: string
  body: React.ReactNode
}

const SECTIONS: ContentSection[] = [
  {
    id: 'project-overview',
    number: '01',
    title: 'Project overview',
    body: (
      <>
        <p>
          Provenance Tracker is a web application that visualises the custody chains of famous works
          of art on an interactive 3D globe. It is designed for museum professionals, restitution law
          firms, art historians, and the art-curious public.
        </p>
        <p>
          The core proposition: a painting with a clean, verified chain of custody is worth more than
          one with gaps — to insurers, to auction houses, to heirs. No existing tool presents that
          chain in one place, sourced and dated, with gaps shown honestly rather than papered over.
          Provenance Tracker does.
        </p>
        <p>
          The platform is not an insurance-grade API, does not make live cross-museum custody claims,
          and does not invent data. It is a rigorous, sourced, editorial product — closer in spirit to
          a scholarly provenance catalogue than a live tracking dashboard.
        </p>
      </>
    ),
  },
  {
    id: 'origin-story',
    number: '02',
    title: 'Origin story',
    body: (
      <>
        <p>
          A friend of the founder debuted as a curator at the National Gallery, London. His ambition:
          to curate all 10 great museums — Louvre, Hermitage, Uffizi, Prado, Met, Rijksmuseum, AIC,
          Smithsonian, National Palace Museum Taipei, and the National Gallery. Travelling between
          cities, he would remark that a painting he had seen in one museum had moved — and ask where
          it had gone. No single tool could answer that.
        </p>
        <p>
          The founder is a reinsurance professional. The inspiration for the interface was
          FlightRadar24 — a platform that made invisible journeys (aircraft in flight) suddenly
          visible to anyone with a browser. The same logic applied to art: if you could draw arcs
          between every city a painting had passed through, the hidden journeys of masterpieces would
          become legible.
        </p>
        <p>
          This platform began as a gift — an answer to the curator friend&apos;s question. It evolved
          into a method proof-of-concept for provenance due diligence, with a commercial angle aimed
          at restitution law firms and museum registrars dealing with WWII-era claims.
        </p>
      </>
    ),
  },
  {
    id: 'what-the-product-does',
    number: '03',
    title: 'What the product does',
    body: (
      <>
        <p>
          The landing page presents an editorial gallery of curated public-domain masterpieces. Each
          work links to a story view: an artwork hero image, a dated chain-of-custody timeline, and a
          3D globe that animates the painting&apos;s journey between cities and institutions.
        </p>
        <p>
          The globe renders three types of arcs, colour-coded to distinguish their meaning:
        </p>
        <ul>
          <li>
            <strong>Gold arcs</strong> — ownership transfers. Legal title changed hands. These are
            custody events.
          </li>
          <li>
            <strong>Sage arcs</strong> — exhibition loans. The work moved temporarily for display;
            the owner did not change. Loans are never conflated with ownership.
          </li>
          <li>
            <strong>Amber arcs</strong> — dealer trails from the Getty Provenance Index. Transactions
            recorded in the Knoedler and Goupil stock books that predate museum acquisition.
          </li>
        </ul>
        <p>
          The sidebar timeline merges records from multiple data sources into one chronological view,
          each entry stamped with its source. Where documentation is absent, the platform renders an
          explicit provenance gap: dashed border, muted styling, and the label
          &ldquo;Provenance gap — help complete it.&rdquo; Gaps are shown, never filled.
        </p>
        <p>
          A search path lets visitors explore beyond the curated collection via the Met, AIC, and
          Rijksmuseum APIs. When results are thin, the empty state is intentional: &ldquo;Provenance
          gap — help complete it.&rdquo;
        </p>
      </>
    ),
  },
  {
    id: 'data-sources',
    number: '04',
    title: 'Data sources with specifics',
    body: (
      <>
        <p>
          All five live data sources are open and free of API keys unless noted:
        </p>
        <ul>
          <li>
            <strong>Metropolitan Museum of Art API</strong> (no key required) —
            https://collectionapi.metmuseum.org/public/collection/v1. Returns object records including
            provenance prose, medium, department, and image links for public-domain works.
          </li>
          <li>
            <strong>Art Institute of Chicago API</strong> (no key required) —
            https://api.artic.edu/api/v1. Returns structured object data including provenance text,
            dates, and IIIF image manifests.
          </li>
          <li>
            <strong>Rijksmuseum Linked Art API</strong> (no key required) —
            https://data.rijksmuseum.nl/search/collection. Query parameters: creator=, title=,
            type=schilderij. Object records at https://id.rijksmuseum.nl/&lt;id&gt;. The old
            www.rijksmuseum.nl/api endpoint is retired (HTTP 410).
          </li>
          <li>
            <strong>Wikidata SPARQL</strong> (no key required) —
            https://query.wikidata.org/sparql. Properties used: P276 (location), P580 (start time),
            P582 (end time), P571 (inception), P170 (creator), P18 (image). Enables structured
            provenance queries across any Wikidata-indexed artwork.
          </li>
          <li>
            <strong>Getty Provenance Index (GPI)</strong> — Knoedler stock books 1872–1970 (over
            2,600 records) and Goupil &amp; Cie 1846–1919 (4,388 records seeded). Published under
            CC0 licence by the Getty Research Institute. Records document dealer transactions
            including buyer, seller, price, and date — filling the gap between creation and museum
            acquisition that institutional records omit.
          </li>
          <li>
            <strong>RKD Netherlands Art Institute</strong> — Dutch art historical database for
            Netherlands-linked works. Available at the Researcher tier.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'key-numbers',
    number: '05',
    title: 'Key numbers',
    body: (
      <>
        <ul>
          <li>
            <strong>4,388</strong> — Getty Provenance Index dealer records seeded (Goupil &amp; Cie
            combined dataset)
          </li>
          <li>
            <strong>2,600+</strong> — Knoedler stock book records in the GPI (CC0)
          </li>
          <li>
            <strong>5</strong> — live museum and data APIs integrated (Met, AIC, Rijksmuseum,
            Wikidata, Getty GPI)
          </li>
          <li>
            <strong>7</strong> — AI specialist agents in the build team
          </li>
          <li>
            <strong>3</strong> — pricing tiers (Explorer free / Researcher €99/mo / Institution
            €999/mo)
          </li>
          <li>
            <strong>10</strong> — great museums covered as primary nodes on the globe (Louvre, Met,
            National Gallery London, Uffizi, Rijksmuseum, Prado, Hermitage, Smithsonian, AIC,
            National Palace Museum Taipei)
          </li>
          <li>
            <strong>600,000+</strong> — estimated artworks looted during the WWII era, per the Art
            Loss Register
          </li>
          <li>
            <strong>200,000+</strong> — Korean cultural artifacts estimated to be held abroad
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'agent-team',
    number: '06',
    title: 'The agent team',
    body: (
      <>
        <p>
          Provenance Tracker is built and maintained by a team of 7 specialized AI agents running in
          Claude on Anthropic&apos;s Max plan. Each agent owns a distinct domain and can block a
          commit.
        </p>
        <ul>
          <li>
            <strong>design-director</strong> (Opus) — visual language, typography, colour, motion.
            Sets the design system. Other agents implement to it, never around it.
          </li>
          <li>
            <strong>frontend-engineer</strong> (Sonnet) — Globe.gl arcs and pins, sidebar panels,
            data visualisation, responsive layout, strict design-token fidelity.
          </li>
          <li>
            <strong>provenance-data</strong> (Sonnet) — Wikidata SPARQL, Met/AIC/Rijks/Getty API
            integration, geocoding, caching, rate limiting, data contracts.
          </li>
          <li>
            <strong>art-historian</strong> (Opus) — source credibility ranking, gap
            characterisation, custody evidence standards.
          </li>
          <li>
            <strong>provenance-strategy</strong> (Opus) — business case, market research, customer
            segments, pricing rationale.
          </li>
          <li>
            <strong>provenance-story</strong> (Opus) — demo narrative, pitch script, hero-work
            selection, judging-criteria fit.
          </li>
          <li>
            <strong>provenance-honesty-review</strong> (Opus) — BLOCKING gate. Audits every diff
            for over-claiming, missing sources, faked data, and custody/loan conflation. No commit
            bypasses this gate.
          </li>
        </ul>
        <p>
          The ship gate (scripts/ship.mjs) runs automatically: npm build, server health check,
          /api/provenance validation, and a grep-based honesty audit. Agents propose commits; the
          gate commits. A failed gate blocks the push and surfaces the failure reason.
        </p>
        <p>
          The workflow runs overnight in batch: tasks are queued, agents pick them up in parallel,
          results converge at the honesty gate, and surviving changes are committed and deployed to
          Vercel.
        </p>
      </>
    ),
  },
  {
    id: 'business-model',
    number: '07',
    title: 'Business model',
    body: (
      <>
        <p>Three access tiers:</p>
        <ul>
          <li>
            <strong>Explorer — Free.</strong> Public, students, art-curious. Curated provenance
            stories, globe visualisation, provenance gap disclosure, source attribution.
          </li>
          <li>
            <strong>Researcher — €99/month.</strong> Art historians, journalists, educators. Adds
            Getty Provenance Index dealer records, RKD data, confidence scoring, JSON export, and API
            access (100 requests/day).
          </li>
          <li>
            <strong>Institution — €999/month.</strong> Museums, auction houses, restitution law
            firms. Adds bulk provenance ingestion, white-label reporting, custom gap analysis,
            priority restitution research queue, dedicated support, SLA, and unlimited API access.
          </li>
        </ul>
        <p>
          The anchor customer segment is restitution law firms and museum registrars dealing with
          WWII-era claims. This is the segment for whom documented custody chains have direct legal
          value — a clean provenance chain can determine the outcome of a restitution claim worth
          millions. The Institution tier is priced at institutional licence rates reflecting that
          legal utility.
        </p>
        <p>
          Secondary segments: academic art historians (Researcher tier), major auction houses
          requiring provenance due diligence pre-sale, and museum education departments.
        </p>
      </>
    ),
  },
  {
    id: 'jikji',
    number: '08',
    title: 'The Jikji angle — Korean cultural heritage',
    body: (
      <>
        <p>
          직지심체요절 — the Jikji — was printed at Heungdeoksa Temple in Cheongju, Korea in 1377
          using movable metal type. It is the world&apos;s oldest surviving example of metal-type
          printing, predating Gutenberg&apos;s Bible by 78 years. It sits today in the
          Biblioth&egrave;que nationale de France in Paris. It has never returned to Korea.
        </p>
        <p>
          The Jikji was acquired by the French diplomat Victor Collin de Plancy around 1887 and
          bequeathed to the BnF in 1950. The Korean government has formally requested its return. The
          BnF, citing French law on the inalienability of national collections, has not transferred
          it.
        </p>
        <p>
          The Jikji is the emblematic case for a platform that can document contested journeys with
          precision. Provenance Tracker could one day be the place where that journey — from
          Cheongju to Paris, from Collin de Plancy to the BnF, and any future repatriation — is
          documented, disputed, and understood by the public.
        </p>
        <p>
          Over 200,000 Korean cultural artifacts are estimated to be held abroad. Korea&apos;s
          colonial period (1910–1945) under Japanese imperial rule saw systematic dispersal of
          cultural heritage. The Cultural Heritage Administration of Korea maintains a database of
          overseas Korean heritage and pursues diplomatic repatriation on a case-by-case basis.
        </p>
        <p>
          Art lost under colonialism deserves the same rigor as a Monet with a WWII gap. Provenance
          tools built only for Western auction house contexts are insufficient. This platform is
          designed to be extensible to any cultural tradition.
        </p>
      </>
    ),
  },
  {
    id: 'honesty-principles',
    number: '09',
    title: 'Honesty principles',
    body: (
      <>
        <p>
          Six rules govern every on-screen claim. The honesty-review agent treats these as
          non-negotiable and will block a commit that violates any of them:
        </p>
        <ol>
          <li>
            <strong>No live cross-museum custody claims.</strong> No public API reliably reports
            current installation location. The platform never claims a work is &ldquo;currently on
            view&rdquo; at a specific gallery.
          </li>
          <li>
            <strong>Source every fact.</strong> Every on-screen date, owner, or location carries a
            visible source badge: Met · AIC · Rijksmuseum · Wikidata · Getty GPI. Unsourced claims
            are not displayed.
          </li>
          <li>
            <strong>Gaps shown, not filled.</strong> Sparse data renders as an explicit gap state —
            dashed border, &ldquo;░ Provenance gap&rdquo; label. Dates, coordinates, or owners are
            never invented to smooth a timeline.
          </li>
          <li>
            <strong>Custody is not a loan.</strong> Exhibition loans (temporary, no title change) are
            categorically separate from custody transfers (ownership change). Arc colours enforce this
            on the globe; timeline labels enforce it in the sidebar.
          </li>
          <li>
            <strong>Public-domain images only.</strong> Images are displayed only for works confirmed
            to be in the public domain, credited to the holding institution.
          </li>
          <li>
            <strong>Graceful empty state.</strong> When data is thin or the search returns no
            results, the interface shows an intentional, honest empty state — not a broken-looking
            screen. The unscripted path looks designed.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: 'technical-stack',
    number: '10',
    title: 'Technical stack',
    body: (
      <>
        <ul>
          <li>
            <strong>Framework:</strong> Next.js 14 App Router, TypeScript strict mode.
          </li>
          <li>
            <strong>Styling:</strong> Tailwind CSS with design tokens defined in globals.css. All
            colours follow the Observatory dark palette (background #0a0908, text #f6f1e8, clay
            #c87855, sage #6f8d7d, gold #d4a853).
          </li>
          <li>
            <strong>Fonts:</strong> Pretendard (UI body, CDN), Cormorant Garamond (display
            headings, Google Fonts).
          </li>
          <li>
            <strong>Globe:</strong> Globe.gl, dynamically imported with ssr: false to avoid
            server-side rendering conflicts. WebGL-rendered 3D globe with custom arc and pin layers.
          </li>
          <li>
            <strong>APIs:</strong> All external API calls are proxied through Next.js API routes
            (server-side only). API keys are never exposed to the client. Responses are cached and
            rate-limited per IP.
          </li>
          <li>
            <strong>AI:</strong> Anthropic SDK (claude-sonnet-4-6). Currently paused on credits;
            extraction falls back to deterministic prose mining from museum provenance fields.
          </li>
          <li>
            <strong>Deployment:</strong> Vercel, auto-deploy on push to main.
          </li>
          <li>
            <strong>Agents:</strong> 7 specialized Claude agents invoked via Claude Code on Max.
            Ship gate: scripts/ship.mjs (build + health check + honesty grep + commit).
          </li>
        </ul>
      </>
    ),
  },
]

export default function SourcePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        .source-section p { margin-bottom: 1rem; font-size: 0.88rem; color: ${C.textMuted}; line-height: 1.8; }
        .source-section p:last-child { margin-bottom: 0; }
        .source-section ul, .source-section ol { margin: 0.75rem 0 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.65rem; }
        .source-section li { font-size: 0.88rem; color: ${C.textMuted}; line-height: 1.7; }
        .source-section strong { color: ${C.text}; font-weight: 600; }
        .source-section em { color: ${C.textMuted}; font-style: italic; }
        a { text-decoration: none; }
      `}} />

      <main
        style={{
          minHeight: '100vh',
          background: C.bg,
          fontFamily: "'Pretendard Variable', Pretendard, system-ui, sans-serif",
          color: C.text,
        }}
      >
        {/* Nav */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: C.bg,
            borderBottom: `1px solid ${C.border}`,
            padding: '14px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Link href="/demo" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            &larr; Back to story
          </Link>
          <span style={{ color: C.border }}>|</span>
          <span
            style={{
              fontSize: '0.8rem',
              color: C.textFaint,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Provenance Tracker &middot; Source Document
          </span>
        </nav>

        <div style={{ maxWidth: 820, margin: '0 auto', padding: '60px 32px 100px' }}>

          {/* NotebookLM notice */}
          <div
            style={{
              padding: '14px 20px',
              border: `1px solid ${C.borderMid}`,
              borderRadius: 8,
              background: 'rgba(212,168,83,0.04)',
              marginBottom: 56,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <span style={{ color: C.gold, fontSize: '0.75rem', marginTop: '0.1em', flexShrink: 0 }}>
              &#9432;
            </span>
            <p
              style={{
                fontSize: '0.8rem',
                color: C.textMuted,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              This page is a structured source document for NotebookLM. Paste this URL into
              NotebookLM to generate a presentation or audio overview of the Provenance Tracker
              project.
            </p>
          </div>

          {/* Hero */}
          <div style={{ marginBottom: 64 }}>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: C.textFaint,
                marginBottom: 16,
              }}
            >
              Source document
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 400,
                color: C.text,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                marginBottom: 16,
              }}
            >
              Provenance Tracker
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: C.textMuted,
                lineHeight: 1.7,
                maxWidth: 560,
              }}
            >
              A war-tracker-style 3D globe for art provenance. 10 structured sections covering
              project overview, origin story, data sources, agent team, business model, and honesty
              principles.
            </p>
          </div>

          {/* Content sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map((section, idx) => (
              <div
                key={section.id}
                id={section.id}
                className="source-section"
                style={{
                  padding: '32px 36px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  marginBottom: idx < SECTIONS.length - 1 ? 12 : 0,
                }}
              >
                {/* Section header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '0.65rem',
                      color: C.textFaint,
                      letterSpacing: '0.08em',
                      flexShrink: 0,
                    }}
                  >
                    {section.number}
                  </span>
                  <h2
                    style={{
                      fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                      fontWeight: 500,
                      color: C.text,
                      lineHeight: 1.2,
                    }}
                  >
                    {section.title}
                  </h2>
                </div>

                {/* Divider */}
                <div
                  style={{
                    width: 40,
                    height: 1,
                    background: C.border,
                    marginBottom: 20,
                  }}
                />

                {/* Body */}
                <div>{section.body}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 56,
              borderTop: `1px solid ${C.border}`,
              paddingTop: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontSize: '0.72rem', color: C.textFaint }}>
              Sources: Wikidata &middot; Met &middot; AIC &middot; Rijksmuseum &middot; Getty GPI &middot; BnF &middot; Cultural Heritage Administration of Korea
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link
                href="/demo"
                style={{
                  fontSize: '0.72rem',
                  color: C.textMuted,
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: 1,
                }}
              >
                Story page &rarr;
              </Link>
              <Link
                href="/"
                style={{
                  fontSize: '0.72rem',
                  color: C.textMuted,
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: 1,
                }}
              >
                Explore journeys &rarr;
              </Link>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
