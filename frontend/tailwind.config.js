/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forged: {
          bg: '#0a0a0a',
          surface: '#141414',
          border: '#1e1e1e',
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