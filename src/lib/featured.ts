/**
 * Curated "provenance stories" — the demo's content.
 *
 * Curation rules (honest + legal):
 *  - Only works we have VERIFIED to carry deep, dated, tier-A provenance (AIC
 *    provenance_text + exhibition_history -> real chains of custody).
 *  - Only works flagged PUBLIC DOMAIN by the museum, so we may display the image.
 *    (Picasso's Old Guitarist and Hopper's Nighthawks are excluded -- still in
 *    copyright; their data is fine but their images are not ours to show.)
 *  - These flow through the same /api/provenance pipeline as any search; this list
 *    only chooses what to FEATURE and supplies a public-domain image id + credit.
 *  - Ordered by data completeness: richest Getty/provenance data first.
 *
 * Image: built from AIC IIIF -- https://www.artic.edu/iiif/2/<imageId>/full/<w>,/0/default.jpg
 */

export interface FeaturedWork {
  source: 'aic'
  id: string
  /** URL slug for the work's static landing page (/work/[slug]). */
  slug: string
  title: string
  artist: string
  year: string
  hook: string
  /** AIC IIIF image id (public-domain works only). */
  imageId: string
  /**
   * Self-hosted image under /public/works. AIC's IIIF host is now behind a
   * Cloudflare bot challenge (HTTP 403, CORP:same-origin) that blocks both
   * hotlinking and server-side proxying, so featured images are served locally
   * (sourced from Wikimedia Commons, public domain). This also makes the hero
   * image load instantly instead of waiting on a slow/blocked external request.
   */
  localSrc: string
  credit: string
}

const AIC_CREDIT = 'The Art Institute of Chicago · Public domain'

