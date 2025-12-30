/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gvtc: {
          primary: '#005a9c',
          secondary: '#00a651',
          accent: '#f7941d',
          dark: '#1a1a2e',
          light: '#f8fafc'
        }
      }
    },
  },
  plugins: [],
}
