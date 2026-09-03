/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E8F4F4',
          100: '#D1E8EA',
          200: '#A3D1D5',
          500: '#2A9D8F',
          600: '#1F7A70',
          700: '#16697A',
          800: '#0F4C5C',
          900: '#0B3A42',
        },
        accent: {
          500: '#E36414',
          600: '#C44E0A',
        },
        ink: {
          100: '#F3F6F8',
          200: '#E6EEF0',
          400: '#8A9AA8',
          500: '#5B6B7A',
          800: '#1C3345',
          900: '#12263A',
        },
      },
    },
  },
  plugins: [],
};
