/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forged: {
          bg: 'var(--bg)',
          surface: 'var(--bg-surface)',
          surface2: 'var(--bg-surface2)',
          surface3: 'var(--bg-surface3)',
          border: 'var(--border)',
          text: 'var(--text)',
          text2: 'var(--text2)',
          text3: 'var(--text3)',
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