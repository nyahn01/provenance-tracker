import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0908',
        'globe-ocean': '#111010',
        'globe-land': '#1c1612',
        'globe-border': '#2a2218',
        'accent-clay': '#c87855',
        'accent-sage': '#6f8d7d',
        'pin-glow': '#d4a853',
        'text-warm': '#f6f1e8',
        'text-muted': '#9a8f85',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
