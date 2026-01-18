import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'oklch(0.96 0.015 85)',
        foreground: 'oklch(0.28 0.05 250)',
        primary: {
          DEFAULT: 'oklch(0.28 0.05 250)',
          foreground: 'oklch(1 0 0)',
        },
        accent: {
          DEFAULT: 'oklch(0.72 0.15 75)',
          foreground: 'oklch(0.25 0.05 250)',
        },
        muted: {
          DEFAULT: 'oklch(0.82 0.01 250)',
          foreground: 'oklch(0.45 0.02 250)',
        },
        card: {
          DEFAULT: 'oklch(0.98 0.01 85)',
          foreground: 'oklch(0.28 0.05 250)',
        },
        border: 'oklch(0.85 0.02 85)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config