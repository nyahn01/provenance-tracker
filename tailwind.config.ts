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
        // Observatory (dark) tokens
        'obs-bg':          '#0a0908',
        'obs-surface':     '#131110',
        'obs-surface-2':   '#1c1a17',
        'obs-border':      '#2a2218',
        'obs-border-mid':  '#3d3228',
        'obs-text':        '#f6f1e8',
        'obs-text-muted':  '#9a8f85',
        'obs-text-faint':  '#5c5449',
        'obs-clay':        '#c87855',
        'obs-gold':        '#d4a853',
        'obs-sage':        '#6f8d7d',
        // Gallery (light) tokens
        'gal-bg':          '#f7f4ee',
        'gal-surface':     '#ffffff',
        'gal-surface-2':   '#ede9e2',
        'gal-border':      '#d8d2c8',
        'gal-border-mid':  '#b8afa3',
        'gal-text':        '#1a1714',
        'gal-text-muted':  '#6b6460',
        'gal-text-faint':  '#9e9790',
        'gal-clay':        '#b06840',
        'gal-sage':        '#4a6b5e',
        'gal-gold':        '#a07830',
        // Legacy aliases (kept for any existing code)
        bg:                '#0a0908',
        'globe-ocean':     '#111010',
        'globe-land':      '#1c1612',
        'globe-border':    '#2a2218',
        'accent-clay':     '#c87855',
        'accent-sage':     '#6f8d7d',
        'pin-glow':        '#d4a853',
        'text-warm':       '#f6f1e8',
        'text-muted':      '#9a8f85',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Pretendard', 'system-ui', 'sans-serif'],
        ui:      ['Pretendard', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero':    ['4.5rem',   { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display': ['2.25rem',  { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'heading': ['1.5rem',   { lineHeight: '1.2' }],
        'label':   ['0.65rem',  { lineHeight: '1.0', letterSpacing: '0.12em' }],
        'body':    ['0.875rem', { lineHeight: '1.6' }],
        'body-sm': ['0.8125rem',{ lineHeight: '1.5' }],
        'caption': ['0.6875rem',{ lineHeight: '1.4', letterSpacing: '0.02em' }],
      },
      transitionTimingFunction: {
        'gentle':    'cubic-bezier(0.4,0,0.2,1)',
        'panel':     'cubic-bezier(0.25,0.1,0,1)',
        'cinematic': 'cubic-bezier(0.16,1,0.3,1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
    },
  },
  plugins: [],
}
export default config
