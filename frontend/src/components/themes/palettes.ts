export interface ThemePalette {
  id: string
  name: string
  primary: string   // --accent-purple replacement
  accent: string    // --accent-gold replacement
}

/**
 * 15 theme palettes. Each swaps the primary (purple) and accent (gold)
 * while keeping backgrounds, surfaces, and text tokens consistent.
 *
 * To add a new palette: pick a pair that reads clearly on both
 * #FAFAF8 (light bg) and #09090B (dark bg). Keep primary darker for
 * readable button text in white; accent slightly lighter for highlight.
 */
export const PALETTES: ThemePalette[] = [
  { id: 'indigo-gold', name: 'Indigo Gold', primary: '#6D28D9', accent: '#D4A853' },
  { id: 'forest',      name: 'Forest',      primary: '#0F6E56', accent: '#97C459' },
  { id: 'ember',       name: 'Ember',       primary: '#D85A30', accent: '#EF9F27' },
  { id: 'ocean',       name: 'Ocean',       primary: '#185FA5', accent: '#85B7EB' },
  { id: 'rose',        name: 'Rose',        primary: '#D4537E', accent: '#F4C0D1' },
  { id: 'midnight',    name: 'Midnight',    primary: '#1F2937', accent: '#60A5FA' },
  { id: 'crimson',     name: 'Crimson',     primary: '#A32D2D', accent: '#F4C5A1' },
  { id: 'sage',        name: 'Sage',        primary: '#3B6D11', accent: '#D4A853' },
  { id: 'sunset',      name: 'Sunset',      primary: '#993C1D', accent: '#EF9F27' },
  { id: 'arctic',      name: 'Arctic',      primary: '#0C447C', accent: '#B5D4F4' },
  { id: 'plum',        name: 'Plum',        primary: '#3C3489', accent: '#AFA9EC' },
  { id: 'amber',       name: 'Amber',       primary: '#854F0B', accent: '#FAC775' },
  { id: 'moss',        name: 'Moss',        primary: '#27500A', accent: '#C0DD97' },
  { id: 'ruby',        name: 'Ruby',        primary: '#791F1F', accent: '#F7C1C1' },
  { id: 'monochrome',  name: 'Monochrome',  primary: '#444441', accent: '#888780' },
]

export const DEFAULT_PALETTE_ID = 'indigo-gold'
export const PALETTE_STORAGE_KEY = 'forged_palette_id'

export function getPaletteById(id: string): ThemePalette {
  return PALETTES.find(p => p.id === id) ?? PALETTES[0]
}

export function loadPaletteId(): string {
  try {
    return localStorage.getItem(PALETTE_STORAGE_KEY) || DEFAULT_PALETTE_ID
  } catch {
    return DEFAULT_PALETTE_ID
  }
}

export function savePaletteId(id: string): void {
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, id)
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Apply a palette's colors as CSS custom properties on the document root.
 * Call this on app load and whenever the user picks a new palette.
 */
export function applyPalette(palette: ThemePalette): void {
  const root = document.documentElement
  root.style.setProperty('--accent-purple', palette.primary)
  root.style.setProperty('--accent-gold', palette.accent)
}