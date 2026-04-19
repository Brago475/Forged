import { useState } from 'react'
import {
  type DailyGoal,
  type ResetCadence,
  DEFAULT_GOALS,
  makeGoalId,
} from './goalsStorage'

interface GoalsManagerModalProps {
  initial: DailyGoal[]
  onSave: (goals: DailyGoal[]) => void
  onClose: () => void
}

/**
 * Modal for managing daily/weekly goals. Supports:
 *  - Editing label, target, and cadence on any goal (default or custom)
 *  - Adding custom goals with name, optional target + unit, cadence
 *  - Hiding default goals (instead of deleting, so they can come back)
 *  - Deleting custom goals
 *  - Restoring hidden default goals
 */
export function GoalsManagerModal({ initial, onSave, onClose }: GoalsManagerModalProps) {
  const [goals, setGoals] = useState<DailyGoal[]>(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState<boolean>(false)

  const updateGoal = (id: string, patch: Partial<DailyGoal>): void => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g))
  }

  const deleteGoal = (id: string): void => {
    const g = goals.find(x => x.id === id)
    if (!g) return
    // Default goals: just hide so they can be restored
    if (g.autoKind) {
      updateGoal(id, { hidden: true })
    } else {
      setGoals(prev => prev.filter(x => x.id !== id))
    }
  }

  const restoreGoal = (id: string): void => {
    updateGoal(id, { hidden: false })
  }

  const addCustomGoal = (
    label: string,
    target: number | undefined,
    targetUnit: string | undefined,
    cadence: ResetCadence
  ): void => {
    const maxOrder = Math.max(0, ...goals.map(g => g.order))
    const newGoal: DailyGoal = {
      id: makeGoalId(),
      label,
      target,
      targetUnit,
      cadence,
      order: maxOrder + 1,
    }
    setGoals([...goals, newGoal])
    setShowAddForm(false)
  }

  const restoreAllDefaults = (): void => {
    const missing = DEFAULT_GOALS.filter(d => !goals.some(g => g.id === d.id))
    const restoredHidden = goals.map(g =>
      g.autoKind && g.hidden ? { ...g, hidden: false } : g
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
        {/* Header */}
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Active goals list */}
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
              onEdit={() => setEditingId(editingId === goal.id ? null : goal.id)}
              onUpdate={(patch) => updateGoal(goal.id, patch)}
              onDelete={() => deleteGoal(goal.id)}
            />
          ))}
        </div>

        {/* Add custom goal */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 mb-4 border border-dashed border-forged-purple/40 rounded-xl
              text-forged-purple text-xs font-black hover:bg-forged-purple/5
              active:scale-[0.98] transition-all"
          >
            + Add Custom Goal
          </button>
        ) : (
          <AddGoalForm onAdd={addCustomGoal} onCancel={() => setShowAddForm(false)} />
        )}

        {/* Hidden / removed defaults */}
        {hidden.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-2">
              Hidden Defaults
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

        {/* Reset defaults */}
        <button
          onClick={restoreAllDefaults}
          className="w-full py-2 mb-4 text-[11px] text-forged-text2 hover:text-forged-purple
            font-bold transition-colors"
        >
          Restore all default goals
        </button>

        {/* Actions */}
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

function GoalEditRow({ goal, isEditing, onEdit, onUpdate, onDelete }: {
  goal: DailyGoal
  isEditing: boolean
  onEdit: () => void
  onUpdate: (patch: Partial<DailyGoal>) => void
  onDelete: () => void
}) {
  return (
    <div className="bg-forged-bg border border-forged-border rounded-xl p-3">
      {/* Collapsed row */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-forged-text truncate">{goal.label}</p>
            {goal.autoKind && (
              <span className="text-[8px] font-black text-forged-purple bg-forged-purple/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                AUTO
              </span>
            )}
          </div>
          <p className="text-[10px] text-forged-text2">
            {goal.cadence === 'daily' ? 'Resets daily' : goal.cadence === 'weekly' ? 'Resets weekly' : 'Manual reset'}
            {goal.target && ` · ${goal.target}${goal.targetUnit ? ' ' + goal.targetUnit : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-purple hover:bg-forged-purple/10
              transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center
              text-forged-text2 hover:text-forged-red hover:bg-forged-red/10
              transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded edit form */}
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
          {!goal.autoKind && (
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

function AddGoalForm({ onAdd, onCancel }: {
  onAdd: (label: string, target: number | undefined, targetUnit: string | undefined, cadence: ResetCadence) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState<string>('')
  const [target, setTarget] = useState<string>('')
  const [targetUnit, setTargetUnit] = useState<string>('')
  const [cadence, setCadence] = useState<ResetCadence>('daily')

  const canSave = label.trim().length > 0

  return (
    <div className="bg-forged-bg border border-forged-purple/30 rounded-xl p-3 mb-4 flex flex-col gap-2">
      <p className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">New Goal</p>

      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Goal name (e.g. Drink water)"
        autoFocus
        className="w-full px-3 py-2 bg-forged-surface border border-forged-border
          rounded-lg text-forged-text text-sm placeholder:text-forged-text2
          focus:border-forged-purple/50 outline-none transition-colors"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target (optional)"
          className="w-full px-3 py-2 bg-forged-surface border border-forged-border
            rounded-lg text-forged-text text-sm tabular-nums placeholder:text-forged-text2
            focus:border-forged-purple/50 outline-none transition-colors"
        />
        <input
          type="text"
          value={targetUnit}
          onChange={(e) => setTargetUnit(e.target.value)}
          placeholder="Unit (e.g. glasses)"
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
              key={c}
              onClick={() => setCadence(c)}
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
            bg-forged-surface2 text-forged-text2
            hover:text-forged-text transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => canSave && onAdd(
            label.trim(),
            target ? parseInt(target) : undefined,
            targetUnit.trim() || undefined,
            cadence
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