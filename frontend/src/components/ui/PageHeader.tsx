import { Icon, I } from './Icon'

interface PageHeaderProps {
  /** Navigate back to the previous view. */
  onBack: () => void
  /** Page title displayed as a large heading. */
  title: string
  /** Optional subtitle shown below the title. */
  subtitle?: string
}

/**
 * Standard page header with a back button, title, and optional subtitle.
 * Used by every secondary page (Fasting, Settings, Streaks, etc.).
 */
export function PageHeader({ onBack, title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border
          flex items-center justify-center text-forged-text2
          hover:text-forged-text active:scale-95 transition-all"
      >
        <Icon d={I.chevronLeft} size={16} />
      </button>
      <div>
        <h1 className="text-2xl font-black text-forged-text">{title}</h1>
        {subtitle && (
          <p className="text-[10px] text-forged-text2 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  )
}