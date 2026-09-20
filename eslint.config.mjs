// ESLint flat config. `next lint` was removed in Next 16 (the CLI now parses
// "lint" as a directory argument and fails with "Invalid project directory"),
// so `npm run lint` runs eslint directly against this config instead.
import nextPlugin from 'eslint-config-next'

const config = [
  ...nextPlugin,
  {
    ignores: ['presentation/**', 'vault/**', '.obsidian/**'],
  },
]

export default config
