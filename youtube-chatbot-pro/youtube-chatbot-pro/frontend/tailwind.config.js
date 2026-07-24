/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e94560',
        dark: {
          900: '#0f0c29',
          800: '#1a1a2e',
          700: '#16213e',
          600: '#0f3460',
        }
      }
    },
  },
  plugins: [],
}
