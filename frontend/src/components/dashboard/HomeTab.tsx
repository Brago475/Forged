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
import { CheckItem } from './CheckItem'
import { StatChip } from './StatChip'
import { WorkoutSnapshot } from './WorkoutSnapshot'
import { FoodSnapshot } from './FoodSnapshot'
import { MiniWeightChart } from './MiniWeightChart'
import { InsightCard } from './InsightCard'
import { GoalEditorModal } from '../food/GoalEditorModal'
import { loadGoals, saveGoals, type FoodGoals } from '../food/goalStorage'

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

  const handleSaveGoals = (next: FoodGoals): void => {
    setGoals(next)
    saveGoals(next)
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

      {/* Today's goals */}
      <Card delay={270}>
        <div className="flex justify-between items-center mb-3">
          <SectionLabel>Today's Goals</SectionLabel>
          <button
            onClick={() => setShowGoalEditor(true)}
            className="text-xs text-forged-purple font-black hover:text-forged-text transition-colors -mt-2 flex items-center gap-1"
          >
            <Icon d={I.edit} size={12} sw={2} />Edit
          </button>
        </div>
        <CheckItem
          done={todayFood.length > 0}
          label={
            todayFood.length > 0
              ? `${todayFood.length} meal${todayFood.length > 1 ? 's' : ''} logged`
              : 'Log at least 1 meal'
          }
        />
        <CheckItem done={false} label="Complete a workout" />
        <CheckItem
          done={activeFast !== null}
          label={activeFast ? 'Fasting active' : 'Start a fast'}
        />
        <CheckItem
          done={macros.protein >= goals.protein}
          label={
            macros.protein >= goals.protein
              ? `Hit ${goals.protein}g protein`
              : `Hit ${goals.protein}g protein (${macros.protein}g so far)`
          }
        />
        <CheckItem
          done={macros.cal > 0 && macros.cal <= goals.calories}
          label={`Stay under ${goals.calories} cal`}
        />
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

      {/* Goal Editor Modal */}
      {showGoalEditor && (
        <GoalEditorModal
          initial={goals}
          onSave={handleSaveGoals}
          onClose={() => setShowGoalEditor(false)}
        />
      )}
    </div>
  )
}