import { Icon } from '../ui/Icon'
import { NAV, type TabId } from './nav'
import { SettingsDropdown } from './SettingsDropdown'

interface BottomNavProps {
  active: TabId
  onChange: (tab: TabId) => void
  onLogout: () => void
  onProfile: () => void
}

/**
 * Mobile bottom nav. The "dashboard" item is rendered as a raised
 * center button. The three-dot menu docks to the right edge.
 */
export function BottomNav({ active, onChange, onLogout, onProfile }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden
        bg-forged-surface/95 backdrop-blur-xl border-t border-forged-border flex items-end"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 6px)',
        paddingTop: '4px',
      }}
    >
      <div className="flex-1 flex justify-around items-end">
        {NAV.map(tab => {
          const isActive = active === tab.id
          const isCenter = tab.id === 'dashboard'

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center min-w-[48px] transition-all duration-200
                ${isCenter ? '-mt-5 pb-0' : 'py-1 hover:opacity-80 active:scale-95'}`}
            >
              {isCenter ? (
                // Raised center button
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                    hover:scale-105 active:scale-95
                    ${isActive
                      ? 'bg-forged-purple shadow-lg shadow-forged-purple/40'
                      : 'bg-forged-surface2 border border-forged-border shadow-md hover:border-forged-purple/30'
                    }`}
                >
                  <Icon
                    d={tab.icon}
                    size={24}
                    sw={2}
                    className={isActive ? 'text-white' : 'text-forged-text2'}
                  />
                </div>
              ) : (
                <>
                  <div
                    className={`px-3 py-1 rounded-xl transition-all duration-200
                      ${isActive ? 'bg-forged-purple/15' : 'hover:bg-forged-surface2'}`}
                  >
                    <Icon
                      d={tab.icon}
                      size={20}
                      sw={isActive ? 2.2 : 1.5}
                      className={`transition-colors ${isActive
                        ? 'text-forged-purple'
                        : 'text-forged-text2 group-hover:text-forged-text'}`}
                    />
                  </div>
                  <span
                    className={`text-[9px] mt-0.5 ${isActive
                      ? 'font-bold text-forged-purple'
                      : 'text-forged-text2'}`}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      <div className="pr-2 pb-2">
        <SettingsDropdown
          onLogout={onLogout}
          onProfile={onProfile}
          onSettings={() => onChange('settings')}
          onNavigate={(t) => onChange(t as TabId)}
          dropUp
        />
      </div>
    </nav>
  )
}