import { Icon, I } from '../ui/Icon'
import { Card } from '../ui/Card'
import { SectionLabel } from '../ui/SectionLabel'
import { PRESETS, type FastingPreset, type CustomFast } from './fastingConstants'

interface PresetListProps {
  onSelect: (preset: FastingPreset) => void
  onStartCustom: (hours: number) => void
  onCreateCustom: () => void
  customFasts: CustomFast[]
  onDeleteCustom: (id: string) => void
}

/**
 * Displays built-in fasting presets and saved custom fasts.
 * Each preset shows a proper icon (not emoji), colored by its theme.
 */
export function PresetList({
  onSelect,
  onStartCustom,
  onCreateCustom,
  customFasts,
  onDeleteCustom,
}: PresetListProps) {
  return (
    <Card delay={60}>
      <SectionLabel>Choose a Fast</SectionLabel>

      <div className="flex flex-col gap-2.5">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl
              border border-forged-border bg-forged-bg
              hover:border-opacity-60 active:scale-[0.99]
              transition-all text-left group"
            style={{ borderColor: preset.color + '25' }}
          >
            {/* Icon bubble */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: preset.color + '18' }}
            >
              <Icon
                d={I[preset.iconKey]}
                size={20}
                sw={2}
                className="transition-colors"
                style={{ color: preset.color }}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-forged-text">
                  {preset.id}
                </span>
                <span className="text-[10px] text-forged-text2 font-medium">
                  · {preset.name}
                </span>
              </div>
              <p className="text-[11px] text-forged-text2 mt-0.5">
                {preset.desc}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[9px] font-bold text-forged-text2 bg-forged-surface2 px-2 py-0.5 rounded-full">
                  {preset.hours}h fasting
                </span>
                <span className="text-[9px] font-bold text-forged-text2 bg-forged-surface2 px-2 py-0.5 rounded-full">
                  {preset.eat}h eating
                </span>
                <span className="text-[9px] font-bold text-forged-text2 bg-forged-surface2 px-2 py-0.5 rounded-full">
                  {preset.meals} meal{preset.meals > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <Icon
              d={I.chevron}
              size={16}
              className="text-forged-text2 group-hover:text-forged-text
                transition-colors flex-shrink-0"
            />
          </button>
        ))}
      </div>

      {/* Saved custom fasts */}
      {customFasts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-forged-text2/10">
          <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-widest mb-2.5">
            Your Custom Fasts
          </p>
          {customFasts.map(cf => (
            <div
              key={cf.id}
              className="flex items-center gap-3 p-3 rounded-xl
                border border-forged-border bg-forged-bg mb-2 last:mb-0"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: cf.color + '18' }}
              >
                <Icon d={I.clock} size={16} style={{ color: cf.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-forged-text">{cf.name}</p>
                <p className="text-[10px] text-forged-text2">
                  {cf.hours}h fast · {cf.eat}h eat · {cf.meals} meal
                  {cf.meals > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => onStartCustom(cf.hours)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black
                  bg-forged-purple/10 text-forged-purple border border-forged-purple/20
                  hover:bg-forged-purple hover:text-white
                  active:scale-95 transition-all"
              >
                Start
              </button>
              <button
                onClick={() => onDeleteCustom(cf.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                  text-forged-text2 hover:text-forged-red transition-colors"
              >
                <Icon d={I.trash} size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create custom button */}
      <button
        onClick={onCreateCustom}
        className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-forged-text2
          border border-dashed border-forged-border
          hover:border-forged-purple/30 hover:text-forged-purple transition-all
          flex items-center justify-center gap-2"
      >
        <Icon d={I.plus} size={14} sw={2.5} />
        Create Custom Fast
      </button>
    </Card>
  )
}