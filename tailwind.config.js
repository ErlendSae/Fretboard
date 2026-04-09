/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'Space Grotesk Fallback', 'system-ui', 'sans-serif'],
      },
      colors: {
        neck: {
          wood: '#8B6914',
          dark: '#5C4A1E',
          fret: '#C0A060',
        },
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        countPop: {
          '0%': { opacity: '0', transform: 'scale(1.4)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        micPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.08)' },
        },
        barBounce: {
          '0%, 100%': { transform: 'scaleY(0.2)' },
          '50%':       { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.2s ease-out both',
        // Fixed: was cubic-bezier(0.34,1.56,0.64,1) which overshoots (spring/bounce) — replaced with expo-out
        'count-pop':  'countPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'mic-pulse':  'micPulse 1.8s ease-in-out infinite',
        // Duration overridden per-element via --beat-dur CSS custom property
        'bar-bounce': 'barBounce var(--beat-dur, 706ms) ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
