/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF9F8',
          100: '#D8F0EE',
          200: '#B0E1DC',
          300: '#7FCCC5',
          400: '#4FB3AA',
          500: '#2A9D8F',
          600: '#1F8177',
          700: '#16697A',
          800: '#0F4C5C',
          900: '#0B3A42',
          950: '#06242A',
        },
        accent: {
          50: '#FEF4EC',
          100: '#FCE3D0',
          200: '#F8C6A2',
          400: '#F0852F',
          500: '#E36414',
          600: '#BF4F09',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(11 58 66 / 0.04), 0 12px 32px -18px rgb(11 58 66 / 0.28)',
        float: '0 24px 64px -28px rgb(11 58 66 / 0.55)',
      },
      keyframes: {
        'fade-in': {
          from: {opacity: '0'},
          to: {opacity: '1'},
        },
        'slide-up': {
          from: {opacity: '0', transform: 'translateY(12px)'},
          to: {opacity: '1', transform: 'translateY(0)'},
        },
        'drawer-in': {
          from: {transform: 'translateX(100%)'},
          to: {transform: 'translateX(0)'},
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'slide-up': 'slide-up 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'drawer-in': 'drawer-in 0.26s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
