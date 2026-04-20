import { useTheme } from '../../hooks/useTheme'
import { Icon, I } from '../ui/Icon'
import { NAV, type TabId } from './nav'
import { SettingsDropdown } from './SettingsDropdown'
interface SidebarProps {
  active: TabId
  onChange: (tab: TabId) => void
  collapsed: boolean
  onToggle: () => void
  onLogout: () => void
}

/**
 * Desktop left sidebar. Collapses to icon-only at 68px,
 * expands to 240px with labels.
 *
 * Settings/Profile/secondary pages live in the SettingsDropdown at the bottom
 * (mirrors the mobile bottom-nav 3-dot menu). Primary tabs live above it.
 */
export function Sidebar({ active, onChange, collapsed, onToggle, onLogout }: SidebarProps) {
  const { theme, toggleTheme } = useTheme()

  const asideWidth = collapsed ? 'w-[68px]' : 'w-[240px]'

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-forged-surface border-r border-forged-border
        flex flex-col z-50 transition-all duration-300 ${asideWidth}`}
    >
      {/* Logo header */}
      <div
        className={`flex items-center h-16 px-4 border-b border-forged-border
          ${collapsed ? 'justify-center' : 'gap-3'}`}
      >
        <div
          className={`w-10 h-10 rounded-xl border-2 border-forged-red
            flex items-center justify-center flex-shrink-0 overflow-hidden
            ${theme === 'dark' ? 'bg-white' : 'bg-forged-surface'}`}
        >
          <img src="/forgedlogo.png" alt="FORGED" className="w-7 h-7 object-contain" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-base font-black text-forged-text tracking-wide block">
              FORGED
            </span>
            <span className="text-[9px] text-forged-text2 font-medium -mt-0.5 block">
              Fitness Tracker
            </span>
          </div>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1.5">
        {!collapsed && (
          <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-widest px-3 mb-2">
            Menu
          </p>
        )}
        {NAV.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex items-center gap-3 rounded-xl transition-all duration-200 relative
                ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-3'}
                ${isActive
                  ? 'bg-forged-purple/15 text-forged-purple shadow-sm'
                  : 'text-forged-text2 hover:text-forged-text hover:bg-forged-surface2'
                }`}
            >
              {/* Left-edge active indicator */}
              {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-forged-purple rounded-r-full" />
              )}
              <Icon d={item.icon} size={20} sw={isActive ? 2.2 : 1.6} className="flex-shrink-0" />
              {!collapsed && (
                <span className={`text-sm ${isActive ? 'font-black' : 'font-semibold'}`}>
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom: SettingsDropdown + quick theme toggle */}
      <div className="px-3 py-3 border-t border-forged-border flex flex-col gap-2">
        {!collapsed && (
          <p className="text-[10px] text-forged-text2 font-bold uppercase tracking-widest px-3 mb-1">
            Settings
          </p>
        )}

        {/* Row with dropdown + theme */}
        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
          <SettingsDropdown
            onLogout={onLogout}
            onProfile={() => onChange('profile')}
            onSettings={() => onChange('settings' as TabId)}
            onNavigate={(t) => onChange(t as TabId)}
            dropUp
          />
          {!collapsed && (
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center gap-2 justify-center px-3 py-2 rounded-xl
                text-forged-text2 hover:text-forged-text hover:bg-forged-surface2 transition-all
                border border-forged-border"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              <Icon d={theme === 'dark' ? I.sun : I.moon} size={16} className="flex-shrink-0" />
              <span className="text-xs font-bold">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
          )}
          {collapsed && (
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
                flex items-center justify-center text-forged-text2
                hover:text-forged-text hover:border-forged-purple/30 hover:bg-forged-surface2
                active:scale-95 transition-all"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              <Icon d={theme === 'dark' ? I.sun : I.moon} size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-forged-border
          text-forged-text2 hover:text-forged-text hover:bg-forged-surface2 transition-all"
      >
        <Icon d={collapsed ? I.chevronsRight : I.chevronsLeft} size={16} />
      </button>
    </aside>
  )
}