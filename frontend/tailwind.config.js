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
          red: 'var(--accent-red)',
          blue: 'var(--accent-blue)',
          green: 'var(--accent-green)',
          gold: 'var(--accent-gold)',
          purple: 'var(--accent-purple)',
        }
      }
    },
  },
  plugins: [],
}