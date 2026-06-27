/**
 * /impressum — Legal notice / imprint (German § 5 DDG / § 18 MStV style).
 * Static server component — no client JS. Design tokens match /team, /pricing, /learn.
 *
 * ⚠ COMPLETE BEFORE RELYING ON THIS LEGALLY:
 *   Fill `OPERATOR.address` and `OPERATOR.email` below with real values. A German
 *   Impressum legally requires a reachable postal address + contact. We deliberately
 *   ship these EMPTY (never invent an address; never publish a private email without
 *   the operator's say-so). While empty, the page renders a visible draft notice.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING as C } from '@/lib/design-tokens'

export const metadata: Metadata = {
  title: 'Impressum / Legal notice — Provenance Tracker',
  description:
    'Legal notice for Provenance Tracker — a non-commercial, educational provenance-research project. Operator, contact, liability, and image credits.',
}

// ── Operator details — EDIT THESE ────────────────────────────────────────────
const OPERATOR = {
  name: 'Nayoung Ahn',
  // Postal address required for a German Impressum. Leave '' until you add a real one.
  address: '',
  // Contact email. Leave '' until you add one (a role/dedicated address is wise).
  email: '',
}
const INCOMPLETE = !OPERATOR.address || !OPERATOR.email

function Field({ label, value, placeholder }: { label: string; value: string; placeholder: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 3 }}>{label}</div>
      {value
        ? <div style={{ fontSize: '0.9rem', color: C.text, lineHeight: 1.5 }}>{value}</div>
        : <div style={{ fontSize: '0.85rem', color: C.clay, fontStyle: 'italic' }}>{placeholder}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.text, marginBottom: 12, letterSpacing: '0.01em' }}>{title}</h2>
      <div style={{ fontSize: '0.86rem', color: C.textMuted, lineHeight: 1.7 }}>{children}</div>
    </section>
  )
}

export default function ImpressumPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        a { text-decoration: none; }
      ` }} />

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Pretendard Variable', Pretendard, system-ui, sans-serif", color: C.text }}>

        {/* Nav */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>← Back to journeys</Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: '0.8rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Provenance Tracker · Legal notice</span>
        </nav>

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 32px 100px' }}>

          {/* Hero */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 16 }}>
              Impressum
            </div>
            <h1 style={{ fontFamily: "'Pretendard Variable', serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 300, color: C.text, lineHeight: 1.1, marginBottom: 16 }}>
              Legal notice
            </h1>
            <p style={{ fontSize: '0.9rem', color: C.textMuted, lineHeight: 1.7 }}>
              Provenance Tracker is a <strong style={{ color: C.text }}>non-commercial, educational research project</strong>.
              It does not sell access or take payment; any pricing shown elsewhere on the site describes a possible future
              direction, not a current offering.
            </p>
          </div>

          {/* Draft notice — only while required fields are empty */}
          {INCOMPLETE && (
            <div style={{ background: 'rgba(200,120,85,0.06)', border: `1px solid ${C.clay}55`, borderRadius: 10, padding: '14px 18px', marginBottom: 40 }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.clay, marginBottom: 6 }}>Draft — complete before relying on this</div>
              <div style={{ fontSize: '0.82rem', color: C.textMuted, lineHeight: 1.6 }}>
                A legally valid Impressum (§ 5 DDG) needs a real postal address and contact. Add them in{' '}
                <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.text }}>src/app/impressum/page.tsx</code>{' '}
                (the <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.text }}>OPERATOR</code> block). This notice disappears once both are filled.
              </div>
            </div>
          )}

          {/* Operator */}
          <Section title="Responsible for this site (Diensteanbieter)">
            <Field label="Name" value={OPERATOR.name} placeholder="[ operator name — required ]" />
            <Field label="Address (Anschrift)" value={OPERATOR.address} placeholder="[ postal address — required for a German Impressum ]" />
            <Field label="Contact (Kontakt)" value={OPERATOR.email} placeholder="[ contact email — required ]" />
          </Section>

          <Section title="Responsible for content (V. i. S. d. P.)">
            {OPERATOR.name} (address as above). Responsible for journalistic-editorial content under § 18 Abs. 2 MStV.
          </Section>

          <Section title="Nature of the project">
            This is a curated provenance-storytelling demo and a method proof-of-concept — not an insurance-grade service,
            not a live &ldquo;where is it now&rdquo; tracker, and not a commercial product. Every on-screen fact carries a
            visible source, gaps are shown honestly, and ownership history is kept separate from exhibition loans.
          </Section>

          <Section title="Image credits (Bildnachweise)">
            Artwork images are shown only for works the holding institution marks as <strong style={{ color: C.text }}>public domain</strong>,
            and are credited to that institution (e.g. the Art Institute of Chicago). Data is drawn from public museum and
            research APIs — Met, Art Institute of Chicago, Rijksmuseum, Wikidata, Cleveland Museum of Art, the Getty
            Provenance Index, RKD, and Europeana — each credited at the point of use. See{' '}
            <Link href="/learn" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>the glossary</Link> and the in-app source badges.
          </Section>

          <Section title="Liability for content (Haftung für Inhalte)">
            Content is compiled with care from the sources above, but no guarantee is made as to its completeness,
            accuracy, or timeliness. Provenance research is inherently incomplete; documented gaps are shown as gaps and
            never filled with invented data.
          </Section>

          <Section title="Liability for links (Haftung für Links)">
            This site links to external sources (museums, research institutes, archives). Their content is the
            responsibility of their respective operators; no continuous monitoring of linked pages is performed without
            concrete indication of a legal violation.
          </Section>

          <Section title="Copyright">
            © 2026 {OPERATOR.name}. Source code: see the{' '}
            <a href="https://github.com/nyahn01/provenance-tracker" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>repository</a> and its
            LICENSE. Third-party data and images remain under the rights of their respective institutions.
          </Section>

          {/* Footer nav */}
          <div style={{ marginTop: 64, borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '0.72rem', color: C.textFaint }}>Provenance Tracker · non-commercial research project</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Link href="/learn" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>Provenance glossary →</Link>
              <Link href="/feedback" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>Send feedback →</Link>
              <Link href="/" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>Explore journeys →</Link>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
