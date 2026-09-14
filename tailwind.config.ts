import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#090908',
        surface: '#151512',
        'surface-2': '#1d1c18',
        gold: '#d0ad72',
        linen: '#f4efe6',
      },
      boxShadow: {
        glow: '0 24px 80px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        display: ['Iowan Old Style', 'Baskerville', 'Times New Roman', 'serif'],
        sans: ['Inter', 'Avenir Next', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
