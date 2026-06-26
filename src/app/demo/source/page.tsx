/**
 * /demo/source — Structured source document for NotebookLM ingestion.
 * No animations. Content-dense prose with sourced claims.
 * Paste this URL into NotebookLM to generate a presentation or audio overview.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING as C } from '@/lib/design-tokens'

export const metadata: Metadata = {
  title: 'Source Document — Provenance Tracker',
  description:
    'Structured source document for NotebookLM. 12 sections: project overview, origin story, data sources and engineering, agent team, business model, Jikji, honesty principles, Q&A prep, and key quotes.',
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
          Provenance Tracker is a web application that visualises the custody chains of famous
          works of art on an interactive 3D globe. It is designed for museum professionals,
          restitution law firms, art historians, insurers, and the art-curious public.
        </p>
        <p>
          The core proposition: a painting with a clean, verified chain of custody is worth more
          than one with gaps — to insurers, to auction houses, to heirs. No existing tool presents
          that chain in one place, sourced and dated, with gaps shown honestly rather than papered
          over. Provenance Tracker does.
        </p>
        <p>
          The platform is not an insurance-grade API, does not make live cross-museum custody claims,
          and does not invent data. It is a rigorous, sourced, editorial product — closer in spirit
          to a scholarly provenance catalogue than a live tracking dashboard.
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
          A friend of the founder debuted as a curator at the National Gallery, London. His
          ambition: to curate the great museums — the Louvre, the National Gallery, and beyond.
          Travelling between cities, he would remark that a painting he had seen in one museum
          had moved — and ask where it had gone. No single tool could answer that.
        </p>
        <p>
          The founder is a data professional working in insurance. The inspiration for the
          interface was FlightRadar24 — a platform that made invisible journeys (aircraft in
          flight) suddenly visible to anyone with a browser. The same logic applied to art: if
          you could draw arcs between every city a painting had passed through, the hidden
          journeys of masterpieces would become legible.
        </p>
        <p>
          This platform began as a gift — an answer to the curator friend&apos;s question. It
          evolved into a method proof-of-concept for provenance due diligence, with a commercial
          angle aimed at restitution law firms and museum registrars dealing with WWII-era claims.
        </p>
        <p>
          The platform was also the founder&apos;s first time using an AI agent team. Agents
          handled data integration, globe engineering, design, strategy, and narrative — in
          parallel, overnight. The human reviews, redirects, and merges.
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
          The landing page presents an editorial gallery of curated public-domain masterpieces.
          Each work links to a story view: an artwork hero image, a dated chain-of-custody
          timeline, and a 3D globe that animates the painting&apos;s journey between cities and
          institutions.
        </p>
        <p>
          The globe renders three types of arcs, colour-coded to distinguish their meaning:
        </p>
        <ul>
          <li>
            <strong>Gold arcs (altitude 0.18)</strong> — ownership transfers. Legal title
            changed hands. These are custody events.
          </li>
          <li>
            <strong>Sage arcs (altitude 0.30)</strong> — exhibition loans. The work moved
            temporarily for display; the owner did not change. Loans are never conflated with
            ownership.
          </li>
          <li>
            <strong>Amber arcs (altitude 0.12)</strong> — dealer trails from the Getty
            Provenance Index. Transactions recorded in the Knoedler and Goupil stock books that
            predate museum acquisition. Each arc connects seller city to buyer city.
          </li>
        </ul>
        <p>
          The sidebar timeline merges records from multiple data sources into one chronological
          view, each entry stamped with its source. Where documentation is absent, the platform
          renders an explicit provenance gap: dashed border, muted styling, and a &ldquo;░
          Provenance gap&rdquo; indicator. Gaps are shown, never filled.
        </p>
        <p>
          A search path lets visitors explore beyond the curated collection via the Met, AIC,
          and Rijksmuseum APIs. When results are thin, the empty state is intentional — the
          gap is labelled, not hidden.
        </p>
      </>
    ),
  },
  {
    id: 'data-sources',
    number: '04',
    title: 'Data sources and engineering layer',
    body: (
      <>
        <p>
          All five live data sources are open and free of API keys:
        </p>
        <ul>
          <li>
            <strong>Metropolitan Museum of Art API</strong> — Returns object records including
            provenance prose, medium, department, and image links for public-domain works.
          </li>
          <li>
            <strong>Art Institute of Chicago API</strong> — Returns structured object data
            including provenance text, dates, and IIIF image manifests.
          </li>
          <li>
            <strong>Rijksmuseum Linked Art API</strong> — Query by creator, title, and type.
            Object records at id.rijksmuseum.nl. The old www.rijksmuseum.nl/api endpoint is
            retired (HTTP 410) and is not used.
          </li>
          <li>
            <strong>Wikidata SPARQL</strong> — Properties: P276 (location), P580 (start time),
            P582 (end time), P571 (inception), P170 (creator). Enables structured provenance
            queries across any Wikidata-indexed artwork.
          </li>
          <li>
            <strong>Getty Provenance Index (GPI)</strong> — Knoedler stock books 1872–1970
            (2,600+ records) and Goupil &amp; Cie 1846–1919 (1,788 records), combined to 4,388.
            Published under CC0 by the Getty Research Institute. Records document dealer
            transactions: buyer, seller, price, date, and location.
          </li>
        </ul>
        <p>
          <strong>Data engineering layer — how five schemas become one timeline:</strong>
        </p>
        <ul>
          <li>
            <strong>Schema normalisation:</strong> Each API returns a different JSON shape.
            All records are normalised to a shared{' '}
            <code>ProvenanceEvent</code> TypeScript interface with fields: year, sortKey, type,
            who, where, detail, price, source, sourceUrl.
          </li>
          <li>
            <strong>Date parsing:</strong> Museum provenance prose is unstructured text
            (&ldquo;acquired by bequest, circa 1924–26&rdquo;). A regex parser extracts four-digit
            years as structured start dates. Events without parseable dates receive sortKey 9999
            and float to the bottom of the timeline.
          </li>
          <li>
            <strong>Geocoding:</strong> Institution names are resolved to latitude/longitude via
            a 30-city lookup table (<code>CITY_COORDS</code>). Unresolvable cities are excluded
            from globe arc generation but still appear in the sidebar timeline.
          </li>
          <li>
            <strong>GPI joining:</strong> Knoedler and Goupil records are joined to artworks by
            artist name match. Seller→buyer city pairs generate amber arc coordinates. Duplicate
            city pairs within one artist&apos;s records are deduplicated before rendering.
          </li>
          <li>
            <strong>Multi-source merge and deduplication:</strong> <code>buildUnifiedTimeline()</code>{' '}
            merges custody locations, exhibition records, and GPI dealer records into one array,
            deduplicated by event type and year, then sorted chronologically by sortKey.
          </li>
          <li>
            <strong>Confidence scoring:</strong> Each event is tagged high (AIC/Met direct
            institutional record), medium (Wikidata P276), or low (inferred from prose without
            explicit dates). Confidence dots render next to each source badge in the sidebar.
          </li>
          <li>
            <strong>RKD (Netherlands Art Institute):</strong> A fourth parallel API fetch for
            Dutch-linked works. Returns structured provenance text and current location.
            Displayed in a separate collapsible section in the sidebar with a teal source badge.
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
          <li><strong>4,388</strong> — Getty Provenance Index dealer records seeded (Knoedler + Goupil)</li>
          <li><strong>2,600+</strong> — Knoedler stock book records (CC0)</li>
          <li><strong>1,788</strong> — Goupil &amp; Cie records (CC0)</li>
          <li><strong>5</strong> — live museum and data APIs integrated</li>
          <li><strong>7</strong> — AI specialist agents in the build team</li>
          <li><strong>3</strong> — pricing tiers (Explorer free / Researcher €99/mo / Institution €999/mo)</li>
          <li><strong>30</strong> — cities in the geocoding lookup table for globe arc generation</li>
          <li><strong>600,000+</strong> — estimated artworks looted during WWII era (Art Loss Register)</li>
          <li><strong>100,000+</strong> — WWII-era works estimated still unresolved post-1945 (Art Loss Register)</li>
          <li><strong>200,000+</strong> — Korean cultural artifacts estimated held abroad (Cultural Heritage Administration of Korea)</li>
          <li><strong>44</strong> — countries signatory to the Washington Principles on Nazi-Confiscated Art (1998)</li>
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
          Provenance Tracker is built and maintained by a team of 7 specialized AI agents running
          in Claude on Anthropic&apos;s Max plan. Each agent owns a distinct domain and can block
          a commit.
        </p>
        <ul>
          <li>
            <strong>design-director</strong> (Opus) — visual language, typography, colour, motion.
            Sets the design system. Other agents implement to it, never around it.
          </li>
          <li>
            <strong>provenance-globe</strong> (Sonnet) — Globe.gl arcs and pins, sidebar panels,
            data visualisation, responsive layout, strict design-token fidelity.
          </li>
          <li>
            <strong>provenance-data</strong> (Sonnet) — Wikidata SPARQL, Met/AIC/Rijks/Getty API
            integration, geocoding, caching, rate limiting, data contracts and normalisation.
          </li>
          <li>
            <strong>art-historian</strong> (Opus) — source credibility ranking, gap
            characterisation, custody evidence standards, what makes a provenance claim trustworthy.
          </li>
          <li>
            <strong>provenance-strategy</strong> (Opus) — business case, market research, customer
            segments (insurers, auction houses, restitution lawyers), pricing rationale.
          </li>
          <li>
            <strong>provenance-story</strong> (Opus) — demo narrative, pitch script, hero-work
            selection, presentation structure.
          </li>
          <li>
            <strong>provenance-honesty-review</strong> (Opus) — BLOCKING gate. Audits every diff
            for over-claiming, missing sources, faked data, and custody/loan conflation. No commit
            bypasses this gate.
          </li>
        </ul>
        <p>
          The batch workflow runs overnight: tasks are queued as GitHub Issues (labeled <code>priority</code>),
          agents pick them up in parallel, results converge at the honesty gate, and surviving
          changes are committed and deployed to Vercel automatically.
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
            Getty Provenance Index dealer records, RKD data, confidence scoring, JSON export, API
            access (100 requests/day).
          </li>
          <li>
            <strong>Institution — €999/month.</strong> Museums, auction houses, restitution law
            firms. Adds bulk provenance ingestion, white-label reporting, custom gap analysis,
            priority restitution research queue, dedicated support, SLA, unlimited API access.
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
          requiring provenance due diligence pre-sale, and fine art insurers requiring ownership
          chain verification for policy underwriting.
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
          직지심체요절 — the Jikji — was printed at Heungdeoksa Temple in Cheongju, Korea in
          1377 using movable metal type. It is the world&apos;s oldest surviving example of
          metal-type printing, predating Gutenberg&apos;s Bible by 78 years. Inscribed on the
          UNESCO Memory of the World register in 2001 (ref. Coréen 109, BnF). It sits today in
          the Biblioth&egrave;que nationale de France in Paris. It has never returned to Korea.
        </p>
        <p>
          The Jikji was acquired by the French diplomat Victor Collin de Plancy around 1887 and
          bequeathed to the BnF in 1950. The Korean government has formally requested its return.
          The BnF, citing French law on the inalienability of national collections, has not
          transferred it.
        </p>
        <p>
          Over 200,000 Korean cultural artifacts are estimated to be held abroad (Cultural Heritage
          Administration of Korea). Korea&apos;s colonial period (1910–1945) under Japanese
          imperial rule saw systematic dispersal of cultural heritage.
        </p>
        <p>
          The Jikji is the emblematic case for a platform that can document contested journeys
          with precision. Provenance Tracker could one day be the place where that journey —
          from Cheongju to Paris, and any future repatriation — is documented, disputed, and
          understood by the public. Art lost under colonialism deserves the same rigour as a
          Monet with a WWII gap.
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
            current installation location. The platform never claims a work is &ldquo;currently
            on view&rdquo; at a specific gallery.
          </li>
          <li>
            <strong>Source every fact.</strong> Every on-screen date, owner, or location carries
            a visible source badge: Met · AIC · Rijksmuseum · Wikidata · Getty GPI. Unsourced
            claims are not displayed.
          </li>
          <li>
            <strong>Gaps shown, not filled.</strong> Sparse data renders as an explicit gap state
            — dashed border, &ldquo;░ Provenance gap&rdquo; label. Dates, coordinates, or owners
            are never invented to smooth a timeline.
          </li>
          <li>
            <strong>Custody is not a loan.</strong> Exhibition loans (temporary, no title change)
            are categorically separate from custody transfers (ownership change). Arc colours and
            timeline labels enforce this distinction everywhere.
          </li>
          <li>
            <strong>Public-domain images only.</strong> Images are displayed only for works
            confirmed to be in the public domain, credited to the holding institution.
          </li>
          <li>
            <strong>Graceful empty state.</strong> When data is thin, the interface shows an
            intentional, honest empty state — not a broken-looking screen. The unscripted path
            looks designed.
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
          <li><strong>Framework:</strong> Next.js 14 App Router, TypeScript strict mode.</li>
          <li>
            <strong>Styling:</strong> Design tokens defined in globals.css. Dark Observatory
            palette: background #0a0908, text #f6f1e8, clay #c87855, sage #6f8d7d, gold #d4a853.
          </li>
          <li>
            <strong>Fonts:</strong> Pretendard (UI body, CDN), Cormorant Garamond (display
            headings, Google Fonts).
          </li>
          <li>
            <strong>Globe:</strong> Globe.gl, dynamically imported with <code>ssr: false</code>.
            WebGL 3D globe with custom arc, point, and polygon layers. Ocean rendered via 2×2
            canvas data URL (no atmosphere, no Three.js scene.traverse).
          </li>
          <li>
            <strong>APIs:</strong> All external calls proxied through Next.js API routes
            (server-side only). No API keys exposed to client. Responses cached per-source.
          </li>
          <li>
            <strong>AI:</strong> Anthropic SDK (claude-sonnet-4-6). Currently on deterministic
            fallback (credits paused); extraction from museum prose fields runs without the API.
          </li>
          <li>
            <strong>Deployment:</strong> Vercel, auto-deploy on push to main.
          </li>
          <li>
            <strong>Agents:</strong> 7 specialized Claude agents via Claude Code on Max.
            Ship gate: <code>scripts/ship.mjs</code> (build + health check + honesty grep + commit).
            Honesty CI: <code>scripts/honesty-check.mjs</code> + GitHub Actions.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'qa-prep',
    number: '11',
    title: 'Q&A prep — anticipated questions',
    body: (
      <>
        <p><strong>Q: What&apos;s the business model?</strong></p>
        <p>
          Three tiers. Explorer is free — public, students, art-curious. Researcher at €99/month
          — art historians, journalists, educators who need sourced provenance chains. Institution
          at €999/month — museums, auction houses, restitution law firms who need this as a
          due-diligence tool. The anchor segment is restitution: WWII-era art claims require
          documented gaps, and this platform shows them honestly. That segment pays the most and
          has the clearest need.
        </p>

        <p><strong>Q: Why Claude / why agents?</strong></p>
        <p>
          The honesty gate. Every commit by every agent is reviewed by a credibility agent before
          it lands. It blocks invented data, custody-as-loan conflation, missing source lines.
          That gate is what makes the data trustworthy enough to show to a museum registrar.
          Claude&apos;s agent architecture made it possible to run 7 specialists overnight in
          parallel — the human reviews the result in the morning.
        </p>

        <p><strong>Q: Can you trust the data?</strong></p>
        <p>
          Every fact on screen has a visible source badge — Met, AIC, Rijksmuseum, Wikidata,
          Getty GPI. The Getty Provenance Index data is CC0 — fully open. Gaps are shown as gaps,
          never filled. The honesty-check script runs in CI and blocks any commit that contains a
          custody-as-loan conflation or an unsourced claim.
        </p>

        <p><strong>Q: What about Korean art / non-Western museums?</strong></p>
        <p>
          The Jikji (직지심체요절, 1377) is the test case — the world&apos;s oldest metal-type
          printed book, held at the BnF in Paris, never returned to Korea. The platform could
          document that journey and make the gap legible. Western museum APIs are open; Korean
          and Asian museum APIs are less accessible today, but that is the direction.
        </p>

        <p><strong>Q: How is this different from existing provenance databases?</strong></p>
        <p>
          Existing tools (Getty ULAN, museum registrar systems) are siloed. A museum shows you
          what it knows about its own collection. This platform merges across sources — museum
          acquisition records, dealer stock books, exhibition histories, Wikidata — into one
          timeline per artwork. The gap between &ldquo;Goupil sold it in 1891&rdquo; and
          &ldquo;AIC acquired it in 1926&rdquo; is visible in one view.
        </p>

        <p><strong>Q: Is this production-ready?</strong></p>
        <p>
          It is a working proof of concept with live data. The data pipeline is real — 5 live
          APIs, 4,388 dealer records indexed, CI with honesty gate. What is missing for
          production: Stripe integration, user accounts, PDF export, and deeper coverage beyond
          the curated set. The architecture is solid; the remaining work is product, not research.
        </p>
      </>
    ),
  },
  {
    id: 'key-quotes',
    number: '12',
    title: 'Key quotes',
    body: (
      <>
        {[
          '"That painting was here last time — where did it go?"',
          '"Provenance is not just history. It is evidence."',
          '"Gaps are shown, never invented."',
          '"Art appreciates with documented provenance. Transparency increases value."',
          '"Agents work while you sleep. The human reviews the result in the morning."',
          '"직지심체요절 has never returned to Korea. At least we can document the journey."',
        ].map((quote) => (
          <blockquote key={quote} style={{
            borderLeft: `3px solid ${C.gold}`,
            paddingLeft: 20,
            marginBottom: 20,
            background: 'rgba(212,168,83,0.04)',
            borderRadius: '0 6px 6px 0',
            padding: '14px 20px',
          }}>
            <p style={{ fontStyle: 'italic', fontSize: '0.95rem', color: C.text, lineHeight: 1.6, margin: 0 }}>
              {quote}
            </p>
          </blockquote>
        ))}
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
        .source-section code { font-family: 'Courier New', monospace; font-size: 0.82em; color: ${C.textMuted}; background: rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; }
        a { text-decoration: none; }
      `}} />

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Pretendard Variable', Pretendard, system-ui, sans-serif", color: C.text }}>
        {/* Nav */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/demo" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            &larr; Back to story
          </Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: '0.8rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Provenance Tracker &middot; Source Document
          </span>
        </nav>

        <div style={{ maxWidth: 820, margin: '0 auto', padding: '60px 32px 100px' }}>

          {/* NotebookLM notice */}
          <div style={{ padding: '14px 20px', border: `1px solid ${C.borderMid}`, borderRadius: 8, background: 'rgba(212,168,83,0.04)', marginBottom: 56, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ color: C.gold, fontSize: '0.75rem', marginTop: '0.1em', flexShrink: 0 }}>&#9432;</span>
            <p style={{ fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
              This page is a structured source document for NotebookLM. Paste this URL into
              NotebookLM to generate a presentation or audio overview of the Provenance Tracker project.
            </p>
          </div>

          {/* Hero */}
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 16 }}>
              Source document
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: C.text, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 16 }}>
              Provenance Tracker
            </h1>
            <p style={{ fontSize: '0.95rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 560 }}>
              A 3D globe for art provenance. 12 structured sections covering project overview,
              origin story, data engineering, agent team, business model, Korean cultural heritage,
              honesty principles, Q&amp;A prep, and key quotes.
            </p>
          </div>

          {/* Content sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SECTIONS.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="source-section"
                style={{ padding: '32px 36px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: '0.65rem', color: C.textFaint, letterSpacing: '0.08em', flexShrink: 0 }}>
                    {section.number}
                  </span>
                  <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)', fontWeight: 500, color: C.text, lineHeight: 1.2 }}>
                    {section.title}
                  </h2>
                </div>
                <div style={{ width: 40, height: 1, background: C.border, marginBottom: 20 }} />
                <div>{section.body}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 56, borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '0.72rem', color: C.textFaint }}>
              Sources: Met &middot; AIC &middot; Rijksmuseum &middot; Wikidata &middot; Getty GPI &middot; RKD &middot; BnF &middot; Art Loss Register &middot; UNESCO &middot; Cultural Heritage Administration of Korea
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link href="/demo" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Story page &rarr;
              </Link>
              <Link href="/" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Explore journeys &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
