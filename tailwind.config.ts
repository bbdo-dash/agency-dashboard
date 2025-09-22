import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
      },
      screens: {
        // Large-display breakpoints for TVs and big dashboards
        'tv': '1920px',   // 1080p
        '2k': '2560px',   // QHD/WQHD
        '4k': '3840px',   // UHD
      },
    },
  },
  plugins: [],
}

export default config 