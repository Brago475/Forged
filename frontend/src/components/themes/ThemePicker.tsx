import { useState } from 'react'
import {
  PALETTES,
  loadPaletteId,
  savePaletteId,
  applyPalette,
  getPaletteById,
  type ThemePalette,
} from './palettes'

/**
 * Named-row theme picker. Each palette shows as a row with
 * two circles (primary + accent), the palette name, and a
 * checkmark if active. Tapping applies instantly and persists.
 *
 * Layout: no card wrapper, spacing-only hierarchy per FORGE UI.
 */
export function ThemePicker() {
  const [activeId, setActiveId] = useState<string>(loadPaletteId())

  const pick = (palette: ThemePalette) => {
    setActiveId(palette.id)
    savePaletteId(palette.id)
    applyPalette(palette)
  }

  const active = getPaletteById(activeId)

  return (
    <div>
      <p className="text-[10px] font-black text-forged-text2 uppercase tracking-widest mb-1">
        Theme color
      </p>
      <p className="text-[11px] text-forged-text2 mb-3 leading-relaxed">
        Pick a palette. Applies instantly.
      </p>

      <div className="flex flex-col gap-0.5">
        {PALETTES.map(p => {
          const isActive = p.id === activeId
          return (
            <button
              key={p.id}
              onClick={() => pick(p)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all text-left active:scale-[0.99]
                ${isActive
                  ? 'bg-forged-bg'
                  : 'hover:bg-forged-bg/60'}`}
            >
              {/* Pair of circles: primary + accent */}
              <div className="flex items-center flex-shrink-0">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: p.primary }}
                />
                <div
                  className="w-4 h-4 rounded-full -ml-1"
                  style={{ backgroundColor: p.accent }}
                />
              </div>

              {/* Name */}
              <span className={`flex-1 text-sm
                ${isActive
                  ? 'text-forged-text font-black'
                  : 'text-forged-text2 font-bold'}`}>
                {p.name}
              </span>

              {/* Active indicator */}
              {isActive && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={p.accent} strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-forged-border">
        <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest">
          Active
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-forged-text">{active.name}</span>
          <div className="flex items-center">
            <div className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: active.primary }} />
            <div className="w-3 h-3 rounded-full -ml-1"
              style={{ backgroundColor: active.accent }} />
          </div>
        </div>
      </div>
    </div>
  )
}