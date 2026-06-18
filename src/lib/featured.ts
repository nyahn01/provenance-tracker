/**
 * Curated "featured journeys" — the demo's starting point.
 *
 * Rationale (see draft/INSIGHTS.md): we do NOT have worldwide, evenly-distributed
 * provenance. What we DO have is deep, dated, tier-A provenance for a set of famous
 * works whose journeys are genuinely interesting — mostly European masterpieces that
 * crossed the Atlantic to the Art Institute of Chicago. Leading with these shows the
 * product at its best and is honest: every one is verified to carry rich AIC
 * provenance_text + exhibition_history (lengths noted below at time of curation).
 *
 * These are not faked or special-cased data — they flow through the same
 * /api/provenance pipeline as any search. This list only chooses what to FEATURE.
 */

export interface FeaturedWork {
  source: 'aic' | 'rijks'
  id: string
  title: string
  artist: string
  /** One-line hook for the demo — the story the journey tells. */
  hook: string
}

export const FEATURED_WORKS: FeaturedWork[] = [
  {
    source: 'rijks', id: '200108369',
    title: 'The Milkmaid',
    artist: 'Johannes Vermeer',
    hook: 'Eleven Amsterdam owners across two centuries — provenance depth without leaving one city.',
  },
  {
    source: 'aic', id: '27992',
    title: 'A Sunday on La Grande Jatte',
    artist: 'Georges Seurat',
    hook: 'Paris → Brussels → Paris → Chicago — a Neo-Impressionist icon crosses the Atlantic.',
  },
  {
    source: 'aic', id: '28560',
    title: 'The Bedroom',
    artist: 'Vincent van Gogh',
    hook: 'Arles to Amsterdam, Paris, Berlin, New York and Chicago — eight cities of custody.',
  },
  {
    source: 'aic', id: '20684',
    title: 'Paris Street; Rainy Day',
    artist: 'Gustave Caillebotte',
    hook: 'A Parisian boulevard scene that moved through Berlin and Boston to Chicago.',
  },
  {
    source: 'aic', id: '16568',
    title: 'Water Lilies',
    artist: 'Claude Monet',
    hook: 'One of the deepest paper trails in the collection — Paris and Tokyo to Chicago.',
  },
  {
    source: 'aic', id: '28067',
    title: 'The Old Guitarist',
    artist: 'Pablo Picasso',
    hook: 'A Blue Period masterwork — Paris dealers to Chicago.',
  },
  {
    source: 'aic', id: '80607',
    title: 'Self-Portrait',
    artist: 'Vincent van Gogh',
    hook: 'Amsterdam, Berlin, Paris, London — a self-portrait’s well-documented descent.',
  },
  {
    source: 'aic', id: '64818',
    title: 'Stacks of Wheat (End of Summer)',
    artist: 'Claude Monet',
    hook: 'Monet’s series painting — Paris and Florence to Chicago.',
  },
  {
    source: 'aic', id: '111628',
    title: 'Nighthawks',
    artist: 'Edward Hopper',
    hook: 'An American icon whose exhibition history spans Paris, London, Madrid and Venice.',
  },
]
