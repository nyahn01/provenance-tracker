/**
 * /robots.txt — App Router metadata route.
 * API routes are server-side proxies for rate-limited upstream APIs; keep
 * crawlers off them.
 */

import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
