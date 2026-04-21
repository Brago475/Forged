import { useRef, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useClickOutside } from '../../hooks/useClickOutside'
import { Icon, I } from '../ui/Icon'

interface SettingsDropdownProps {
  onLogout: () => void
  onProfile?: () => void
  onSettings?: () => void
  /** Jump to a secondary page (weekly, photos, streaks, etc.). */
  onNavigate?: (tab: string) => void
  /** If true, opens upward (used in mobile bottom nav). */
  dropUp?: boolean
  /**
   * Which edge of the 3-dot button the menu anchors to.
   * 'right' = menu extends LEFT (good for mobile bottom-right / desktop header top-right).
   * 'left'  = menu extends RIGHT (good for desktop sidebar bottom-LEFT).
   * Default: 'right'.
   */
  anchor?: 'left' | 'right'
}

/**
 * Three-dot menu used in both the desktop header and the mobile
 * bottom nav. Handles theme toggle + jumps to secondary pages.
 */
export function SettingsDropdown({
  onLogout,
  onProfile,
  onSettings,
  onNavigate,
  dropUp = false,
  anchor = 'right',
}: SettingsDropdownProps) {
  const [open, setOpen] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()

  useClickOutside(ref, () => setOpen(false))

  const itemClass =
    'w-full flex items-center gap-3 px-4 py-3 text-sm text-forged-text2 whitespace-nowrap ' +
    'hover:bg-forged-surface2 transition-colors text-left border-t border-forged-border'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
          flex items-center justify-center text-forged-text2
          hover:text-forged-text hover:border-forged-purple/30 hover:bg-forged-surface2
          active:scale-95 transition-all"
      >
        <Icon d={I.dots} size={16} />
      </button>

      {open && (
        <div
          className={`absolute bg-forged-surface border border-forged-border
            rounded-xl shadow-xl z-[70] max-h-[70vh] overflow-y-auto
            ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'}
            ${anchor === 'right' ? 'right-0' : 'left-0'}`}
          style={{
            animation: 'fadeSlide 0.15s ease-out',
            width: '220px',
            minWidth: '220px',
          }}
        >
          {onProfile && (
            <button
              onClick={() => { onProfile(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forged-text
                hover:bg-forged-surface2 transition-colors text-left font-semibold"
            >
              <Icon d={I.profile} size={16} /><span>Profile</span>
            </button>
          )}

          <button onClick={() => { toggleTheme(); setOpen(false) }} className={itemClass}>
            <Icon d={theme === 'dark' ? I.sun : I.moon} size={16} />
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button onClick={() => { onSettings?.(); setOpen(false) }} className={itemClass}>
            <Icon d={I.settings} size={16} /><span>Settings</span>
          </button>

          <button onClick={() => { onNavigate?.('weekly'); setOpen(false) }} className={itemClass}>
            <Icon d={I.scale} size={16} /><span>Weekly Summary</span>
          </button>

          <button onClick={() => { onNavigate?.('photos'); setOpen(false) }} className={itemClass}>
            <Icon d={I.heart} size={16} /><span>Progress Photos</span>
          </button>

          <button onClick={() => { onNavigate?.('streaks'); setOpen(false) }} className={itemClass}>
            <Icon d={I.flame} size={16} /><span>Streaks</span>
          </button>

          
          <button onClick={() => { onNavigate?.('recipes'); setOpen(false) }} className={itemClass}>
            <Icon d={I.food} size={16} /><span>Recipes</span>
          </button>

          <button onClick={() => { onNavigate?.('feedback'); setOpen(false) }} className={itemClass}>
            <Icon d={I.edit} size={16} /><span>Feedback</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forged-red
              hover:bg-forged-red/5 transition-colors text-left border-t border-forged-border"
          >
            <Icon d={I.logout} size={16} /><span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}