/**
 * Curated "provenance stories" — the demo's content.
 *
 * Curation rules (honest + legal):
 *  - Only works we have VERIFIED to carry deep, dated, tier-A provenance (AIC
 *    provenance_text + exhibition_history → real chains of custody).
 *  - Only works flagged PUBLIC DOMAIN by the museum, so we may display the image.
 *    (Picasso's Old Guitarist and Hopper's Nighthawks are excluded — still in
 *    copyright; their data is fine but their images are not ours to show.)
 *  - These flow through the same /api/provenance pipeline as any search; this list
 *    only chooses what to FEATURE and supplies a public-domain image id + credit.
 *
 * Image: built from AIC IIIF — https://www.artic.edu/iiif/2/<imageId>/full/<w>,/0/default.jpg
 */

export interface FeaturedWork {
  source: 'aic'
  id: string
  title: string
  artist: string
  year: string
  hook: string
  /** AIC IIIF image id (public-domain works only). */
  imageId: string
  credit: string
}

const AIC_CREDIT = 'The Art Institute of Chicago · Public domain'

export const FEATURED_WORKS: FeaturedWork[] = [
  {
    source: 'aic', id: '27992',
    title: 'A Sunday on La Grande Jatte',
    artist: 'Georges Seurat', year: '1884–86',
    hook: 'Paris → Brussels → Paris → Chicago — a Neo-Impressionist icon crosses the Atlantic.',
    imageId: '2d484387-2509-5e8e-2c43-22f9981972eb', credit: AIC_CREDIT,
  },
  {
    source: 'aic', id: '28560',
    title: 'The Bedroom',
    artist: 'Vincent van Gogh', year: '1889',
    hook: 'Five owners across Paris, Vienna, New York and Chicago, 1889–1926.',
    imageId: '6644829f-f292-c5c4-a73c-0356a6fdbf0d', credit: AIC_CREDIT,
  },
  {
    source: 'aic', id: '20684',
    title: 'Paris Street; Rainy Day',
    artist: 'Gustave Caillebotte', year: '1877',
    hook: 'A Parisian boulevard scene that moved through Berlin and Boston to Chicago.',
    imageId: 'f8fd76e9-c396-5678-36ed-6a348c904d27', credit: AIC_CREDIT,
  },
  {
    source: 'aic', id: '16568',
    title: 'Water Lilies',
    artist: 'Claude Monet', year: '1906',
    hook: 'One of the deepest paper trails in the collection — Paris to Chicago.',
    imageId: '3c27b499-af56-f0d5-93b5-a7f2f1ad5813', credit: AIC_CREDIT,
  },
  {
    source: 'aic', id: '80607',
    title: 'Self-Portrait',
    artist: 'Vincent van Gogh', year: '1887',
    hook: 'Amsterdam, Berlin, Paris, London — a self-portrait’s documented descent.',
    imageId: '47c5bcb8-62ef-e5d7-55e7-f5121f409a30', credit: AIC_CREDIT,
  },
  {
    source: 'aic', id: '64818',
    title: 'Stacks of Wheat (End of Summer)',
    artist: 'Claude Monet', year: '1890–91',
    hook: 'Monet’s series painting — Paris and Florence to Chicago.',
    imageId: 'a38e2828-ec6f-ece1-a30f-70243449197b', credit: AIC_CREDIT,
  },
]

export function aicImage(imageId: string, width = 600): string {
  return `https://www.artic.edu/iiif/2/${imageId}/full/${width},/0/default.jpg`
}
