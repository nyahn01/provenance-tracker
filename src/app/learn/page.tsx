/**
 * /learn — Provenance Glossary
 * Static server component — no client-side JS required.
 * Covers the six core concepts a visitor needs to understand this platform.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING as C } from '@/lib/design-tokens'

export const metadata: Metadata = {
  title: 'Provenance Glossary — Provenance Tracker',
  description:
    'Learn what provenance means, why gaps matter, and how the Getty Provenance Index, WWII-era records, and Korean cultural heritage fit into the story of art ownership.',
}

interface Section {
  id: string
  label: string
  title: string
  body: React.ReactNode
}

const SECTIONS: Section[] = [
  {
    id: 'what-is-provenance',
    label: '01',
    title: 'What is provenance?',
    body: (
      <>
        <p>
          Provenance is the documented chain of custody for a work of art — every person, dealer,
          institution, and government that owned or controlled it, from creation to the present day.
          A complete provenance reads like a passport: dated stamps of who held the work, where, and
          for how long.
        </p>
        <p>
          The word comes from the French <em>provenir</em> (to originate). In the art world it is
          both a scholarly discipline and a legal safeguard. A strong provenance demonstrates
          legitimate title; a broken one flags risk.
        </p>
        <p>
          On this platform every custody entry carries a visible source — Met, AIC, Rijksmuseum,
          Wikidata, or Getty GPI. If the source cannot verify the date or owner, we show a gap
          rather than guess.
        </p>
      </>
    ),
  },
  {
    id: 'custody-vs-loan',
    label: '02',
    title: 'Custody vs. exhibition loan',
    body: (
      <>
        <p>
          <strong style={{ color: C.gold }}>Custody (ownership)</strong> means a party held legal
          title to the work. Custody changes appear as{' '}
          <span style={{ display: 'inline-block', width: 16, height: 2, background: C.gold, borderRadius: 1, verticalAlign: 'middle', marginInline: 4 }} />
          gold arcs on the globe — the work physically moved and a new owner took title.
        </p>
        <p>
          <strong style={{ color: C.sage }}>Exhibition loans</strong> are temporary — the owner lends
          the work to another museum for display. The owner never changes. Loans appear as{' '}
          <span style={{ display: 'inline-block', width: 16, height: 2, background: C.sage, borderRadius: 1, verticalAlign: 'middle', marginInline: 4 }} />
          sage arcs. They enrich the story but do not constitute a custody transfer.
        </p>
        <p>
          Conflating loans with ownership transfers is one of the most common errors in popular
          provenance coverage. This platform keeps them categorically separate: the timeline labels
          each entry as <em>custody</em>, <em>museum acq.</em>, <em>bequest</em>, or{' '}
          <em>exhibition</em>, and the arc color reinforces the distinction on the globe.
        </p>
      </>
    ),
  },
  {
    id: 'provenance-gap',
    label: '03',
    title: 'What is a provenance gap?',
    body: (
      <>
        <p>
          A provenance gap is a period for which no credible documentation of ownership exists. The
          work did not disappear — it simply passed through hands that left no verifiable paper
          trail in museum records, dealer stock books, or public archives.
        </p>
        <p>
          Gaps have significant legal weight. Under the{' '}
          <strong>Washington Principles on Nazi-Confiscated Art (1998)</strong>, signatories — including
          44 countries and hundreds of museums — agreed to research gaps that fall between 1933 and
          1945, identify works that changed hands under duress, and pursue fair and just solutions
          with claimants.
        </p>
        <p>
          Gaps are also the entry point for restitution claims. If a Jewish collector can document
          they owned a work before 1933 and the post-1945 owner cannot document legitimate transfer,
          courts in Germany, the Netherlands, Austria, and the US have awarded restitution. The Art
          Loss Register currently lists over 600,000 objects stolen or lost during the WWII era.
        </p>
        <p>
          On this platform, gaps render as dashed borders and a "░ Provenance gap" indicator — not
          hidden, never papered over.
        </p>
      </>
    ),
  },
  {
    id: 'getty-provenance-index',
    label: '04',
    title: 'What is the Getty Provenance Index?',
    body: (
      <>
        <p>
          The Getty Provenance Index (GPI) is a public database maintained by the Getty Research
          Institute in Los Angeles. It digitizes and indexes the stock books, sales records, and
          inventories of major art dealers and auction houses — sources that museum provenance
          records often omit.
        </p>
        <p>
          Two datasets are particularly important here:
        </p>
        <ul>
          <li>
            <strong>Knoedler Stock Books (1872–1970)</strong> — M. Knoedler &amp; Co. was the
            dominant American dealer for European Old Masters and Impressionists. Their stock books
            record every work bought, from whom, for how much, and sold to whom. Over 2,600 records
            are now in the GPI under a CC0 licence.
          </li>
          <li>
            <strong>Goupil &amp; Cie (1846–1920)</strong> — the Paris firm that represented Van
            Gogh, Monet, Gérome, and Bouguereau. The Goupil &amp; Manzi records document the
            commercial European market before museum acquisition. This platform has seeded 4,388
            Goupil records from the GPI.
          </li>
        </ul>
        <p>
          GPI records appear in the provenance timeline as{' '}
          <span style={{ fontFamily: 'monospace', fontSize: '0.8em', background: 'rgba(124,92,191,0.12)', color: '#9b7fe0', border: '1px solid rgba(124,92,191,0.30)', borderRadius: 3, padding: '1px 5px' }}>GPI</span>
          {' '}badges and as amber dealer-trail arcs on the globe.
        </p>
      </>
    ),
  },
  {
    id: 'wwii-era',
    label: '05',
    title: 'WWII era (1933–1945) — why these dates matter',
    body: (
      <>
        <p>
          January 30, 1933: Hitler becomes Chancellor of Germany. That date marks the beginning of
          systematic dispossession of Jewish property across Nazi-controlled Europe. By 1945,
          approximately <strong>600,000 works of art</strong> had been looted, seized, or sold
          under duress. The number still unresolved exceeds 100,000.
        </p>
        <p>
          The mechanisms of looting varied. The Einsatzstab Reichsleiter Rosenberg (ERR) conducted
          organized confiscations. Jewish collectors in France, the Netherlands, Germany, Austria,
          and Poland were forced to sell through Aryanization; in occupied countries, Gestapo
          seizures required no pretense of sale at all.
        </p>
        <p>
          Postwar restitution was incomplete. The Allies returned some works; many others entered
          legitimate-looking chains of custody through Swiss and American dealers without triggering
          scrutiny. The Washington Principles created the framework for re-examining those chains.
        </p>
        <p>
          This platform marks any custody gap that overlaps 1933–1945 with elevated visual weight.
          A gap in that window does not prove looting — it proves the need for further research.
        </p>
      </>
    ),
  },
  {
    id: 'korean-cultural-heritage',
    label: '06',
    title: 'Korean cultural heritage',
    body: (
      <>
        <p>
          Korea's colonial period (1910–1945) saw systematic dispersal of cultural heritage under
          Japanese imperial rule. Temples, royal palaces, and private collections were stripped;
          objects entered Japanese collections, the international art market, and western museums
          with thin or falsified provenance.
        </p>
        <p>
          The case of{' '}
          <strong>
            Jikji (직지심체요절, 1377, Bibliothèque nationale de France, Paris)
          </strong>{' '}
          illustrates the complexity. Printed at Heungdeoksa Temple in Cheongju using movable metal
          type — the earliest surviving example of such printing, predating Gutenberg by 78 years —
          it was acquired by the French diplomat Victor Collin de Plancy around 1887 and bequeathed
          to the BnF in 1950. The Korean government formally requested its return; the BnF, citing
          French law, has not transferred it.
        </p>
        <p>
          Over 200,000 Korean cultural artifacts are estimated to be held abroad. The Cultural
          Heritage Administration of Korea maintains a database of overseas Korean heritage and
          pursues diplomatic repatriation efforts on a case-by-case basis.
        </p>
        <p>
          Provenance research is the foundation of any repatriation claim. Documenting when and how
          an object left its country of origin — and whether that departure was voluntary or
          coerced — is the first step in any restitution negotiation.
        </p>
      </>
    ),
  },
]

export default function LearnPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        .learn-section p { margin-bottom: 1rem; font-size: 0.9rem; color: ${C.textMuted}; line-height: 1.75; }
        .learn-section p:last-child { margin-bottom: 0; }
        .learn-section ul { margin: 0.75rem 0 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
        .learn-section li { font-size: 0.9rem; color: ${C.textMuted}; line-height: 1.65; }
        .learn-section strong { color: ${C.text}; font-weight: 600; }
        .learn-section em { color: ${C.textMuted}; font-style: italic; }
        .section-card:hover { border-color: ${C.borderMid} !important; }
        a { text-decoration: none; }
        @media (min-width: 900px) {
          .toc-sticky { position: sticky; top: 80px; }
        }
      ` }} />

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Pretendard Variable', Pretendard, system-ui, sans-serif", color: C.text }}>

        {/* Nav */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            ← Back to journeys
          </Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: '0.8rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Provenance Tracker · Glossary
          </span>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 32px 100px' }}>

          {/* Hero */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 16 }}>
              Provenance Glossary
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 300, color: C.text, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.01em' }}>
              The language of<br />art ownership
            </h1>
            <p style={{ fontSize: '1rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 560 }}>
              Six concepts that underpin every arc, gap, and source badge on this platform.
              Understanding them makes the map readable — and the stakes clear.
            </p>
          </div>

          {/* Main layout: TOC sidebar + content */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 48 }}>

            {/* TOC — shown inline on mobile, sticky on desktop via CSS */}
            <nav aria-label="Table of contents" style={{ display: 'none' }} className="toc-sticky">
              {/* Desktop TOC is hidden on mobile; content is the primary nav */}
            </nav>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SECTIONS.map((section, idx) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="section-card learn-section"
                  style={{
                    padding: '32px 36px',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    transition: 'border-color 0.2s',
                    marginBottom: idx < SECTIONS.length - 1 ? 16 : 0,
                  }}
                >
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                    <span style={{ fontFamily: "'Courier New', monospace", fontSize: '0.65rem', color: C.textFaint, letterSpacing: '0.08em', flexShrink: 0 }}>
                      {section.label}
                    </span>
                    <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)', fontWeight: 400, color: C.text, lineHeight: 1.2 }}>
                      {section.title}
                    </h2>
                  </div>

                  {/* Divider */}
                  <div style={{ width: 40, height: 1, background: C.border, marginBottom: 20 }} />

                  {/* Body */}
                  <div>
                    {section.body}
                  </div>
                </div>
              ))}

              {/* Quick-reference legend */}
              <div style={{
                marginTop: 16,
                padding: '24px 28px',
                background: 'rgba(212,168,83,0.04)',
                border: `1px solid rgba(212,168,83,0.18)`,
                borderRadius: 12,
              }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>
                  Globe arc legend
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { color: C.gold, label: 'Custody arc', desc: 'Ownership transfer — legal title changed hands' },
                    { color: C.sage, label: 'Loan arc', desc: 'Exhibition loan — temporary, owner unchanged' },
                    { color: 'rgba(180,130,60,0.8)', label: 'Dealer arc', desc: 'Getty GPI dealer transaction (Knoedler · Goupil)' },
                    { color: C.gap, label: 'Gap indicator', desc: 'No documented custody for this period' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'inline-block', width: 24, height: 2, background: item.color, borderRadius: 1, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: C.text, fontWeight: 500, minWidth: 100 }}>{item.label}</span>
                      <span style={{ fontSize: '0.78rem', color: C.textMuted }}>{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer nav */}
          <div style={{ marginTop: 64, borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '0.72rem', color: C.textFaint }}>
              Sources: Washington Principles 1998 · Getty Research Institute · Cultural Heritage Administration of Korea · BnF
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link href="/demo" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Our story →
              </Link>
              <Link href="/pricing" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Pricing →
              </Link>
              <Link href="/team" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                How the platform works →
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
