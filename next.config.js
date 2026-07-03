/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // /demo, /team, /workflow merged into one /about colophon — see issue #141.
    // /demo/source is untouched (exact-match source, no wildcard).
    // /pipeline renamed to /method (the credibility act) — see issue #143.
    // /pricing replaced by the honest /support page — see issue #61.
    return [
      { source: '/demo', destination: '/about', permanent: true },
      { source: '/team', destination: '/about', permanent: true },
      { source: '/workflow', destination: '/about', permanent: true },
      { source: '/pipeline', destination: '/method', permanent: true },
      { source: '/pricing', destination: '/support', permanent: true },
    ]
  },
  async headers() {
    // /embed/* is designed to be iframed into someone else's page (issue
    // #151), so it's excluded from the global X-Frame-Options: SAMEORIGIN —
    // it gets its own block below with every OTHER security header intact.
    // The exclusion regex must come before the catch-all so each path
    // matches exactly one of the two blocks (Next.js merges headers from
    // every matching source, so two matching blocks that disagree on one key
    // would NOT reliably resolve to "last one wins").
    const commonHeaders = [
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
    ]
    return [
      {
        source: '/embed/:path*',
        headers: commonHeaders,
      },
      {
        source: '/((?!embed).*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }, ...commonHeaders],
      },
    ]
  },
}

export default nextConfig
