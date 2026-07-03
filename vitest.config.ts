import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Unit tests for the pure data layer (geocoder, loan extraction, the curate
// pipeline's reconcile/conflict functions) plus server-rendered insight charts.
// Node environment, no network — these must run in CI without an API key
// (see .github/workflows/honesty-gate.yml). The `@/` alias mirrors tsconfig so
// components that import via `@/lib/...` render under renderToStaticMarkup.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx,mjs}'],
    environment: 'node',
  },
})
