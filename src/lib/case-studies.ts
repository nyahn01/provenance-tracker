/**
 * Curated restitution case studies — the highest-stakes honesty surface.
 *
 * RULES (enforced by review + npm run honesty):
 *  - Every CaseCustodyEntry / CaseExhibition / CaseGap carries ≥1 CaseSource.
 *  - Ownership (custody) is NEVER mixed with exhibition loans.
 *  - Gaps are shown as gaps. No invented dates, owners, or coordinates.
 *  - No live "currently on view" claims — standing is dated ("as of <year>").
 *  - Facts are sourced to primary records (court rulings, museum pages,
 *    public archives), not paraphrased without attribution.
 *
 * Shapes live in src/lib/types.ts (types-first).
 */

import type { RestitutionCase } from './types'

// ── Reused primary sources (cited inline by short label) ─────────────────────
const S = {
  geneva: {
    label: 'Art-Law Centre, Univ. of Geneva — case file "6 Klimt paintings"',
    url: 'https://plone.unige.ch/art-adr/cases-affaires/6-klimt-paintings-2013-maria-altmann-and-austria',
  },
  scotus: {
    label: 'Republic of Austria v. Altmann, 541 U.S. 677 (U.S. Supreme Court, 2004)',
    url: 'https://supreme.justia.com/cases/federal/us/541/677/',
  },
  lootedart: {
    label: 'Central Registry of Information on Looted Cultural Property 1933–1945 — Altmann case',
    url: 'https://www.lootedart.com/MFEU4R18009',
  },
  neue: {
    label: 'Neue Galerie New York — "Woman in Gold" object page',
    url: 'https://www.neuegalerie.org/womaningold',
  },
  wikidata: {
    label: 'Wikidata Q484289 — Portrait of Adele Bloch-Bauer I',
    url: 'https://www.wikidata.org/wiki/Q484289',
  },
} as const

