/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        photography: {
          charcoal: '#121212',
          slate: '#2a2a2a',
          olive: '#85B9AC',
          offwhite: '#fafafa'
        },
        brand: {
          dark: '#050505',
          primary: 'var(--brand-primary)',
          tactical: 'var(--brand-tactical)',
          olive: '#85B9AC', // Unified Brand Color
          frost: '#ffffff',
          emerald: '#064e3b',
        },
        // ── Semantic theme tokens (driven by CSS variables) ──
        theme: {
          bg:         'var(--theme-bg)',
          'bg-muted': 'var(--theme-bg-muted)',
          text:       'var(--theme-text)',
          muted:      'var(--theme-text-muted)',
          border:     'var(--theme-border)',
        }
      },
      fontFamily: {
        sans:    ['Outfit', 'sans-serif'],
        serif:   ['Outfit', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
