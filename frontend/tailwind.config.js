/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forged: {
          red: '#e74c3c',
          blue: '#3498db',
          green: '#2ecc71',
          gold: '#f39c12',
          purple: '#9b59b6',
        }
      }
    },
  },
  plugins: [],
}