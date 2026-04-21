import { useState, useEffect } from 'react'
import { api } from '../hooks/api'
import type { User } from '../types'
import { useLoadingEffect } from '../hooks/useLoading'
import {
  loadProfileExtras,
  saveProfileExtras,
  computeAchievements,
  GOAL_TYPE_LABEL,
  ACTIVITY_LEVEL_LABEL,
  WORKOUT_STYLE_LABEL,
  type ProfileExtras,
  type Sex,
} from '../components/profile/profileStorage'
import {
  EditBioModal,
  EditVitalsModal,
  EditLifestyleModal,
  EditHealthModal,
} from '../components/profile/ProfileEditModals'
import { GoalEditorModal } from '../components/food/GoalEditorModal'
import { loadGoals as loadFoodGoals, saveGoals as saveFoodGoals, type FoodGoals } from '../components/food/goalStorage'
import { BodyGoalsModal } from '../components/progress/BodyGoalsModal'
import { loadBodyGoals, saveBodyGoals, type BodyGoals } from '../components/progress/bodyGoalsStorage'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
  pulse: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: {
  d: React.ReactNode; size?: number; className?: string; sw?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
      strokeLinejoin="round" className={className}>{d}</svg>
  )
}

function Card({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const [v, setV] = useState<boolean>(false)
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5
      transition-all duration-500 ease-out hover:border-forged-purple/20
      ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

// ══════════════════════════════════
// PROFILE PAGE
// ══════════════════════════════════
export default function ProfilePage({ user: initialUser, onLogout: _onLogout }: {
  user: User | null
  onLogout: () => void
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [extras, setExtras] = useState<ProfileExtras>(loadProfileExtras)
  const [foodGoals, setFoodGoals] = useState<FoodGoals>(loadFoodGoals)
  const [bodyGoals, setBodyGoals] = useState<BodyGoals>(loadBodyGoals)
  const [dashStats, setDashStats] = useState<any>(null)

  // Modal state
  const [modal, setModal] = useState <
    'bio' | 'vitals' | 'lifestyle' | 'health' | 'foodGoals' | 'bodyGoals' | null
  >(null)

  useLoadingEffect(async () => {
    const d = await api.workout.dashboard()
    setDashStats(d)
  }, [])

  // ── Handlers ──

  const handleBioSave = async (next: ProfileExtras, displayName: string): Promise<void> => {
    setExtras(next)
    saveProfileExtras(next)
    if (displayName && displayName !== user?.displayName) {
      try {
        const updated = await api.auth.updateProfile({ displayName })
        setUser(updated ?? (user ? { ...user, displayName } : null))
      } catch (e) { console.error(e) }
    }
  }

  const handleExtrasPatch = (patch: Partial<ProfileExtras>): void => {
    const next = { ...extras, ...patch }
    setExtras(next)
    saveProfileExtras(next)
  }

  const handleVitalsSave = async (next: { age?: number; sex?: Sex; heightInches?: number }): Promise<void> => {
    handleExtrasPatch({ age: next.age, sex: next.sex })
    if (next.heightInches !== undefined && next.heightInches !== user?.heightInches) {
      try {
        const updated = await api.auth.updateProfile({ heightInches: next.heightInches })
        setUser(updated ?? (user ? { ...user, heightInches: next.heightInches } : null))
      } catch {
        if (user) setUser({ ...user, heightInches: next.heightInches })
      }
    }
  }

  const handleFoodGoalsSave = (next: FoodGoals): void => {
    setFoodGoals(next)
    saveFoodGoals(next)
  }

  const handleBodyGoalsSave = (next: BodyGoals): void => {
    setBodyGoals(next)
    saveBodyGoals(next)
  }

  // ── Computed ──

  const displayName = user?.displayName || user?.username || 'Athlete'
  const initialLetter = displayName[0]?.toUpperCase() ?? '?'
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '--'

  const heightDisplay = user?.heightInches
    ? `${Math.floor(user.heightInches / 12)}'${Math.round(user.heightInches % 12)}"`
    : 'Not set'
  const ageDisplay = extras.age ? `${extras.age}` : 'Not set'
  const currentWeight = dashStats?.currentWeight ?? 0
  const startWeight = bodyGoals.startWeight ?? dashStats?.startingWeight ?? 0
  const goalWeight = bodyGoals.goalWeight ?? 0
  const weightDisplay = currentWeight ? `${currentWeight}` : 'Not set'
  const goalWeightDisplay = goalWeight ? `${goalWeight}` : 'Not set'

  const achievementsCtx = {
    workouts: dashStats?.totalWorkouts ?? 0,
    currentStreak: dashStats?.currentStreak ?? 0,
    bestStreak: dashStats?.bestStreak ?? dashStats?.currentStreak ?? 0,
    weightLost: Math.max(0, (startWeight || 0) - (currentWeight || 0)),
    longestFastHours: dashStats?.longestFastHours ?? 0,
    mealsLogged: dashStats?.totalMealsLogged ?? 0,
    daysActive: dashStats?.daysActive ?? 0,
  }
  const achievements = computeAchievements(achievementsCtx)
  const unlocked = achievements.filter(a => a.unlocked).length
  const preview = [...achievements].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0)).slice(0, 6)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black text-forged-text">Profile</h1>

      {/* ── 1. Hero ── */}
      <Card delay={60} className="!p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forged-purple/[0.07] via-transparent to-forged-purple/[0.03] pointer-events-none" />
        <div className="relative flex items-start gap-4">
          {extras.avatarDataUrl ? (
            <img src={extras.avatarDataUrl} alt={displayName}
              className="w-20 h-20 rounded-full object-cover border-2 border-forged-purple flex-shrink-0
                shadow-lg shadow-forged-purple/20" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-forged-purple/20 border-2 border-forged-purple
              flex items-center justify-center shadow-lg shadow-forged-purple/10 flex-shrink-0">
              <span className="text-3xl font-black text-forged-purple">{initialLetter}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xl font-black text-forged-text truncate">{displayName}</p>
              <button
                onClick={() => setModal('bio')}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-forged-text2
                  hover:text-forged-purple hover:bg-forged-purple/10 transition-all flex-shrink-0"
              >
                <Icon d={I.edit} size={13} />
              </button>
            </div>
            {user?.username && user.username !== user.displayName && (
              <p className="text-xs text-forged-text2">@{user.username}</p>
            )}
            {user?.email && <p className="text-xs text-forged-text2 truncate">{user.email}</p>}
            {extras.bio ? (
              <p className="text-sm text-forged-text mt-2 leading-snug">{extras.bio}</p>
            ) : (
              <button
                onClick={() => setModal('bio')}
                className="text-xs text-forged-purple font-bold mt-2 hover:brightness-110"
              >
                + Add a bio
              </button>
            )}
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="relative grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-forged-border">
          <HeroStat value={memberSince} label="Joined" />
          <HeroStat value={dashStats?.totalWorkouts ?? 0} label="Workouts" />
          <HeroStat value={dashStats?.totalMealsLogged ?? 0} label="Meals" />
          <HeroStat value={dashStats?.currentStreak ?? 0} label="Streak" />
        </div>
      </Card>

      {/* ── 2. Vitals ── */}
      <Card delay={130}>
        <SectionHeader icon={I.user} title="Vitals" onEdit={() => setModal('vitals')} />
        <div className="grid grid-cols-4 gap-3 mt-3">
          <VitalCell label="Age" value={ageDisplay} />
          <VitalCell label="Sex" value={extras.sex ? extras.sex.replace('_', ' ') : 'Not set'} />
          <VitalCell label="Height" value={heightDisplay} />
          <VitalCell label="Weight" value={weightDisplay} unit={currentWeight ? 'lbs' : ''} />
        </div>
      </Card>

      {/* ── 3. Lifestyle ── */}
      <Card delay={200}>
        <SectionHeader icon={I.pulse} title="Lifestyle" onEdit={() => setModal('lifestyle')} />
        <div className="flex flex-col gap-2 mt-2">
          <LifestyleRow label="Goal type" value={extras.goalType ? GOAL_TYPE_LABEL[extras.goalType] : 'Not set'} />
          <LifestyleRow label="Activity level" value={extras.activityLevel ? ACTIVITY_LEVEL_LABEL[extras.activityLevel] : 'Not set'} />
          <LifestyleRow label="Workout style" value={extras.workoutStyle ? WORKOUT_STYLE_LABEL[extras.workoutStyle] : 'Not set'} />
          <LifestyleRow label="Weekly target" value={extras.workoutsPerWeekTarget ? `${extras.workoutsPerWeekTarget} workouts` : 'Not set'} />
        </div>
      </Card>

      {/* ── 4. Nutrition & Body Goals ── */}
      <Card delay={270}>
        <SectionHeader icon={I.target} title="Nutrition & Body Goals" />
        <div className="grid grid-cols-4 gap-2 mt-3">
          <GoalCell label="Cal" value={foodGoals.calories} />
          <GoalCell label="Protein" value={foodGoals.protein} unit="g" />
          <GoalCell label="Carbs" value={foodGoals.carbs} unit="g" />
          <GoalCell label="Fat" value={foodGoals.fat} unit="g" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => setModal('foodGoals')}
            className="py-2.5 rounded-xl text-xs font-black bg-forged-purple/10 text-forged-purple
              border border-forged-purple/20 hover:bg-forged-purple hover:text-white
              active:scale-[0.98] transition-all"
          >
            Edit Nutrition
          </button>
          <button
            onClick={() => setModal('bodyGoals')}
            className="py-2.5 rounded-xl text-xs font-black bg-forged-purple/10 text-forged-purple
              border border-forged-purple/20 hover:bg-forged-purple hover:text-white
              active:scale-[0.98] transition-all"
          >
            Edit Body Goals
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SmallStat label="Start" value={startWeight ? `${startWeight} lbs` : 'Not set'} />
          <SmallStat label="Goal" value={goalWeightDisplay !== 'Not set' ? `${goalWeightDisplay} lbs` : 'Not set'} />
        </div>
      </Card>

      {/* ── 5. Achievements ── */}
      <Card delay={340}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-forged-purple/10 flex items-center justify-center">
              <Icon d={I.trophy} size={16} className="text-forged-purple" />
            </div>
            <p className="text-sm font-black text-forged-text">Achievements</p>
          </div>
          <span className="text-xs font-black text-forged-purple tabular-nums">
            {unlocked} / {achievements.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {preview.map(a => (
            <AchievementTile key={a.id}
              label={a.label}
              iconPath={a.iconPath}
              unlocked={a.unlocked}
              progress={a.progress}
            />
          ))}
        </div>
      </Card>

      {/* ── 6. Health ── */}
      <Card delay={410}>
        <SectionHeader icon={I.heart} title="Health" onEdit={() => setModal('health')} />
        <div className="mt-2">
          <TagSection label="Diet" items={extras.dietaryRestrictions ?? []} empty="No preferences set" color="purple" />
          <TagSection label="Allergens" items={extras.allergens ?? []} empty="None listed" color="red" />
          {extras.medicalNotes && (
            <div className="mt-3 pt-3 border-t border-forged-border">
              <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-xs text-forged-text leading-relaxed">{extras.medicalNotes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* ── MODALS ── */}
      {modal === 'bio' && (
        <EditBioModal
          initial={extras}
          initialDisplayName={user?.displayName || user?.username || ''}
          onSave={handleBioSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'vitals' && (
        <EditVitalsModal
          initial={{ ...extras, heightInches: user?.heightInches, currentWeight }}
          onSave={handleVitalsSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'lifestyle' && (
        <EditLifestyleModal
          initial={extras}
          onSave={handleExtrasPatch}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'health' && (
        <EditHealthModal
          initial={extras}
          onSave={handleExtrasPatch}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'foodGoals' && (
        <GoalEditorModal
          initial={foodGoals}
          onSave={handleFoodGoalsSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'bodyGoals' && (
        <BodyGoalsModal
          initial={bodyGoals}
          firstEntryWeight={startWeight || undefined}
          onSave={handleBodyGoalsSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════
// SUBCOMPONENTS
// ══════════════════════════════════

function SectionHeader({ icon, title, onEdit }: {
  icon: React.ReactNode
  title: string
  onEdit?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-forged-purple/10 flex items-center justify-center">
          <Icon d={icon} size={16} className="text-forged-purple" />
        </div>
        <p className="text-sm font-black text-forged-text">{title}</p>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-xs text-forged-purple font-black hover:text-forged-text transition-colors flex items-center gap-1"
        >
          <Icon d={I.edit} size={11} sw={2} />Edit
        </button>
      )}
    </div>
  )
}

function HeroStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-base font-black text-forged-text tabular-nums">{value}</p>
      <p className="text-[9px] text-forged-text2 font-bold uppercase mt-0.5">{label}</p>
    </div>
  )
}

function VitalCell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  const isSet = value !== 'Not set'
  return (
    <div className="bg-forged-bg rounded-xl p-2.5 text-center">
      <p className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-black tabular-nums mt-1 capitalize ${isSet ? 'text-forged-text' : 'text-forged-text2'}`}>
        {value}
        {unit && <span className="text-[10px] font-medium text-forged-text2 ml-0.5">{unit}</span>}
      </p>
    </div>
  )
}

function LifestyleRow({ label, value }: { label: string; value: string }) {
  const isSet = value !== 'Not set'
  return (
    <div className="flex items-center justify-between py-2 border-b border-forged-border last:border-0">
      <span className="text-xs text-forged-text2 font-bold">{label}</span>
      <span className={`text-xs font-black ${isSet ? 'text-forged-text' : 'text-forged-text2'}`}>
        {value}
      </span>
    </div>
  )
}

function GoalCell({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="bg-forged-bg rounded-xl p-2.5 text-center">
      <p className="text-[9px] font-bold text-forged-text2 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-black text-forged-text tabular-nums mt-1">
        {value}
        {unit && <span className="text-[10px] font-medium text-forged-text2 ml-0.5">{unit}</span>}
      </p>
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  const isSet = value !== 'Not set'
  return (
    <div className="bg-forged-bg rounded-lg px-3 py-2 flex items-center justify-between">
      <span className="text-[10px] text-forged-text2 font-bold uppercase">{label}</span>
      <span className={`text-xs font-black ${isSet ? 'text-forged-text' : 'text-forged-text2'}`}>
        {value}
      </span>
    </div>
  )
}

function AchievementTile({ label, iconPath, unlocked, progress }: {
  label: string
  iconPath: React.ReactNode
  unlocked: boolean
  progress?: string
}) {
  return (
    <div
      className={`rounded-xl p-3 text-center transition-all
        ${unlocked
          ? 'bg-forged-purple/10 border border-forged-purple'
          : 'bg-forged-bg border border-forged-border opacity-60'}`}
      title={progress}
    >
      <div className={`w-9 h-9 rounded-full mx-auto flex items-center justify-center
        ${unlocked ? 'bg-forged-purple text-white' : 'bg-forged-surface2 text-forged-text2'}`}>
        <Icon d={iconPath} size={16} sw={2} />
      </div>
      <p className={`text-[10px] font-black mt-1.5 leading-tight
        ${unlocked ? 'text-forged-text' : 'text-forged-text2'}`}>
        {label}
      </p>
      {!unlocked && progress && (
        <p className="text-[9px] text-forged-text2 mt-0.5 tabular-nums">{progress}</p>
      )}
    </div>
  )
}

function TagSection({ label, items, empty, color }: {
  label: string
  items: string[]
  empty: string
  color: 'purple' | 'red'
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[10px] font-bold text-forged-text2 uppercase tracking-wider mb-1.5">{label}</p>
      {items.length === 0 ? (
        <p className="text-[11px] text-forged-text2">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map(i => (
            <span
              key={i}
              className={`text-[10px] font-black px-2.5 py-1 rounded-full
                ${color === 'purple'
                  ? 'bg-forged-purple/15 text-forged-purple'
                  : 'bg-forged-red/15 text-forged-red'}`}
            >
              {i}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}