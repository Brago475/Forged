import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from './hooks/useTheme'
import { LoadingProvider } from './hooks/useLoading'
import App from './App'
import './styles/index.css'
import { getPaletteById, loadPaletteId, applyPalette } from './components/themes/palettes'

// Apply saved theme palette before first paint so the app loads in the right colors
applyPalette(getPaletteById(loadPaletteId()))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </ThemeProvider>
  </React.StrictMode>
)