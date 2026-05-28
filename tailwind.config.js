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
      animation: {
        'brand-glow': 'brandGlow 6s ease-in-out infinite',
      },
      keyframes: {
        brandGlow: {
          '0%, 100%': {
            textShadow: '0 0 0px rgba(255, 255, 255, 0)',
            filter: 'brightness(1)',
          },
          '50%': {
            textShadow: '0 0 12px rgba(255, 255, 255, 0.35), 0 0 30px rgba(255, 255, 255, 0.12)',
            filter: 'brightness(1.3)',
          },
        },
      },
    },
  },
  plugins: [],
}
