import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://forged-api:5000',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})