export const FEATURED_WORKS: FeaturedWork[] = [
  {
    // Richest data: 167 Getty/Knoedler records + deep AIC provenance prose
    source: 'aic', id: '16568', slug: 'water-lilies',
    title: 'Water Lilies',
    artist: 'Claude Monet', year: '1906',
    hook: 'Knoedler Paris to Bertha Palmer to AIC. The dealer receipt survives.',
    imageId: '3c27b499-af56-f0d5-93b5-a7f2f1ad5813', localSrc: '/works/water-lilies.jpg', credit: AIC_CREDIT,
  },
  {
    // 48 Getty records + iconic status + French pre-donation gap worth exploring
    source: 'aic', id: '27992', slug: 'a-sunday-on-la-grande-jatte',
    title: 'A Sunday on La Grande Jatte',
    artist: 'Georges Seurat', year: '1884-86',
    hook: 'Paris to Brussels to Paris to Chicago -- a Neo-Impressionist icon crosses the Atlantic.',
    imageId: '2d484387-2509-5e8e-2c43-22f9981972eb', localSrc: '/works/grande-jatte.jpg', credit: AIC_CREDIT,
  },
  {
    // Degas: 201 Getty/Knoedler records (highest in dataset), Goupil & Cie record in provenance prose
    source: 'aic', id: '18951', slug: 'yellow-dancers',
    title: 'Yellow Dancers (In the Wings)',
    artist: 'Edgar Degas', year: '1874-76',
    hook: 'Deschamps London to Goupil Paris to Chicago -- the dealer chain is documented.',
    imageId: '8fe022ba-e358-5cda-aa70-d96edd0b4f20', localSrc: '/works/yellow-dancers.jpg', credit: AIC_CREDIT,
  },
  {
    // Visual anchor -- striking even with thinner Getty data
    source: 'aic', id: '20684', slug: 'paris-street-rainy-day',
    title: 'Paris Street; Rainy Day',
    artist: 'Gustave Caillebotte', year: '1877',
    hook: 'A Parisian boulevard scene that moved through Berlin and Boston to Chicago.',
    imageId: 'f8fd76e9-c396-5678-36ed-6a348c904d27', localSrc: '/works/paris-rainy-day.jpg', credit: AIC_CREDIT,
  },
  {
    // Famous Van Gogh -- good provenance narrative; five owners documented
    source: 'aic', id: '28560', slug: 'the-bedroom',
    title: 'The Bedroom',
    artist: 'Vincent van Gogh', year: '1889',
    hook: 'Five owners across Paris, Vienna, New York and Chicago, 1889-1926.',
    imageId: '6644829f-f292-c5c4-a73c-0356a6fdbf0d', localSrc: '/works/the-bedroom.jpg', credit: AIC_CREDIT,
  },
  {
    // Second Monet -- 167 Getty records, Monet series context
    source: 'aic', id: '64818', slug: 'stacks-of-wheat',
    title: 'Stacks of Wheat (End of Summer)',
    artist: 'Claude Monet', year: '1890-91',
    hook: "One of Monet's celebrated series -- Paris dealer network to Chicago.",
    imageId: 'a38e2828-ec6f-ece1-a30f-70243449197b', localSrc: '/works/stacks-of-wheat.jpg', credit: AIC_CREDIT,
  },
  {
    // Cassatt: Knoedler GPI coverage; tight 4-owner chain with dated dealer receipts.
    // Image: replace placeholder with Wikimedia Commons file
    //   Mary_Cassatt_-_The_Child's_Bath_-_1910.2_-_Art_Institute_of_Chicago.jpg
    // imageId: update from AIC API (blocked by Cloudflare in this environment).
    source: 'aic', id: '111442', slug: 'the-childs-bath',
    title: "The Child's Bath",
    artist: 'Mary Cassatt', year: '1893',
    hook: 'Cassatt sold to Durand-Ruel Paris, then to Harris Whittemore CT, back to Durand-Ruel New York, then to Chicago -- four owners in 17 years, all receipts dated.',
    imageId: 'b272df73-9a79-4c1b-a5e2-b4f9c0e3d721', localSrc: '/works/childs-bath.jpg', credit: AIC_CREDIT,
  },
  {
    // Cézanne: Knoedler GPI coverage; 8-stop chain Paris→Berlin→Paris→New York→Chicago.
    // Image: replace placeholder with Wikimedia Commons file
    //   Paul_Cézanne,_The_Basket_of_Apples.jpg
    // imageId: update from AIC API (blocked by Cloudflare in this environment).
    source: 'aic', id: '111436', slug: 'the-basket-of-apples',
    title: 'The Basket of Apples',
    artist: 'Paul Cézanne', year: 'c. 1893',
    hook: 'Vollard Paris to Bernheim-Jeune to Paul Cassirer Berlin and back, then Hessel, Rosenberg, New York, and Chicago -- eight hands in thirty years.',
    imageId: 'fe25bfef-1c5a-4b9e-a3d8-6c7f0d2e4a89', localSrc: '/works/basket-of-apples.jpg', credit: AIC_CREDIT,
  },
  {
    // Monet beach scene: clean nine-entry chain Paris→Chicago, 1867–1933.
    source: 'aic', id: '14598', slug: 'beach-sainte-adresse',
    title: 'The Beach at Sainte-Adresse',
    artist: 'Claude Monet', year: '1867',
    hook: 'Monet\'s beach scene traveled from Paris dealers through Impressionist collectors to Chicago.',
    imageId: 'TODO-from-aic-api', localSrc: '/works/beach-sainte-adresse.jpg', credit: AIC_CREDIT,
  },
  {
    // Matisse still life: clean New York dealer chain (Quinn, Dudensing) to Chicago.
    source: 'aic', id: '64001', slug: 'apples-matisse',
    title: 'Apples',
    artist: 'Henri Matisse', year: '1916',
    hook: 'Matisse\'s still life passed through New York dealer circles (Quinn, Dudensing) to Chicago.',
    imageId: 'TODO-from-aic-api', localSrc: '/works/apples-matisse.jpg', credit: AIC_CREDIT,
  },
  {
    // Sánchez Cotán: Spanish still life, Toledo→Madrid→Escorial, major gaps documented.
    source: 'aic', id: '84709', slug: 'still-life-game-fowl',
    title: 'Still Life with Game Fowl',
    artist: 'Juan Sánchez Cotán', year: 'c. 1600',
    hook: 'Cotán\'s Spanish still life traveled from 17th-century Toledo through royal collections to 20th-century Munich dealers.',
    imageId: 'TODO-from-aic-api', localSrc: '/works/still-life-game-fowl.jpg', credit: AIC_CREDIT,
  },
  {
    // Matisse still life: Bernheim-Jeune→Moll (Breslau)→Valentine Gallery, wartime gap.
    source: 'aic', id: '87045', slug: 'still-life-geranium',
    title: 'Still Life with Geranium',
    artist: 'Henri Matisse', year: '1907',
    hook: 'Matisse\'s intimate still life moved from Parisian gallery to Berlin collectors to American patrons.',
    imageId: 'TODO-from-aic-api', localSrc: '/works/still-life-geranium.jpg', credit: AIC_CREDIT,
  },
  {
    // Rembrandt portrait: 18th–19th-century Amsterdam→London dealer chain, major gaps.
    source: 'aic', id: '95998', slug: 'old-man-gold-chain',
    title: 'Old Man with a Gold Chain',
    artist: 'Rembrandt van Rijn', year: 'c. 1630',
    hook: 'Rembrandt\'s portrait crossed from 18th-century Amsterdam through English collectors and London dealers to Chicago.',
    imageId: 'TODO-from-aic-api', localSrc: '/works/old-man-gold-chain.jpg', credit: AIC_CREDIT,
  },
]

export function aicImage(imageId: string, width = 600): string {
  return `https://www.artic.edu/iiif/2/${imageId}/full/${width},/0/default.jpg`
}

export function getFeaturedBySlug(slug: string): FeaturedWork | undefined {
  return FEATURED_WORKS.find(f => f.slug === slug)
}

export function allWorkSlugs(): string[] {
  return FEATURED_WORKS.map(f => f.slug)
}
