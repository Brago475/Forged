import { useState } from 'react'
import { Icon, I } from '../ui/Icon'

interface EditFastSheetProps {
  startTime: string
  targetHours: number
  eatHours: number
  onSave: (next: { startTime: string; targetHours: number; eatHours: number }) => void
  onClose: () => void
}

/**
 * Convert an ISO string to the local value format a datetime-local input expects.
 */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Convert a datetime-local input value back to ISO.
 */
function localInputToIso(v: string): string {
  return new Date(v).toISOString()
}

/**
 * Modal sheet for editing an active fast. Covers start time, target hours,
 * and eating window duration.
 */
export function EditFastSheet({
  startTime,
  targetHours,
  eatHours,
  onSave,
  onClose,
}: EditFastSheetProps) {
  const [start, setStart] = useState<string>(isoToLocalInput(startTime))
  const [target, setTarget] = useState<number>(targetHours)
  const [eat, setEat] = useState<number>(eatHours)

  const adjust = (
    current: number,
    delta: number,
    min: number,
    max: number,
    setter: (n: number) => void
  ): void => {
    setter(Math.max(min, Math.min(max, current + delta)))
  }

  const handleSave = (): void => {
    onSave({
      startTime: localInputToIso(start),
      targetHours: target,
      eatHours: eat,
    })
    onClose()
  }

  const newStartDate = new Date(localInputToIso(start))
  const newEatOpen = new Date(newStartDate.getTime() + target * 3600000)
  const newEatClose = new Date(newEatOpen.getTime() + eat * 3600000)

  const fmtTime = (d: Date): string =>
    d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center
        bg-black/50 backdrop-blur-sm px-3"
      onClick={onClose}
    >
      <div
        className="bg-forged-surface border border-forged-border rounded-t-2xl sm:rounded-2xl
          p-5 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-forged-text">Edit Fast</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-text transition-colors"
          >
            <Icon d={I.x} size={16} />
          </button>
        </div>

        {/* Start time */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2 block">
            Start Time
          </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-3 py-2.5 bg-forged-bg border border-forged-border
              rounded-xl text-forged-text text-sm
              focus:border-forged-purple/50 transition-colors outline-none"
          />
        </div>

        {/* Target hours */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2 block">
            Fast Duration
          </label>
          <div className="flex items-center justify-between bg-forged-bg border border-forged-border rounded-xl p-2.5">
            <button
              onClick={() => adjust(target, -0.5, 1, 48, setTarget)}
              disabled={target <= 1}
              className="w-8 h-8 rounded-md border border-forged-border
                flex items-center justify-center text-forged-text2 hover:text-forged-text
                active:scale-90 transition-all disabled:opacity-30"
            >
              <Icon d={I.minus} size={12} sw={2.5} />
            </button>
            <div className="text-center">
              <p className="text-xl font-black text-forged-text tabular-nums">{target}h</p>
              <p className="text-[9px] text-forged-text2 font-bold uppercase tracking-wider">
                Fasting
              </p>
            </div>
            <button
              onClick={() => adjust(target, 0.5, 1, 48, setTarget)}
              disabled={target >= 48}
              className="w-8 h-8 rounded-md border border-forged-border
                flex items-center justify-center text-forged-text2 hover:text-forged-text
                active:scale-90 transition-all disabled:opacity-30"
            >
              <Icon d={I.plus} size={12} sw={2.5} />
            </button>
          </div>
        </div>

        {/* Eating window */}
        <div className="mb-5">
          <label className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2 block">
            Eating Window
          </label>
          <div className="flex items-center justify-between bg-forged-bg border border-forged-border rounded-xl p-2.5">
            <button
              onClick={() => adjust(eat, -0.5, 1, 14, setEat)}
              disabled={eat <= 1}
              className="w-8 h-8 rounded-md border border-forged-border
                flex items-center justify-center text-forged-text2 hover:text-forged-text
                active:scale-90 transition-all disabled:opacity-30"
            >
              <Icon d={I.minus} size={12} sw={2.5} />
            </button>
            <div className="text-center">
              <p className="text-xl font-black text-forged-text tabular-nums">{eat}h</p>
              <p className="text-[9px] text-forged-text2 font-bold uppercase tracking-wider">
                Eating
              </p>
            </div>
            <button
              onClick={() => adjust(eat, 0.5, 1, 14, setEat)}
              disabled={eat >= 14}
              className="w-8 h-8 rounded-md border border-forged-border
                flex items-center justify-center text-forged-text2 hover:text-forged-text
                active:scale-90 transition-all disabled:opacity-30"
            >
              <Icon d={I.plus} size={12} sw={2.5} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-forged-bg border border-forged-border rounded-xl p-3 mb-5">
          <p className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
            Preview
          </p>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-forged-text2">Fast starts</span>
              <span className="font-bold text-forged-text">{fmtTime(newStartDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forged-text2">Eat window opens</span>
              <span className="font-bold text-forged-green">{fmtTime(newEatOpen)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forged-text2">Eat window closes</span>
              <span className="font-bold text-forged-text">{fmtTime(newEatClose)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-black
              bg-forged-surface2 text-forged-text2 border border-forged-border
              hover:text-forged-text active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white
              bg-forged-purple hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}