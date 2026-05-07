/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Space Grotesk', 'Space Grotesk Fallback', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      colors: {
        // ── Warm walnut surfaces + parchment ink (replaces cool stone) ─────────
        stone: {
          50:  '#fdf4ec',
          100: '#fbe8dd',
          200: '#f5ead6',  // --ink-cream   primary text
          300: '#e8d9bf',  // --ink-paper   body
          400: '#b8a48a',  // --ink-dust    secondary
          500: '#8a7560',  // --ink-faint   labels
          600: '#5d4a3a',  // --ink-whisper decoration
          700: '#33221f',  // --surface-cocoa  raised
          800: '#261917',  // --surface-walnut cards
          900: '#1a1110',  // --surface-pitch  page bg
          950: '#130e0d',
        },
        // ── Terracotta (primary accent — design token: terra) ─────────────────
        terra: {
          50:  '#fbe8dd',
          100: '#f7d4bc',
          200: '#f0b89a',  // --terra-200   scale tone / peach
          300: '#e8a07a',
          400: '#e08866',  // --terra-400   hover
          500: '#cf6a44',  // --terra-500   PRIMARY CTA
          600: '#b3522e',  // --terra-600   active
          700: '#8a3c1f',  // --terra-700
          800: '#6b2a14',
          900: '#4a1f0e',  // --terra-900
          950: '#2a1008',
        },
        // ── Sage (positive / correct — design token: sage) ────────────────────
        sage: {
          50:  '#f5f9f2',
          100: '#edf2e8',
          200: '#d4e2c6',
          300: '#b8c9a6',  // --sage-300
          400: '#96b080',
          500: '#7a9665',  // --sage-500    quiz correct
          600: '#5e7a4a',
          700: '#3d4f30',  // --sage-700
          800: '#2a3a20',
          900: '#1a2814',
          950: '#0d1a0a',
        },
        // ── Brick (negative / wrong — design token: brick) ────────────────────
        brick: {
          50:  '#fdf4f2',
          100: '#f5e8e4',
          200: '#ead0c8',
          300: '#d99a8a',  // --brick-300
          400: '#c8786a',
          500: '#b65441',  // --brick-500   quiz wrong
          600: '#943826',
          700: '#6b2818',  // --brick-700
          800: '#4d1e12',
          900: '#2e1009',
          950: '#1a0807',
        },
        // ── Plum (chord tone — design token: plum) ────────────────────────────
        plum: {
          50:  '#fdf4f8',
          100: '#f7eaf0',
          200: '#edd0df',
          300: '#d4a5b8',  // --plum-300    chord tone
          400: '#c090aa',
          500: '#9a5d76',  // --plum-500
          600: '#7a3d56',
          700: '#5c2840',
          800: '#421a2e',
          900: '#2a0d1c',
          950: '#1a0811',
        },
        // ── Honey gold (secondary accent — design token: sun) ─────────────────
        sun: {
          200: '#f4d8a3',
          400: '#e8b15c',  // --sun-400
          500: '#d99435',  // --sun-500
          700: '#8a5a18',
          900: '#4a2f0a',
        },
        // ── Ember (target note marker — design token: ember) ──────────────────
        ember: {
          200: '#fad0c0',
          300: '#f7a890',  // --ember-300
          400: '#e87959',  // --ember-500   target note
          500: '#e87959',
          600: '#d35e3e',
        },
        // neck colors (unchanged)
        neck: {
          wood: '#8B6914',
          dark: '#5C4A1E',
          fret: '#C0A060',
        },
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        countPop: {
          '0%':   { opacity: '0', transform: 'scale(1.4)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        micPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.08)' },
        },
        barBounce: {
          '0%, 100%': { transform: 'scaleY(0.2)' },
          '50%':      { transform: 'scaleY(1)' },
        },
        pulseTerra: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(207, 106, 68, 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(207, 106, 68, 0)' },
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.2s ease-out both',
        'count-pop':  'countPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'mic-pulse':  'micPulse 1.8s ease-in-out infinite',
        'bar-bounce': 'barBounce var(--beat-dur, 706ms) ease-in-out infinite',
        'pulse-terra': 'pulseTerra 2s ease-in-out infinite',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-hide::-webkit-scrollbar': {
          display: 'none',
        },
      })
    },
  ],
}
