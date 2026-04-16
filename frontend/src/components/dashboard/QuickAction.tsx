import type { ReactNode } from 'react'
import { Icon } from '../ui/Icon'

interface QuickActionProps {
  /** SVG path fragment from the `I` library. */
  icon: ReactNode
  label: string
  onClick?: () => void
}

/**
 * Square action tile in the quick-actions grid.
 * Renders an icon in a purple bubble with a label beneath.
 */
export function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 py-3 rounded-xl
        hover:bg-forged-surface2 active:scale-95 transition-all duration-150 group"
    >
      <div className="w-12 h-12 rounded-2xl bg-forged-purple/10 flex items-center justify-center group-hover:bg-forged-purple/20 group-hover:shadow-md group-hover:shadow-forged-purple/10 transition-all duration-200">
        <Icon d={icon} size={20} sw={2} className="text-forged-purple" />
      </div>
      <span className="text-[10px] text-forged-text font-semibold text-center leading-tight">
        {label}
      </span>
    </button>
  )
}