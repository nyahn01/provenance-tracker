/**
 * German prose overlay for restitution case studies — text fields only.
 *
 * See RestitutionCaseTranslation (src/lib/types.ts): facts (dates, holders,
 * places, `kind`, citation labels/URLs) live ONLY in case-studies.ts and are
 * NEVER duplicated here — court/case names, statute names, and institution
 * names are kept verbatim as legal citations, not translated as prose.
 *
 * Missing a slug here is not an error: getCaseTranslated() falls back to the
 * English RestitutionCase honestly rather than breaking the page.
 */
import type { RestitutionCaseTranslation } from './types'

export const CASE_STUDIES_DE: Record<string, RestitutionCaseTranslation> = {
  'adele-bloch-bauer-i': {
    summary:
      'Eine der am besten dokumentierten Restitutionen aus der NS-Zeit. Klimts goldenes ' +
      'Porträt von Adele Bloch-Bauer wurde der Familie Bloch-Bauer nach dem „Anschluss“ 1938 ' +
      'entzogen, jahrzehntelang von der österreichischen Belvedere unter falscher Provenienz ' +
      'gezeigt und schließlich 2006 – nach einem Urteil des Obersten Gerichtshofs der USA und ' +
      'einem verbindlichen Schiedsverfahren in Österreich – an Adeles Nichte Maria Altmann ' +
      'zurückgegeben. Die folgende Kette trennt die rechtmäßige Besitzgeschichte von der Zeit ' +
      'der erzwungenen Kontrolle und kennzeichnet die Jahre der gefälschten Aufzeichnungen als ' +
      'das, was sie waren: eine Lücke.',
    currentStatusAsOf:
      'Im Besitz der Neue Galerie New York seit dem Erwerb 2006 (Stand: 2026).',
    custodyDetail: [
      'Klimt vollendete das Porträt (in Auftrag gegeben 1903). Es hing im Haus der Familie ' +
      'Bloch-Bauer in Wien. Ferdinand Bloch-Bauer, ein Zuckerindustrieller, war der ' +
      'rechtmäßige Eigentümer.',

      'Adele Bloch-Bauer starb im Januar 1925 an einer Hirnhautentzündung. Ihr Testament bat ' +
      'Ferdinand darum, nach seinem eigenen Tod die Klimt-Gemälde der Österreichischen ' +
      'Staatsgalerie zu vermachen – eine Bitte, keine Eigentumsübertragung. Die Gemälde ' +
      'blieben Ferdinands Eigentum. (Das genaue rechtliche Gewicht dieser Bitte war der Kern ' +
      'des späteren Rechtsstreits.)',

      'Nach dem „Anschluss“ floh Ferdinand aus Österreich. Deutsche Behörden beschlagnahmten ' +
      'sein Vermögen, seine Zuckerfabrik und seinen persönlichen Besitz, zu dem auch die ' +
      'Klimt-Gemälde gehörten. Dies war eine Beschlagnahmung unter Zwang, kein Verkauf und ' +
      'keine Schenkung.',

      'Ein von den Nationalsozialisten eingesetzter Verwalter löste die Sammlung auf: Einige ' +
      'Werke wurden verkauft, und das Porträt von Adele Bloch-Bauer I gelangte an die ' +
      'Österreichische Staatsgalerie (Belvedere). Die Provenienzunterlagen wurden gefälscht, ' +
      'um einen rechtmäßigen Erwerb vor dem Krieg vorzutäuschen.',

      'Ferdinand starb im November 1945 im Exil in Zürich. Sein Testament hinterließ sein ' +
      'Vermögen seinem Neffen Robert und seinen Nichten Luise und Maria (Altmann). Das ' +
      'rechtmäßige Eigentum an den Gemälden ging auf die Erben über – auch wenn die Werke ' +
      'selbst weiterhin physisch im Belvedere verblieben.',

      'Der Journalist Hubertus Czernin fand Archivdokumente, die zeigten, dass die Galerie ' +
      'wusste, dass sie NS-Raubkunst besaß. Österreich verabschiedete 1998 ein ' +
      'Kunstrückgabegesetz; 1999 wies der zuständige Beirat Maria Altmanns Anspruch dennoch ' +
      'unter Berufung auf Adeles Testament von 1925 zurück. Die Gemälde blieben im Belvedere.',

      'Im Verfahren Republic of Austria v. Altmann entschied der Oberste Gerichtshof der USA, ' +
      'dass der Foreign Sovereign Immunities Act auch auf Handlungen vor 1976 anwendbar sei, ' +
      'wodurch Altmann Österreich vor US-Gerichten verklagen konnte. Damit wurde das Gemälde ' +
      'noch nicht zugesprochen – das Urteil ebnete lediglich den Weg für eine Verhandlung in ' +
      'der Sache.',

      'Nachdem sich die Parteien 2005 auf ein verbindliches Schiedsverfahren in Österreich ' +
      'geeinigt hatten, entschied ein dreiköpfiges Schiedsgericht im Januar 2006, dass ' +
      'Österreich fünf Klimt-Gemälde – darunter dieses Porträt – an die Erben der Familie ' +
      'Bloch-Bauer zurückgeben muss. Das Eigentum wurde der Familie zurückübertragen.',

      'Im Juni 2006 wurde das Porträt für die Neue Galerie New York erworben, Berichten ' +
      'zufolge vermittelt durch Ronald S. Lauder für etwa 135 Millionen US-Dollar. Dies ist ' +
      'die heutige Verwahrerin des Gemäldes.',
    ],
    exhibitionDetail: [
      'Bevor sie in die Neue Galerie kamen, wurden die fünf restituierten Klimt-Gemälde im ' +
      'Frühjahr 2006 gemeinsam im LACMA gezeigt. Dies war eine vorübergehende Ausstellung von ' +
      'Werken, deren Eigentum bereits an die Erben zurückübertragen worden war – eine ' +
      'Ausstellung, keine Änderung des Besitzverhältnisses.',
    ],
    gapNote: [
      'Während der Kriegsjahre verwahrte das Belvedere das Gemälde unter einer gefälschten ' +
      'Provenienz, sodass die institutionelle Aufzeichnung für diesen Zeitraum kein ' +
      'rechtmäßiges Eigentum widerspiegelt. Wir kennzeichnen dies als Lücke in der ' +
      'rechtmäßigen Besitzgeschichte: Die dokumentierte Aufzeichnung war wissentlich falsch, ' +
      'und das rechtmäßige Eigentum verblieb durchgehend bei der Familie Bloch-Bauer.',
    ],
  },
}
