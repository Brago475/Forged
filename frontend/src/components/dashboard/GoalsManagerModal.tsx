import { useState } from 'react'
import {
  type DailyGoal,
  type ResetCadence,
  type AutoKind,
  AUTO_KIND_CATALOG,
  DEFAULT_GOALS,
  getAutoKindInfo,
  makeGoalId,
} from './goalsStorage'

interface GoalsManagerModalProps {
  initial: DailyGoal[]
  onSave: (goals: DailyGoal[]) => void
  onClose: () => void
}

type AddFlow = 'none' | 'choose' | 'manual' | 'auto'

/**
 * Daily-goal manager modal. Supports:
 *   - Editing label, target, cadence on any goal
 *   - Adding a manual goal (free-text + optional target) or an auto-connected goal
 *   - Hiding default goals (restorable) and deleting custom goals
 */
export function GoalsManagerModal({ initial, onSave, onClose }: GoalsManagerModalProps) {
  const [goals, setGoals] = useState<DailyGoal[]>(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addFlow, setAddFlow] = useState<AddFlow>('none')

  const updateGoal = (id: string, patch: Partial<DailyGoal>): void => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g))
  }

  const deleteGoal = (id: string): void => {
    const g = goals.find(x => x.id === id)
    if (!g) return
    if (g.autoKind && DEFAULT_GOALS.some(d => d.id === id)) {
      updateGoal(id, { hidden: true })
    } else {
      setGoals(prev => prev.filter(x => x.id !== id))
    }
  }

  const restoreGoal = (id: string): void => updateGoal(id, { hidden: false })

  const addGoal = (newGoal: DailyGoal): void => {
    const maxOrder = Math.max(-1, ...goals.map(g => g.order))
    setGoals([...goals, { ...newGoal, order: maxOrder + 1 }])
    setAddFlow('none')
  }

  const restoreAllDefaults = (): void => {
    const missing = DEFAULT_GOALS.filter(d => !goals.some(g => g.id === d.id))
    const restoredHidden = goals.map(g =>
      g.autoKind && DEFAULT_GOALS.some(d => d.id === g.id) && g.hidden
        ? { ...g, hidden: false } : g
    )
    setGoals([...restoredHidden, ...missing])
  }

  const visible = goals.filter(g => !g.hidden).sort((a, b) => a.order - b.order)
  const hidden = goals.filter(g => g.hidden)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center
        bg-black/50 backdrop-blur-sm px-3 py-4"
      onClick={onClose}
    >
      <div
        className="bg-forged-surface border border-forged-border rounded-t-2xl sm:rounded-2xl
          p-5 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-forged-text">Manage Goals</h2>
            <p className="text-[11px] text-forged-text2">Edit, add, or remove daily targets</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-text transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Active goals */}
        <div className="flex flex-col gap-2 mb-4">
          {visible.length === 0 && (
            <p className="text-[11px] text-forged-text2 text-center py-4">
              No active goals. Add one below or restore defaults.
            </p>
          )}
          {visible.map(goal => (
            <GoalEditRow
              key={goal.id}
              goal={goal}
              isEditing={editingId === goal.id}
              isDefault={DEFAULT_GOALS.some(d => d.id === goal.id)}
              onEdit={() => setEditingId(editingId === goal.id ? null : goal.id)}
              onUpdate={(patch) => updateGoal(goal.id, patch)}
              onDelete={() => deleteGoal(goal.id)}
            />
          ))}
        </div>

        {/* Add goal flow */}
        {addFlow === 'none' && (
          <button
            onClick={() => setAddFlow('choose')}
            className="w-full py-3 mb-4 border border-dashed border-forged-purple/40 rounded-xl
              text-forged-purple text-xs font-black hover:bg-forged-purple/5
              active:scale-[0.98] transition-all"
          >
            + Add Goal
          </button>
        )}

        {addFlow === 'choose' && (
          <div className="bg-forged-bg border border-forged-border rounded-xl p-3 mb-4 flex flex-col gap-2">
            <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">
              Pick Goal Type
            </p>
            <button
              onClick={() => setAddFlow('manual')}
              className="w-full text-left bg-forged-surface border border-forged-border
                rounded-xl p-3 hover:border-forged-purple/40 active:scale-[0.98] transition-all"
            >
              <p className="text-sm font-bold text-forged-text">Manual goal</p>
              <p className="text-[10px] text-forged-text2 mt-0.5">
                Free-form label, tap to check off. e.g. Meditate 10 minutes.
              </p>
            </button>
            <button
              onClick={() => setAddFlow('auto')}
              className="w-full text-left bg-forged-surface border border-forged-border
                rounded-xl p-3 hover:border-forged-purple/40 active:scale-[0.98] transition-all"
            >
              <p className="text-sm font-bold text-forged-text">App-tracked goal</p>
              <p className="text-[10px] text-forged-text2 mt-0.5">
                Auto-tracked from app data. e.g. steps, water, workouts this week.
              </p>
            </button>
            <button
              onClick={() => setAddFlow('none')}
              className="w-full py-2 text-[11px] text-forged-text2 hover:text-forged-text
                font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {addFlow === 'manual' && (
          <AddManualForm
            onAdd={(label, target, unit, cadence) => addGoal({
              id: makeGoalId(), label, target, targetUnit: unit, cadence, order: 0,
            })}
            onCancel={() => setAddFlow('none')}
          />
        )}

        {addFlow === 'auto' && (
          <AddAutoForm
            existingKinds={goals.map(g => g.autoKind).filter(Boolean) as AutoKind[]}
            onAdd={(kind) => {
              const info = getAutoKindInfo(kind)
              if (!info) return
              addGoal({
                id: makeGoalId(),
                label: info.label,
                target: info.defaultTarget,
                targetUnit: info.defaultUnit,
                cadence: info.defaultCadence,
                autoKind: kind,
                macroKey: info.macroKey,
                order: 0,
              })
            }}
            onCancel={() => setAddFlow('none')}
          />
        )}

        {/* Hidden defaults */}
        {hidden.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
              Hidden
            </p>
            <div className="flex flex-col gap-1.5">
              {hidden.map(goal => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between bg-forged-bg border border-forged-border
                    rounded-xl px-3 py-2"
                >
                  <span className="text-xs text-forged-text2 truncate">{goal.label}</span>
                  <button
                    onClick={() => restoreGoal(goal.id)}
                    className="text-[10px] font-black text-forged-purple hover:brightness-110 flex-shrink-0 ml-2"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={restoreAllDefaults}
          className="w-full py-2 mb-4 text-[11px] text-forged-text2 hover:text-forged-purple
            font-bold transition-colors"
        >
          Restore all default goals
        </button>

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
            onClick={() => { onSave(goals); onClose() }}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white
              bg-forged-purple hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Save Goals
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Subcomponents ──

function GoalEditRow({ goal, isEditing, isDefault, onEdit, onUpdate, onDelete }: {
  goal: DailyGoal
  isEditing: boolean
  isDefault: boolean
  onEdit: () => void
  onUpdate: (patch: Partial<DailyGoal>) => void
  onDelete: () => void
}) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-forged-text truncate">{goal.label}</p>
            {goal.autoKind && (
              <span className="flex items-center gap-1 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-forged-purple" />
                <span className="text-[9px] font-black text-forged-purple tracking-wider">AUTO</span>
              </span>
            )}
          </div>
          <p className="text-[10px] text-forged-text2">
            {goal.cadence === 'daily' ? 'Resets daily' : goal.cadence === 'weekly' ? 'Resets weekly' : 'Manual reset'}
            {goal.target != null && ` · ${goal.target}${goal.targetUnit ? ' ' + goal.targetUnit : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-purple hover:bg-forged-purple/10 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-red hover:bg-forged-red/10 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
            </svg>
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-3 pt-3 border-t border-forged-border flex flex-col gap-2">
          <div>
            <label className="text-[9px] font-black text-forged-text2 uppercase tracking-wider">Label</label>
            <input
              type="text"
              value={goal.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-forged-surface border border-forged-border
                rounded-lg text-forged-text text-sm
                focus:border-forged-purple/50 outline-none transition-colors"
            />
          </div>
          {!isDefault && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-black text-forged-text2 uppercase tracking-wider">Target</label>
                <input
                  type="number"
                  value={goal.target ?? ''}
                  onChange={(e) => onUpdate({ target: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="optional"
                  className="w-full mt-1 px-3 py-2 bg-forged-surface border border-forged-border
                    rounded-lg text-forged-text text-sm tabular-nums
                    focus:border-forged-purple/50 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-forged-text2 uppercase tracking-wider">Unit</label>
                <input
                  type="text"
                  value={goal.targetUnit ?? ''}
                  onChange={(e) => onUpdate({ targetUnit: e.target.value || undefined })}
                  placeholder="e.g. glasses"
                  className="w-full mt-1 px-3 py-2 bg-forged-surface border border-forged-border
                    rounded-lg text-forged-text text-sm
                    focus:border-forged-purple/50 outline-none transition-colors"
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-[9px] font-black text-forged-text2 uppercase tracking-wider">Resets</label>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {(['daily', 'weekly', 'manual'] as ResetCadence[]).map(c => (
                <button
                  key={c}
                  onClick={() => onUpdate({ cadence: c })}
                  className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                    ${goal.cadence === c
                      ? 'bg-forged-purple text-white'
                      : 'bg-forged-surface text-forged-text2 border border-forged-border hover:text-forged-text'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AddManualForm({ onAdd, onCancel }: {
  onAdd: (label: string, target: number | undefined, unit: string | undefined, cadence: ResetCadence) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState<string>('')
  const [target, setTarget] = useState<string>('')
  const [unit, setUnit] = useState<string>('')
  const [cadence, setCadence] = useState<ResetCadence>('daily')
  const canSave = label.trim().length > 0

  return (
    <div className="bg-forged-bg border border-forged-purple/30 rounded-xl p-3 mb-4 flex flex-col gap-2">
      <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">Manual Goal</p>
      <input
        type="text" autoFocus value={label} onChange={(e) => setLabel(e.target.value)}
        placeholder="Goal name (e.g. Meditate 10 min)"
        className="w-full px-3 py-2 bg-forged-surface border border-forged-border
          rounded-lg text-forged-text text-sm placeholder:text-forged-text2
          focus:border-forged-purple/50 outline-none transition-colors"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number" value={target} onChange={(e) => setTarget(e.target.value)}
          placeholder="Target (optional)"
          className="w-full px-3 py-2 bg-forged-surface border border-forged-border
            rounded-lg text-forged-text text-sm tabular-nums placeholder:text-forged-text2
            focus:border-forged-purple/50 outline-none transition-colors"
        />
        <input
          type="text" value={unit} onChange={(e) => setUnit(e.target.value)}
          placeholder="Unit (e.g. min)"
          className="w-full px-3 py-2 bg-forged-surface border border-forged-border
            rounded-lg text-forged-text text-sm placeholder:text-forged-text2
            focus:border-forged-purple/50 outline-none transition-colors"
        />
      </div>
      <div>
        <p className="text-[9px] font-black text-forged-text2 uppercase tracking-wider mb-1">Resets</p>
        <div className="grid grid-cols-3 gap-1">
          {(['daily', 'weekly', 'manual'] as ResetCadence[]).map(c => (
            <button
              key={c} onClick={() => setCadence(c)}
              className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                ${cadence === c
                  ? 'bg-forged-purple text-white'
                  : 'bg-forged-surface text-forged-text2 border border-forged-border hover:text-forged-text'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg text-xs font-black
            bg-forged-surface2 text-forged-text2 hover:text-forged-text transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => canSave && onAdd(
            label.trim(),
            target ? parseInt(target) : undefined,
            unit.trim() || undefined,
            cadence,
          )}
          disabled={!canSave}
          className="flex-1 py-2 rounded-lg text-xs font-black text-white
            bg-forged-purple hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-[0.98] transition-all"
        >
          Add Goal
        </button>
      </div>
    </div>
  )
}

function AddAutoForm({ existingKinds, onAdd, onCancel }: {
  existingKinds: AutoKind[]
  onAdd: (kind: AutoKind) => void
  onCancel: () => void
}) {
  // Exclude default ones already seeded and any kind already added
  const available = AUTO_KIND_CATALOG.filter(k => !existingKinds.includes(k.kind))

  return (
    <div className="bg-forged-bg border border-forged-purple/30 rounded-xl p-3 mb-4 flex flex-col gap-2">
      <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">App-Tracked Goal</p>
      {available.length === 0 ? (
        <p className="text-[11px] text-forged-text2 py-3 text-center">
          You've added every app-tracked goal.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
          {available.map(info => (
            <button
              key={info.kind}
              onClick={() => onAdd(info.kind)}
              className="w-full text-left bg-forged-surface border border-forged-border rounded-xl p-3
                hover:border-forged-purple/40 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-forged-text">{info.label}</p>
                {info.defaultTarget != null && (
                  <span className="text-[10px] font-black text-forged-purple tabular-nums flex-shrink-0 ml-2">
                    {info.defaultTarget}{info.defaultUnit ? ' ' + info.defaultUnit : ''}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-forged-text2 mt-0.5">{info.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] text-forged-text2 font-bold uppercase tracking-wider">
                  {info.defaultCadence}
                </span>
                {info.userEntered && (
                  <span className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider">
                    · Tap to log
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={onCancel}
        className="w-full py-2 text-[11px] text-forged-text2 hover:text-forged-text
          font-bold transition-colors"
      >
        Back
      </button>
    </div>
  )
}