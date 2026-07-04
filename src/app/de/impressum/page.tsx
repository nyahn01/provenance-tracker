/**
 * /de/impressum — the real German-language legal notice (§ 5 DDG / § 18 MStV).
 * Static server component — no client JS. Shell comes from de/layout.tsx;
 * column + typography from '@/components/ui'.
 *
 * Mirrors /impressum (src/app/(pages)/impressum/page.tsx) structurally; both
 * import OPERATOR from '@/lib/operator' so identity details are entered once.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING as C } from '@/lib/design-tokens'
import { PageShell, Eyebrow, CTALink } from '@/components/ui'
import { OPERATOR, OPERATOR_INCOMPLETE as INCOMPLETE } from '@/lib/operator'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Impressum — Provenance Tracker',
  description:
    'Impressum für Provenance Tracker — ein nicht-kommerzielles, bildungsorientiertes Provenienz-Forschungsprojekt. Betreiber, Kontakt, Haftung und Bildnachweise.',
  alternates: {
    languages: { en: `${SITE_URL}/impressum`, de: `${SITE_URL}/de/impressum` },
  },
}

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

export default function ImpressumPageDe() {
  return (
    <PageShell>

      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <Eyebrow>Impressum</Eyebrow>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: C.text, lineHeight: 1.1, marginBottom: 16 }}>
          Impressum
        </h1>
        <p style={{ fontSize: '0.9rem', color: C.textMuted, lineHeight: 1.7 }}>
          Provenance Tracker ist ein <strong style={{ color: C.text }}>nicht-kommerzielles, bildungsorientiertes Forschungsprojekt</strong>.
          Es verkauft keinen Zugang und nimmt keine Zahlungen entgegen; die auf der Support-Seite beschriebene
          mögliche zukünftige Ausrichtung ist eine Option, kein aktuelles Angebot.
        </p>
      </div>

      {/* Entwurfshinweis — nur solange Pflichtfelder leer sind */}
      {INCOMPLETE && (
        <div style={{ background: 'rgba(200,120,85,0.06)', border: `1px solid ${C.clay}55`, borderRadius: 10, padding: '14px 18px', marginBottom: 40 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.clay, marginBottom: 6 }}>Entwurf — vor rechtlicher Verwendung vervollständigen</div>
          <div style={{ fontSize: '0.82rem', color: C.textMuted, lineHeight: 1.6 }}>
            Ein rechtsgültiges Impressum (§ 5 DDG) benötigt eine echte Postanschrift und Kontaktmöglichkeit. Ergänzen Sie diese in{' '}
            <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.text }}>src/lib/operator.ts</code>.
            {' '}Dieser Hinweis verschwindet, sobald beide Felder ausgefüllt sind.
          </div>
        </div>
      )}

      {/* Betreiber */}
      <Section title="Verantwortlich für dieses Angebot (Diensteanbieter)">
        <Field label="Name" value={OPERATOR.name} placeholder="[ Name des Betreibers — erforderlich ]" />
        <Field label="Anschrift" value={OPERATOR.address} placeholder="[ Postanschrift — für ein deutsches Impressum erforderlich ]" />
        <Field label="Kontakt" value={OPERATOR.email} placeholder="[ Kontakt-E-Mail — erforderlich ]" />
      </Section>

      <Section title="Verantwortlich für den Inhalt (V. i. S. d. P.)">
        {OPERATOR.name} (Anschrift wie oben). Verantwortlich für journalistisch-redaktionelle Inhalte gemäß § 18 Abs. 2 MStV.
      </Section>

      <Section title="Art des Projekts">
        Dies ist eine kuratierte Demo zur Provenienz-Erzählung und ein Nachweis der Methode – kein
        versicherungstauglicher Dienst, kein Live-Tracker für den aktuellen Standort eines Werks und kein
        kommerzielles Produkt. Jede angezeigte Tatsache trägt eine sichtbare Quelle, Lücken werden ehrlich
        dargestellt, und die Eigentumsgeschichte wird stets getrennt von Ausstellungsleihgaben gehalten.
      </Section>

      <Section title="Bildnachweise">
        Abbildungen von Kunstwerken werden nur für Werke gezeigt, die von der besitzenden Institution als{' '}
        <strong style={{ color: C.text }}>gemeinfrei (Public Domain)</strong> gekennzeichnet sind, und werden
        dieser Institution zugeschrieben (z.&nbsp;B. dem Art Institute of Chicago). Die Daten stammen aus
        öffentlichen Museums- und Forschungs-APIs — Met, Art Institute of Chicago, Rijksmuseum, Wikidata,
        Cleveland Museum of Art, dem Getty Provenance Index, RKD und Europeana — jeweils an der
        Verwendungsstelle mit Quellenangabe. Siehe{' '}
        <Link href="/learn" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}>das Glossar (auf Englisch)</Link>{' '}
        und die Quellenkennzeichnungen in der Anwendung.
      </Section>

      <Section title="Haftung für Inhalte">
        Die Inhalte wurden sorgfältig aus den oben genannten Quellen zusammengestellt, es wird jedoch keine
        Gewähr für Vollständigkeit, Richtigkeit und Aktualität übernommen. Provenienzforschung ist naturgemäß
        unvollständig; dokumentierte Lücken werden als Lücken dargestellt und niemals mit erfundenen Daten
        aufgefüllt.
      </Section>

      <Section title="Analyse">
        Diese Website verwendet <a href="https://vercel.com/docs/analytics" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}>Vercel Web Analytics</a>,
        einen cookielosen, datenschutzfreundlichen Dienst, der Seitenaufrufe und Referrer zählt, ohne
        einzelne Personen zu verfolgen oder personenbezogene Daten seitenübergreifend zu speichern.
      </Section>

      <Section title="Haftung für Links">
        Diese Website verlinkt auf externe Quellen (Museen, Forschungseinrichtungen, Archive). Für deren
        Inhalte sind die jeweiligen Betreiber verantwortlich; eine dauerhafte inhaltliche Kontrolle der
        verlinkten Seiten erfolgt nicht, sofern keine konkreten Anhaltspunkte für eine Rechtsverletzung
        vorliegen.
      </Section>

      <Section title="Urheberrecht">
        © 2026 {OPERATOR.name}. Quellcode: siehe das{' '}
        <a href="https://github.com/nyahn01/provenance-tracker" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}>Repository</a>{' '}
        und dessen LICENSE. Daten und Abbildungen Dritter unterliegen weiterhin den Rechten der jeweiligen
        Institutionen.
      </Section>

      {/* Fußnavigation */}
      <div style={{ marginTop: 64, borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: '0.72rem', color: C.textFaint }}>Provenance Tracker · nicht-kommerzielles Forschungsprojekt</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <CTALink href="/impressum" size="0.72rem">In English →</CTALink>
          <CTALink href="/de/case/adele-bloch-bauer-i" size="0.72rem">Fallstudie: Adele Bloch-Bauer →</CTALink>
          <CTALink href="/feedback" size="0.72rem">Feedback senden →</CTALink>
        </div>
      </div>

    </PageShell>
  )
}
