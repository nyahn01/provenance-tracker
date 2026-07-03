/**
 * /sitemap.xml — App Router metadata route.
 *
 * Enumerates every crawlable page: the static marketing pages plus the
 * dynamic content routes (/case/[slug], /work/[slug]) generated from their
 * single sources of truth (case-studies.ts, featured.ts). Add new content
 * types here when they gain a public route.
 */

import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { allCaseSlugs } from '@/lib/case-studies'
import { allWorkSlugs } from '@/lib/featured'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['', '/learn', '/method', '/insights', '/about', '/support', '/feedback', '/impressum', '/demo/source']

  return [
    ...staticPaths.map(p => ({
      url: `${SITE_URL}${p}`,
      changeFrequency: 'monthly' as const,
      priority: p === '' ? 1 : 0.5,
    })),
    ...allWorkSlugs().map(slug => ({
      url: `${SITE_URL}/work/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...allCaseSlugs().map(slug => ({
      url: `${SITE_URL}/case/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
