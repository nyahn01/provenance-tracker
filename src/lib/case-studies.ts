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

// ── Sources for the Portrait of Wally case ────────────────────────────────
const W = {
  wikipedia: {
    label: 'Wikipedia — Portrait of Wally',
    url: 'https://en.wikipedia.org/wiki/Portrait_of_Wally',
  },
  smarthistory: {
    label: 'Smarthistory — "Nazi looting: Egon Schiele\'s Portrait of Wally"',
    url: 'https://smarthistory.org/looting-schiele-wally/',
  },
  doj: {
    label: 'U.S. Attorney, S.D.N.Y. — Portrait of Wally settlement press release (2010)',
    url: 'https://www.justice.gov/archive/usao/nys/pressreleases/July10/portraitofwallysettlementpr.pdf',
  },
  artlaw: {
    label: 'Center for Art Law — "$19 million settlement frees Portrait of Wally"',
    url: 'https://itsartlaw.org/art-law/19-million-settlement-frees-portrait-of-wally-after-13-year-of-legal-disputes/',
  },
  leopold: {
    label: 'Leopold Museum — Egon Schiele, Portrait of Wally Neuzil (object page)',
    url: 'https://www.leopoldmuseum.org/en/collection/highlights/147',
  },
  wikidataWally: {
    label: 'Wikidata Q1555137 — Portrait of Wally',
    url: 'https://www.wikidata.org/wiki/Q1555137',
  },
} as const

