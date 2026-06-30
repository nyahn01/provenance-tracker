import { defineConfig } from 'vitest/config'

// Unit tests for the pure data layer (geocoder, loan extraction, the curate
// pipeline's reconcile/conflict functions). Node environment, no network — these
// must run in CI without an API key (see .github/workflows/honesty-gate.yml).
export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,mjs}'],
    environment: 'node',
  },
})
