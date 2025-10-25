/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter var"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        midnight: {
          900: '#0b1220',
          800: '#111a2d',
          700: '#1a243a',
        },
      },
    },
  },
  plugins: [],
}