const adeleBlochBauer: RestitutionCase = {
  slug: 'adele-bloch-bauer-i',
  title: 'Portrait of Adele Bloch-Bauer I',
  artist: 'Gustav Klimt',
  created: '1907',
  medium: 'Oil, silver and gold on canvas',
  // No live "on view" claim — dated standing only.
  currentStatusAsOf:
    'Held by the Neue Galerie New York since its 2006 acquisition (as of 2026).',
  summary:
    'One of the most fully documented Nazi-era restitutions. Klimt’s gold portrait of ' +
    'Adele Bloch-Bauer was seized from the Bloch-Bauer family after the 1938 Anschluss, ' +
    'displayed for decades by Austria’s Belvedere under a falsified provenance, and finally ' +
    'returned to Adele’s niece Maria Altmann in 2006 after a U.S. Supreme Court ruling and ' +
    'binding arbitration in Austria. The chain below separates legitimate custody from the ' +
    'period of coerced control, and marks the falsified-record years as the gap they were.',

  custody: [
    {
      date: '1907',
      holder: 'Ferdinand & Adele Bloch-Bauer',
      place: 'Vienna, Austria-Hungary',
      kind: 'custody',
      detail:
        'Klimt completed the portrait (commissioned 1903). It hung in the Bloch-Bauer home ' +
        'in Vienna. Ferdinand Bloch-Bauer, a sugar industrialist, was the legal owner.',
      sources: [S.wikidata, S.neue],
    },
    {
      date: '1925',
      holder: 'Ferdinand Bloch-Bauer',
      place: 'Vienna, Austria',
      kind: 'custody',
      detail:
        'Adele Bloch-Bauer died of meningitis in January 1925. Her will kindly asked Ferdinand ' +
        'to consider donating the Klimt paintings to the Austrian State Gallery on his own death ' +
        '— a request, not a transfer of title. The paintings remained Ferdinand’s property. ' +
        '(The exact legal weight of this request was the crux of the later dispute.)',
      sources: [S.geneva, S.lootedart],
    },
    {
      date: '1938',
      holder: 'Nazi authorities (confiscation)',
      place: 'Vienna, Austria (annexed)',
      kind: 'coerced',
      detail:
        'After the Anschluss, Ferdinand fled Austria. German authorities confiscated his estate, ' +
        'his sugar factory, and his personal property, which included the Klimt paintings. This ' +
        'was a seizure under duress, not a sale or gift.',
      sources: [S.geneva, S.lootedart],
    },
    {
      date: '1939–1943',
      holder: 'Dr. Erich Führer (Nazi-appointed administrator) → Austrian State Gallery (Belvedere)',
      place: 'Vienna',
      kind: 'coerced',
      detail:
        'A Nazi-appointed administrator dispersed the collection: some works were sold, and ' +
        'Portrait of Adele Bloch-Bauer I passed to the Austrian State Gallery (Belvedere). ' +
        'Provenance records were falsified to suggest a legitimate pre-war acquisition.',
      sources: [S.geneva, S.lootedart],
    },
    {
      date: '1945',
      holder: 'Ferdinand Bloch-Bauer’s heirs (rightful title)',
      place: null,
      kind: 'custody',
      detail:
        'Ferdinand died in November 1945 in exile in Zurich. His will left his estate to his ' +
        'nephew Robert and nieces Luise and Maria (Altmann). Legal title to the paintings passed ' +
        'to the heirs — although the works themselves remained physically held by the Belvedere.',
      sources: [S.geneva, S.lootedart],
    },
    {
      date: '1998–1999',
      holder: 'Austrian State Gallery (Belvedere) — claim contested',
      place: 'Vienna, Austria',
      kind: 'custody',
      detail:
        'Journalist Hubertus Czernin found archive documents showing the Gallery knew it held ' +
        'looted art. Austria passed a 1998 Art Restitution Act; in 1999 its restitution committee ' +
        'nonetheless rejected Maria Altmann’s claim, citing Adele’s 1925 will. The paintings stayed ' +
        'in the Belvedere.',
      sources: [S.geneva, S.lootedart],
    },
    {
      date: '2004',
      holder: 'Maria Altmann (right to sue affirmed)',
      place: 'United States',
      kind: 'restitution',
      detail:
        'In Republic of Austria v. Altmann, the U.S. Supreme Court held that the Foreign Sovereign ' +
        'Immunities Act applied to pre-1976 conduct, allowing Altmann to sue Austria in U.S. courts. ' +
        'This did not award the painting — it cleared the path to a hearing on the merits.',
      sources: [S.scotus, S.geneva],
    },
    {
      date: '2006',
      holder: 'Maria Altmann and the Bloch-Bauer heirs (title restored)',
      place: 'Vienna, Austria',
      kind: 'restitution',
      detail:
        'After the parties agreed in 2005 to binding arbitration in Austria, a three-member panel ' +
        'ruled in January 2006 that Austria must return five Klimt paintings — including this ' +
        'portrait — to the Bloch-Bauer heirs. Title was restored to the family.',
      sources: [S.geneva, S.lootedart],
    },
    {
      date: '2006',
      holder: 'Neue Galerie New York',
      place: 'New York, USA',
      kind: 'custody',
      detail:
        'In June 2006 the portrait was acquired for the Neue Galerie New York, reportedly through ' +
        'Ronald S. Lauder for about US$135 million. This is the painting’s current custodian.',
      sources: [S.neue, S.geneva],
    },
  ],

  // Kept categorically separate from custody — a loan is not a move of title.
  exhibitions: [
    {
      date: '2006',
      venue: 'Los Angeles County Museum of Art (LACMA)',
      detail:
        'Before entering the Neue Galerie, the five restituted Klimts were shown together at LACMA ' +
        'in spring 2006. This was a temporary display of works whose title had already returned to ' +
        'the heirs — an exhibition, not a custody change.',
      sources: [S.geneva],
    },
  ],

  gaps: [
    {
      span: '1939–1945',
      note:
        'During the war years the Belvedere held the painting under a falsified provenance, so the ' +
        'institutional record for this period does not reflect legitimate ownership. We mark it as a ' +
        'gap in legitimate custody: the documented record was knowingly false, and the rightful title ' +
        'remained with the Bloch-Bauer family throughout.',
      sources: [S.geneva, S.lootedart],
    },
  ],

  references: [S.geneva, S.scotus, S.lootedart, S.neue, S.wikidata],
}

export const CASE_STUDIES: Record<string, RestitutionCase> = {
  [adeleBlochBauer.slug]: adeleBlochBauer,
}

export function getCase(slug: string): RestitutionCase | undefined {
  return CASE_STUDIES[slug]
}

export function allCaseSlugs(): string[] {
  return Object.keys(CASE_STUDIES)
}
