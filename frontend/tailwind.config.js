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
          primary: '#85B9AC', // Renamed from olive
          offwhite: '#fafafa'
        },
        brand: {
          dark: 'var(--brand-dark)',
          primary: 'var(--brand-tactical)', // Unified Premium Teal
          tactical: 'var(--brand-tactical)', // Aliased for consistency
          frost: '#ffffff',
          emerald: '#064e3b',
        },
        // ── Semantic theme tokens (driven by CSS variables) ──
        theme: {
          bg:         'var(--bg)',
          card:       'var(--bg-card)',
          field:      'var(--bg-field)',
          'bg-field': 'var(--bg-field)',
          text:       'var(--text)',
          muted:      'var(--text-2)',
          'text-muted': 'var(--text-2)',
          subtle:     'var(--text-3)',
          border:     'var(--border)',
          'border-2': 'var(--border-2)',
          brand:      'var(--brand)',
          // Legacy aliases kept for backwards-compat
          'bg-muted': 'var(--bg-card)',
        }
      },
      fontFamily: {
        sans:    ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        heading: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
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
