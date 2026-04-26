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
        'ranna-teal': '#0D9488',
        'ranna-gold': '#c5a059',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Arabic', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        modern: ['Outfit', 'sans-serif'],
        soft: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
