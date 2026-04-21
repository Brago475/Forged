import { useRef, useState } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import {
  PALETTES,
  loadPaletteId,
  savePaletteId,
  applyPalette,
  getPaletteById,
  type ThemePalette,
} from './palettes'

/**
 * Theme palette picker as an inline accordion. Trigger shows
 * the current palette (half-moon swatch + name); tapping expands
 * the list of all 15 palettes, pushing the surrounding content
 * down. Tapping a row applies instantly, persists via
 * localStorage, and collapses the accordion.
 *
 * Layout: no card wrapper, spacing-only hierarchy per FORGE UI.
 */
export function ThemePicker() {
  const [activeId, setActiveId] = useState<string>(loadPaletteId())
  const [open, setOpen] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false))

  const pick = (palette: ThemePalette) => {
    setActiveId(palette.id)
    savePaletteId(palette.id)
    applyPalette(palette)
    setOpen(false)
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

      <div ref={ref}>
        {/* Trigger: shows current palette */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl
            bg-forged-bg border border-forged-border
            hover:border-forged-purple/30 transition-all
            active:scale-[0.99]"
        >
          <div
            className="w-5 h-5 rounded-full flex-shrink-0"
            style={{
              background: `linear-gradient(to right, ${active.primary} 50%, ${active.accent} 50%)`,
            }}
          />
          <span className="flex-1 text-sm text-forged-text font-black text-left">
            {active.name}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-forged-text2 flex-shrink-0 transition-transform duration-200
              ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Inline accordion: expands below trigger when open */}
        {open && (
          <div
            className="mt-2 bg-forged-surface border border-forged-border rounded-xl
              max-h-[400px] overflow-y-auto p-1"
            style={{ animation: 'fadeSlide 0.15s ease-out' }}
          >
            {PALETTES.map(p => {
              const isActive = p.id === activeId
              return (
                <button
                  key={p.id}
                  onClick={() => pick(p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all text-left active:scale-[0.99]
                    ${isActive
                      ? 'bg-forged-bg'
                      : 'hover:bg-forged-bg/60'}`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{
                      background: `linear-gradient(to right, ${p.primary} 50%, ${p.accent} 50%)`,
                    }}
                  />
                  <span className={`flex-1 text-sm
                    ${isActive
                      ? 'text-forged-text font-black'
                      : 'text-forged-text2 font-bold'}`}>
                    {p.name}
                  </span>
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
        )}
      </div>
    </div>
  )
}