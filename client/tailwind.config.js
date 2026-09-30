/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: '701px',
      lg: '1051px',
      wide: '1600px',
    },
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Noto Kufi Arabic', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        impact: ['Anton', 'Impact', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      colors: {
        main: '#f47a4b',
        canvas: '#090909',
        cream: '#f2f0e9',
        muted: '#999992',
        line: '#353531',
      },
      keyframes: {
        'hero-loop': {
          '0%': { translate: '0 calc(-50% - 6px)' },
          '100%': { translate: '0 0' },
        },
      },
      animation: {
        'hero-loop': 'hero-loop 24s linear infinite',
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
  },
  plugins: [],
}