const portraitOfWally: RestitutionCase = {
  slug: 'portrait-of-wally',
  title: 'Portrait of Wally',
  artist: 'Egon Schiele',
  created: '1912',
  medium: 'Oil on panel',
  currentStatusAsOf:
    'Held by the Leopold Museum, Vienna, since 1994 — with a 1998–2010 break in physical ' +
    'custody during U.S. federal litigation — displayed with mandatory disclosure signage ' +
    'per the 2010 settlement (as of 2026).',
  summary:
    'A 12-year U.S. federal case over a small Schiele portrait of his model and companion ' +
    'Wally Neuzil, seized from Jewish art dealer Lea Bondi Jaray during the 1938 Aryanization ' +
    'of Vienna, then mistakenly bundled with an unrelated collector’s estate after the war and ' +
    'never returned to her. Unlike the Bloch-Bauer Klimts, this case did not end with title ' +
    'returning to the family: the 2010 settlement left the painting in the Leopold Museum’s ' +
    'collection in exchange for compensation and a permanent, on-record disclosure of its true ' +
    'history — a different, and instructive, kind of resolution.',

  custody: [
    {
      date: '1912',
      holder: 'Egon Schiele (artist)',
      place: 'Vienna, Austria-Hungary',
      kind: 'custody',
      detail:
        'Schiele painted the portrait in 1912. Its subject was Walburga "Wally" Neuzil ' +
        '(1894–1917), his model and companion of the period, not an owner of the work.',
      sources: [W.wikipedia, W.leopold],
    },
    {
      date: '1912–1925 (exact transfer dates not documented in our sources)',
      holder: 'Emil Toepfer, then Richard Lanyi — private collectors, Vienna',
      place: 'Vienna, Austria',
      kind: 'custody',
      detail:
        'The painting passed through two documented private Viennese collectors before Lea ' +
        'Bondi Jaray acquired it. The sources available to us name both owners but do not give ' +
        'exact transfer dates between them — an honest limit of the record, not an invented one.',
      sources: [W.smarthistory, W.wikidataWally],
    },
    {
      date: 'by 1925',
      holder: 'Lea Bondi Jaray',
      place: 'Vienna, Austria',
      kind: 'custody',
      detail:
        'Bondi Jaray, a Jewish art dealer who owned the Galerie Würthle in Vienna, acquired the ' +
        'portrait for her personal collection — kept separate from her gallery’s stock — by 1925.',
      sources: [W.wikipedia, W.smarthistory],
    },
    {
      date: '1938',
      holder: 'Friedrich Welz (Aryanization)',
      place: 'Vienna, Austria (annexed)',
      kind: 'coerced',
      detail:
        'After the March 1938 Anschluss, Bondi Jaray was forced to surrender the Galerie ' +
        'Würthle to Nazi art dealer Friedrich Welz under the "Aryanization" program. The ' +
        'portrait, part of her personal collection rather than the gallery’s stock, was taken ' +
        'from her as part of the same coerced transfer; she fled to London in 1939.',
      sources: [W.wikipedia, W.smarthistory, W.artlaw],
    },
    {
      date: '1945',
      holder: 'U.S. military authorities (post-war Allied seizure)',
      place: 'Austria (Allied-occupied)',
      kind: 'custody',
      detail:
        'After WWII, occupying U.S. forces arrested Welz and seized artworks in his possession, ' +
        'including this one, as part of the broader Allied recovery of Nazi-looted property.',
      sources: [W.smarthistory, W.wikipedia],
    },
    {
      date: '1947–1950',
      holder: 'Austrian Bundesdenkmalamt (Federal Monuments Office)',
      place: 'Vienna, Austria',
      kind: 'custody',
      detail:
        'The painting was transferred to Austria’s own monuments office for post-war ' +
        'restitution processing, alongside other recovered Nazi-era artworks.',
      sources: [W.smarthistory],
    },
    {
      date: '1950–1954',
      holder: 'Heirs of Heinrich Rieger (mistakenly)',
      place: 'Vienna, Austria',
      kind: 'gap',
      detail:
        'A clerical error at the Bundesdenkmalamt bundled the portrait with an unrelated ' +
        'collection — that of the late Jewish collector Heinrich Rieger — and delivered it to his ' +
        'heirs, who had no legitimate claim to it. The Rieger heirs then sold works including ' +
        'this one to the Österreichische Galerie Belvedere. No legitimate title passed through ' +
        'this span; Bondi Jaray, the rightful owner, played no part in it.',
      sources: [W.smarthistory, W.wikipedia],
    },
    {
      date: '1954',
      holder: 'Rudolf Leopold (private collector)',
      place: 'Vienna, Austria',
      kind: 'custody',
      detail:
        'In 1953, Bondi Jaray — then living in London — asked Rudolf Leopold to help her ' +
        'recover the painting from the Belvedere. In September 1954, instead of returning it to ' +
        'her, Leopold acquired it for himself by trading another Schiele painting from his own ' +
        'collection to the Belvedere. No court has ruled on the validity of this 1954 exchange; ' +
        'it stands as a documented, disputed acquisition — not an established theft.',
      sources: [W.smarthistory, W.wikipedia, W.artlaw],
    },
    {
      date: '1994',
      holder: 'Leopold Museum, Vienna',
      place: 'Vienna, Austria',
      kind: 'custody',
      detail:
        'Rudolf Leopold sold his entire private collection, including this painting, to the ' +
        'newly founded Leopold Museum, a foundation backed substantially by the Austrian ' +
        'government; the museum opened to the public in 2001.',
      sources: [W.wikipedia, W.leopold],
    },
    {
      date: '1998–2010',
      holder: 'U.S. federal court custody (in rem) — Leopold Museum’s title contested throughout',
      place: 'New York, USA',
      kind: 'custody',
      detail:
        'Days after a 1997–98 MoMA loan closed, the Manhattan DA subpoenaed the painting on ' +
        'the Bondi Jaray heirs’ claim that it was Nazi loot. In September 1999 the New York ' +
        'Court of Appeals held the DA lacked state-law authority to hold it, so U.S. Customs ' +
        'immediately seized the painting instead under the National Stolen Property Act, opening ' +
        'the 12-year federal case United States v. Portrait of Wally. The painting was held in ' +
        'the U.S. throughout, unable to return to Vienna, while the underlying ownership dispute ' +
        'stayed unresolved.',
      sources: [W.wikipedia, W.smarthistory, W.doj],
    },
    {
      date: '2010',
      holder: 'Leopold Museum (title confirmed by settlement; no transfer of title)',
      place: 'Vienna, Austria',
      kind: 'custody',
      detail:
        'On July 20, 2010, days before a scheduled trial, the U.S. Government, the Estate of ' +
        'Lea Bondi Jaray, and the Leopold Museum settled: the museum paid the estate US$19 ' +
        'million and agreed to permanently display signage next to the painting, everywhere it ' +
        'is ever shown, disclosing its true Nazi-era history. Unlike the Bloch-Bauer Klimts, ' +
        'title was not returned to the original owner’s heirs — the settlement left the painting ' +
        'in the museum’s collection in exchange for compensation and a permanent, on-record ' +
        'disclosure obligation. That distinction matters: this was not a restitution-by-return.',
      sources: [W.doj, W.artlaw, W.wikipedia],
    },
  ],

  // Kept categorically separate from custody — a loan is not a move of title.
  exhibitions: [
    {
      date: '1997–1998',
      venue: 'Museum of Modern Art (MoMA), New York',
      detail:
        'The Leopold Museum lent this painting, with other Schiele works, to MoMA for an ' +
        'exhibition running October 1997 to January 1998. A New York Times article near the ' +
        'close of the show revealed the painting’s disputed Nazi-era history to a wide audience ' +
        '— the discovery that triggered the legal case above. This was a loan; custody and title ' +
        'did not change as a result of it.',
      sources: [W.wikipedia, W.smarthistory],
    },
  ],

  gaps: [
    {
      span: '1947–1954',
      note:
        'From the Bundesdenkmalamt’s post-war handling through Leopold’s 1954 acquisition, the ' +
        'painting was mistakenly administered as part of an unrelated collector’s estate (Heinrich ' +
        'Rieger) and then privately exchanged — at no point during this span does the record show ' +
        'legitimate title passing through Bondi Jaray, the rightful owner, or with her knowledge. ' +
        'We mark it as a gap in legitimate custody rather than implying any of these transfers ' +
        'settled ownership.',
      sources: [W.smarthistory, W.wikipedia],
    },
  ],

  references: [W.wikipedia, W.smarthistory, W.doj, W.artlaw, W.leopold, W.wikidataWally],
}

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
  [portraitOfWally.slug]: portraitOfWally,
}

export function getCase(slug: string): RestitutionCase | undefined {
  return CASE_STUDIES[slug]
}

export function allCaseSlugs(): string[] {
  return Object.keys(CASE_STUDIES)
}
