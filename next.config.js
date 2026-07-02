/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // /demo, /team, /workflow merged into one /about colophon — see issue #141.
    // /demo/source is untouched (exact-match source, no wildcard).
    // /pipeline renamed to /method (the credibility act) — see issue #143.
    return [
      { source: '/demo', destination: '/about', permanent: true },
      { source: '/team', destination: '/about', permanent: true },
      { source: '/workflow', destination: '/about', permanent: true },
      { source: '/pipeline', destination: '/method', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Note: Content-Security-Policy is intentionally omitted.
          // Globe.gl WebGL requires 'unsafe-eval' in script-src, which defeats
          // CSP's XSS protection. A CSP with that exception provides false assurance.
        ],
      },
    ]
  },
}

export default nextConfig
