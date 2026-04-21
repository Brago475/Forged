import { useState } from 'react'
import {
  PALETTES,
  loadPaletteId,
  savePaletteId,
  applyPalette,
  getPaletteById,
  type ThemePalette,
} from '../themes/palettes'

/**
 * Swatch grid that lets the user pick 1 of 15 theme palettes.
 * Tapping a swatch applies the palette immediately and persists
 * the selection via localStorage. Active palette shows a gold ring.
 */
export function ThemePicker() {
  const [activeId, setActiveId] = useState<string>(loadPaletteId())

  const pick = (palette: ThemePalette) => {
    setActiveId(palette.id)
    savePaletteId(palette.id)
    applyPalette(palette)
  }

  return (
    <div>
      <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
        Theme color
      </p>
      <p className="text-[11px] text-forged-text2 mb-3 leading-relaxed">
        Pick a palette. Applies instantly across the app.
      </p>
      <div className="grid grid-cols-5 gap-2">
        {PALETTES.map(p => {
          const isActive = p.id === activeId
          return (
            <button
              key={p.id}
              onClick={() => pick(p)}
              title={p.name}
              className={`relative aspect-square rounded-xl overflow-hidden transition-all
                active:scale-95 hover:brightness-110
                ${isActive ? 'ring-2 ring-offset-2 ring-offset-forged-surface' : ''}`}
              style={{
                backgroundColor: p.primary,
                ['--tw-ring-color' as any]: p.accent,
              }}
            >
              {/* Accent dot in bottom-right shows the paired secondary color */}
              <span
                className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: p.accent }}
              />
              {isActive && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-forged-text2 mt-3 text-center">
        Active: <span className="text-forged-text font-black">{getPaletteById(activeId).name}</span>
      </p>
    </div>
  )
}