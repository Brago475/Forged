import { useState } from 'react'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { Icon, I } from '../ui/Icon'
import { Card } from '../ui/Card'
import { SectionLabel } from '../ui/SectionLabel'
import { SettingsDropdown } from '../layout/SettingsDropdown'
import type { TabId } from '../layout/nav'
import type { DashboardStats, User, FastingLog, FoodLog } from '../../types'
import type { Macros } from './types'
import { FastingMini } from './FastingMini'
import { HeroCalorieRing } from './HeroCalorieRing'
import { MacroCard } from './MacroCard'
import { MacroCardSmall } from './MacroCardSmall'
import { QuickAction } from './QuickAction'
import { StatChip } from './StatChip'
import { WorkoutSnapshot } from './WorkoutSnapshot'
import { FoodSnapshot } from './FoodSnapshot'
import { MiniWeightChart } from './MiniWeightChart'
import { InsightCard } from './InsightCard'
import { GoalEditorModal } from '../food/GoalEditorModal'
import { loadGoals, saveGoals, type FoodGoals } from '../food/goalStorage'
import {
  loadDailyGoals,
  saveDailyGoals,
  loadGoalChecks,
  saveGoalChecks,
  loadGoalValues,
  saveGoalValues,
  getCurrentCheck,
  getCurrentValue,
  setCurrentValue,
  toggleGoalCheck,
  getStreak,
  getAutoKindInfo,
  type DailyGoal,
  type GoalCheck,
  type GoalValue,
} from './goalsStorage'
import { GoalsManagerModal } from './GoalsManagerModal'

interface HomeTabProps {
  stats: DashboardStats | null
  user: User | null
  activeFast: FastingLog | null
  macros: Macros
  todayFood: FoodLog[]
  onTabChange: (tab: TabId) => void
  onLogout: () => void
}

/**
 * The main "Home" tab content. Shows calorie hero card, macros,
 * quick actions, today's goals, workout/food snapshots, progress
 * preview, and a contextual insight at the bottom.
 *
 * Food goals sync with the Food Log page via localStorage.
 * Daily goals (checklist) sync via their own storage module.
 */
