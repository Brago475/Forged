import { Icon, I } from '../ui/Icon'

interface CheckItemProps {
  done: boolean
  label: string
}

/**
 * Single goal checklist row with a green filled circle when done
 * or an empty ring when pending.
 */
export function CheckItem({ done, label }: CheckItemProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-forged-text2/20 last:border-0">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all
          ${done
            ? 'bg-forged-green shadow-sm shadow-forged-green/20'
            : 'border-2 border-forged-text2/40'
          }`}
      >
        {done && <Icon d={I.check} size={11} sw={3} className="text-white" />}
      </div>
      <span className={`text-sm font-medium text-forged-text ${done ? 'opacity-100' : 'opacity-80'}`}>
        {label}
      </span>
    </div>
  )
}