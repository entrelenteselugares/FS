/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        photography: {
          charcoal: '#121212',
          slate: '#2a2a2a',
          olive: '#4b5320',
          offwhite: '#fafafa'
        },
        brand: {
          dark: '#050505',
          tactical: '#5D6532',
          frost: '#ffffff',
          emerald: '#064e3b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['"Barlow Condensed"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