export function HomeTab({
  stats,
  user,
  activeFast,
  macros,
  todayFood,
  onTabChange,
  onLogout,
}: HomeTabProps) {
  const [goals, setGoals] = useState<FoodGoals>(loadGoals)
  const [showGoalEditor, setShowGoalEditor] = useState<boolean>(false)
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(loadDailyGoals)
  const [goalChecks, setGoalChecks] = useState<GoalCheck[]>(loadGoalChecks)
  const [goalValues, setGoalValues] = useState<GoalValue[]>(loadGoalValues)
  const [showGoalsManager, setShowGoalsManager] = useState<boolean>(false)

  const handleSaveGoals = (next: FoodGoals): void => {
    setGoals(next)
    saveGoals(next)
  }

  const handleSaveDailyGoals = (next: DailyGoal[]): void => {
    setDailyGoals(next)
    saveDailyGoals(next)
  }

  const handleToggleGoal = (goal: DailyGoal): void => {
    const next = toggleGoalCheck(goal.id, goal, goalChecks)
    setGoalChecks(next)
    saveGoalChecks(next)
  }

  const handleIncrementValue = (goal: DailyGoal, delta: number): void => {
    const current = getCurrentValue(goal, goalValues)
    const next = setCurrentValue(goal, Math.max(0, current + delta), goalValues)
    setGoalValues(next)
    saveGoalValues(next)
  }

  const handleSetValue = (goal: DailyGoal, value: number): void => {
    const next = setCurrentValue(goal, value, goalValues)
    setGoalValues(next)
    saveGoalValues(next)
  }

  /**
   * Compute whether a goal is complete + return its current progress value
   * (if numeric). Handles every auto-kind we support.
   */
  const computeGoalState = (goal: DailyGoal): { done: boolean; current?: number } => {
    if (!goal.autoKind) {
      const current = getCurrentValue(goal, goalValues)
      const target = goal.target ?? 0
      const done = target > 0 ? current >= target : getCurrentCheck(goal, goalChecks).checked
      return { done, current: goal.target ? current : undefined }
    }

    const target = goal.target ?? 0
    const userValue = getCurrentValue(goal, goalValues)

    switch (goal.autoKind) {
      case 'mealLogged':
        return { done: todayFood.length > 0 }
      case 'workoutDone':
        return { done: false }
      case 'fastActive':
        return { done: activeFast !== null }
      case 'proteinHit':
        return { done: macros.protein >= goals.protein, current: macros.protein }
      case 'underCalories':
        return { done: macros.cal > 0 && macros.cal <= goals.calories, current: macros.cal }
      case 'waterGlasses':
        return { done: target > 0 && userValue >= target, current: userValue }
      case 'stepsWalked':
        return { done: target > 0 && userValue >= target, current: userValue }
      case 'workoutsThisWeek':
        return { done: false, current: 0 }
      case 'weightLoggedToday':
        return { done: false }
      case 'caloriesLogged':
        return { done: macros.cal > 0 }
      case 'macroHit': {
        if (goal.macroKey === 'fiber') return { done: macros.fiber >= target, current: macros.fiber }
        if (goal.macroKey === 'protein') return { done: macros.protein >= target, current: macros.protein }
        if (goal.macroKey === 'carbs') return { done: macros.carbs >= target, current: macros.carbs }
        if (goal.macroKey === 'fat') return { done: macros.fat >= target, current: macros.fat }
        return { done: false }
      }
      case 'sleepHours':
        return { done: target > 0 && userValue >= target, current: userValue }
      case 'gymDaysPerWeek':
        return { done: false, current: 0 }
      case 'fastTargetHit':
        return { done: false }
      case 'bodyweightChange':
        return { done: getCurrentCheck(goal, goalChecks).checked }
      default:
        return { done: false }
    }
  }

  const calLeft = Math.max(goals.calories - macros.cal, 0)
  const calPct = Math.min(macros.cal / Math.max(goals.calories, 1), 1)
  const onTrack = macros.cal <= goals.calories
  const animCal = useAnimatedNumber(macros.cal, 1000)

  const getGreeting = (): string => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-forged-text">
            {getGreeting()}, {user?.displayName || user?.username || 'Athlete'}
          </p>
          <p className="text-xs text-forged-text2 font-medium">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="hidden md:block">
          <SettingsDropdown
            onLogout={onLogout}
            onProfile={() => onTabChange('profile')}
            onSettings={() => onTabChange('settings')}
            onNavigate={(t) => onTabChange(t as TabId)}
          />
        </div>
      </div>

      {/* Hero: calorie card (clickable to edit goals) */}
      <button
        onClick={() => setShowGoalEditor(true)}
        className="text-left w-full"
      >
        <Card delay={60} hero className="!p-6 relative overflow-hidden hover:border-forged-purple/40 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-forged-purple/[0.07] via-transparent to-forged-purple/[0.03] pointer-events-none" />
          <div className="relative flex items-center gap-6">
            <HeroCalorieRing pct={calPct} />
            <div className="flex-1 min-w-0">
              <p className="text-6xl font-black text-forged-text tabular-nums leading-none tracking-tighter">
                {animCal}
              </p>
              <p className="text-sm text-forged-text2 mt-1.5 font-medium">
                of <span className="font-black text-forged-text">{goals.calories}</span> cal
              </p>
              <p className="text-sm text-forged-text2">{calLeft} remaining</p>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black mt-3
                  ${macros.cal === 0
                    ? 'bg-forged-surface2 text-forged-text2 border border-forged-border'
                    : onTrack
                      ? 'bg-forged-green/15 text-forged-green border border-forged-green/25'
                      : 'bg-forged-red/15 text-forged-red border border-forged-red/25'
                  }`}
              >
                <Icon d={macros.cal === 0 ? I.clock : onTrack ? I.check : I.x} size={13} sw={3} />
                {macros.cal === 0 ? 'No meals yet' : onTrack ? 'On Track' : 'Over Goal'}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-forged-text2 text-center mt-4 font-bold uppercase tracking-wider">
            Tap to edit goals
          </p>

          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onTabChange('food')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                onTabChange('food')
              }
            }}
            className="w-full mt-3 py-3.5 rounded-xl font-black text-sm
              bg-forged-purple text-white shadow-lg shadow-forged-purple/30
              hover:shadow-forged-purple/50 hover:brightness-110
              active:scale-[0.98] transition-all flex items-center justify-center gap-2
              cursor-pointer"
          >
            <Icon d={I.plus} size={16} sw={2.5} />Add Meal
          </div>

          {/* Fasting status */}
          <div className="border-t border-forged-border mt-5 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center
                    ${activeFast ? 'bg-forged-green/15' : 'bg-forged-surface2'}`}
                >
                  <Icon
                    d={I.clock}
                    size={16}
                    className={activeFast ? 'text-forged-green' : 'text-forged-text2'}
                  />
                </div>
                {activeFast ? (
                  <FastingMini fast={activeFast} />
                ) : (
                  <div className="text-left">
                    <p className="text-sm font-bold text-forged-text">Fasting</p>
                    <p className="text-xs text-forged-text2">No active fast</p>
                  </div>
                )}
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onTabChange('fasting')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    onTabChange('fasting')
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-black
                  bg-forged-purple/10 text-forged-purple border border-forged-purple/20
                  hover:bg-forged-purple hover:text-white active:scale-95 transition-all
                  cursor-pointer"
              >
                {activeFast ? 'View' : 'Start'}
              </div>
            </div>
          </div>
        </Card>
      </button>

      {/* Macros (clickable to edit goals) */}
      <button
        onClick={() => setShowGoalEditor(true)}
        className="text-left w-full"
      >
        <Card delay={130} className="hover:border-forged-purple/40 transition-all">
          <SectionLabel>Macros</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <MacroCard label="Protein" current={macros.protein} goal={goals.protein} />
            <MacroCard label="Carbs" current={macros.carbs} goal={goals.carbs} />
            <MacroCard label="Fat" current={macros.fat} goal={goals.fat} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <MacroCardSmall
              label="Fiber"
              value={`${Math.round(macros.fiber)}g`}
              pct={macros.fiber / 30}
            />
            <MacroCardSmall label="Water" value="--" pct={0} />
          </div>
          <p className="text-[10px] text-forged-text2 text-center mt-3 font-bold uppercase tracking-wider">
            Tap to edit goals
          </p>
        </Card>
      </button>

      {/* Quick actions */}
      <Card delay={200}>
        <SectionLabel>Quick actions</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          <QuickAction icon={I.plus} label="Add Meal" onClick={() => onTabChange('food')} />
          <QuickAction icon={I.workout} label="Log Workout" onClick={() => onTabChange('workouts')} />
          <QuickAction icon={I.droplet} label="Add Water" />
          <QuickAction
            icon={I.clock}
            label="Start Fast"
            onClick={() => onTabChange('fasting')}
          />
        </div>
      </Card>

      {/* Today's Goals (user-managed checklist) */}
      <Card delay={270}>
        <div className="flex justify-between items-center mb-3">
          <SectionLabel>Today's Goals</SectionLabel>
          <button
            onClick={() => setShowGoalsManager(true)}
            className="text-xs text-forged-purple font-black hover:text-forged-text transition-colors -mt-2 flex items-center gap-1"
          >
            <Icon d={I.edit} size={12} sw={2} />Manage
          </button>
        </div>
        {dailyGoals.filter(g => !g.hidden).sort((a, b) => a.order - b.order).map(goal => {
          const { done, current } = computeGoalState(goal)
          const streak = getStreak(goal, goalChecks)
          const info = goal.autoKind ? getAutoKindInfo(goal.autoKind) : undefined
          const allowIncrement = info?.userEntered === true

          return (
            <GoalRow
              key={goal.id}
              goal={goal}
              done={done}
              current={current}
              streak={streak}
              allowIncrement={allowIncrement}
              onToggle={goal.autoKind ? undefined : () => handleToggleGoal(goal)}
              onIncrement={allowIncrement ? () => handleIncrementValue(goal, 1) : undefined}
              onDecrement={allowIncrement ? () => handleIncrementValue(goal, -1) : undefined}
              onSetValue={allowIncrement ? (v) => handleSetValue(goal, v) : undefined}
            />
          )
        })}
        {dailyGoals.filter(g => !g.hidden).length === 0 && (
          <p className="text-[11px] text-forged-text2 text-center py-3">
            No goals yet. Tap Manage to add some.
          </p>
        )}
      </Card>

      {/* Workout snapshot */}
      <Card delay={340}>
        <SectionLabel>Workout</SectionLabel>
        <WorkoutSnapshot onGo={() => onTabChange('workouts')} />
      </Card>

      {/* Food snapshot */}
      <Card delay={410}>
        <SectionLabel>Last meal</SectionLabel>
        <FoodSnapshot
          todayFood={todayFood}
          proteinLeft={Math.max(goals.protein - macros.protein, 0)}
          onGo={() => onTabChange('food')}
        />
      </Card>

      {/* Progress preview */}
      <Card delay={480}>
        <div className="flex justify-between items-center mb-3">
          <SectionLabel>Progress</SectionLabel>
          <button
            onClick={() => onTabChange('progress')}
            className="text-xs text-forged-purple font-black hover:text-forged-text transition-colors -mt-2"
          >
            See all
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <StatChip label="Weight" value={stats ? `${stats.currentWeight}` : '--'} unit="lbs" />
          <StatChip label="Lost" value={stats?.weightLost ? `-${stats.weightLost}` : '--'} unit="lbs" accent />
          <StatChip label="Streak" value={stats ? `${stats.currentStreak}` : '--'} unit="days" />
        </div>
        {stats?.recentWeights && stats.recentWeights.length >= 2 && (
          <p className="text-[10px] text-forged-text2 mb-1">
            {new Date(stats.recentWeights[0].date + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {' -- '}
            {new Date(
              stats.recentWeights[stats.recentWeights.length - 1].date + 'T00:00:00'
            ).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
        <MiniWeightChart data={stats?.recentWeights ?? []} />
      </Card>

      {/* Insight */}
      <Card delay={550}>
        <InsightCard macros={macros} streak={stats?.currentStreak ?? 0} proteinGoal={goals.protein} />
      </Card>

      {/* Goal Editor Modal (food macros) */}
      {showGoalEditor && (
        <GoalEditorModal
          initial={goals}
          onSave={handleSaveGoals}
          onClose={() => setShowGoalEditor(false)}
        />
      )}

      {/* Goals Manager Modal (daily checklist) */}
      {showGoalsManager && (
        <GoalsManagerModal
          initial={dailyGoals}
          onSave={handleSaveDailyGoals}
          onClose={() => setShowGoalsManager(false)}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────
// GOAL ROW
// ──────────────────────────────────
interface GoalRowProps {
  goal: DailyGoal
  done: boolean
  current?: number
  streak: number
  allowIncrement: boolean
  onToggle?: () => void
  onIncrement?: () => void
  onDecrement?: () => void
  onSetValue?: (v: number) => void
}

/**
 * Single daily-goal row:
 *  - Thin left accent stripe (purple when done, muted otherwise)
 *  - Checkbox (auto-derived or tap-to-toggle for manual)
 *  - Label with optional target "current / target unit"
 *  - Progress bar when there's a numeric target
 *  - [- N +] controls for user-entered goals (water, steps, sleep)
 *  - Small streak counter on the right
 */
function GoalRow({
  goal, done, current, streak, allowIncrement,
  onToggle, onIncrement, onDecrement, onSetValue,
}: GoalRowProps) {
  const interactive = !!onToggle
  const target = goal.target ?? 0
  const hasTarget = target > 0 && current != null
  const pct = hasTarget ? Math.min((current / target) * 100, 100) : 0

  return (
    <div
      className={`flex items-stretch gap-2.5 py-2.5 border-b border-forged-border last:border-0
        ${interactive ? 'cursor-pointer hover:bg-forged-surface2/40 -mx-2 px-2 rounded-lg transition-colors' : ''}`}
      onClick={interactive ? onToggle : undefined}
    >
      {/* Left accent stripe */}
      <div
        className={`w-[3px] rounded-full flex-shrink-0 self-stretch transition-colors
          ${done ? 'bg-forged-purple' : 'bg-forged-border'}`}
      />

      {/* Checkbox */}
      <div className="flex items-center flex-shrink-0">
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all
            ${done
              ? 'bg-forged-purple text-white'
              : 'border-2 border-forged-border'}`}
        >
          {done && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <p className={`text-xs font-bold truncate
              ${done ? 'text-forged-text2 line-through' : 'text-forged-text'}`}>
              {goal.label}
            </p>
            {goal.autoKind && (
              <span className="w-1.5 h-1.5 rounded-full bg-forged-purple flex-shrink-0" title="Auto-tracked" />
            )}
            {goal.cadence !== 'daily' && (
              <span className="text-[8px] font-black text-forged-text2 uppercase tracking-wider flex-shrink-0">
                {goal.cadence}
              </span>
            )}
          </div>

          {/* Right meta: value or streak */}
          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {hasTarget && (
              <span className="text-[11px] font-bold tabular-nums text-forged-text">
                {Math.round(current!)} / {target}{goal.targetUnit ? ` ${goal.targetUnit}` : ''}
              </span>
            )}
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-black text-forged-purple tabular-nums">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2s1 4 4 6.5c2.5 2.1 3.5 5 3.5 7.5a7.5 7.5 0 01-15 0c0-2.5 1-4.5 3-6 0 2 1 3 2 3 0-5 2.5-8 2.5-11z" />
                </svg>
                {streak}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {hasTarget && (
          <div className="mt-1.5 h-1 rounded-full bg-forged-surface2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500
                ${done ? 'bg-forged-purple' : 'bg-forged-purple/60'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {/* Increment controls for user-entered goals */}
        {allowIncrement && onDecrement && onIncrement && (
          <div className="flex items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onDecrement}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                bg-forged-surface2 text-forged-text2 hover:text-forged-text
                active:scale-95 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <input
              type="number"
              value={current ?? 0}
              onChange={(e) => onSetValue?.(parseInt(e.target.value) || 0)}
              className="w-14 h-7 px-1 bg-forged-surface2 rounded-lg text-xs font-black text-forged-text
                text-center tabular-nums outline-none focus:ring-2 focus:ring-forged-purple/50"
            />
            <button
              onClick={onIncrement}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                bg-forged-purple text-white hover:brightness-110
                active:scale-95 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}