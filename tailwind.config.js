/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#080B14',
        panel: '#0E1320',
        panel2: '#141B2D',
        stroke: '#1F2A40',
        'text-hi': '#EAF2FF',
        'text-mid': '#93A4C8',
        'text-dim': '#56688F',
        cyan: '#2DE2E6',
        violet: '#8B5CF6',
        magenta: '#F637EC',
        good: '#34E5A1',
        warn: '#FFC857',
        bad: '#FF4D6D',
      },
      boxShadow: {
        glow: '0 0 24px rgba(45,226,230,0.35)',
        glowViolet: '0 0 24px rgba(139,92,246,0.35)',
        glowBad: '0 0 24px rgba(255,77,109,0.45)',
      },
      fontFamily: {
        display: ['Orbitron', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pulseRing: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(255,77,109,0.5)' },
          '50%': { boxShadow: '0 0 0 10px rgba(255,77,109,0)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 2s ease-out infinite',
        floaty: 'floaty 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
