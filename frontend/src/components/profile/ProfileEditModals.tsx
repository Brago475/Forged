import { useRef, useState } from 'react'
import {
  type ProfileExtras,
  type ActivityLevel,
  type GoalType,
  type WorkoutStyle,
  type Sex,
  GOAL_TYPE_LABEL,
  ACTIVITY_LEVEL_LABEL,
  ACTIVITY_LEVEL_DESC,
  WORKOUT_STYLE_LABEL,
  COMMON_DIETARY,
  COMMON_ALLERGENS,
} from './profileStorage'

// ══════════════════════════════════
// SHARED MODAL SHELL
// ══════════════════════════════════
function ModalShell({ title, subtitle, onClose, onSave, children }: {
  title: string
  subtitle?: string
  onClose: () => void
  onSave: () => void
  children: React.ReactNode
}) {
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
            <h2 className="text-lg font-black text-forged-text">{title}</h2>
            {subtitle && <p className="text-[11px] text-forged-text2">{subtitle}</p>}
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

        {children}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-black
              bg-forged-surface2 text-forged-text2 border border-forged-border
              hover:text-forged-text active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white
              bg-forged-purple hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// EDIT BIO (avatar, display name, bio)
// ══════════════════════════════════
export function EditBioModal({ initial, initialDisplayName, onSave, onClose }: {
  initial: ProfileExtras
  initialDisplayName: string
  onSave: (next: ProfileExtras, displayName: string) => void
  onClose: () => void
}) {
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(initial.avatarDataUrl)
  const [bio, setBio] = useState<string>(initial.bio ?? '')
  const [displayName, setDisplayName] = useState<string>(initialDisplayName)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      alert('Keep avatar under 3MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarDataUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (): void => {
    onSave({ ...initial, avatarDataUrl, bio: bio.trim() || undefined }, displayName.trim())
    onClose()
  }

  const initialLetter = (displayName || '?').trim()[0]?.toUpperCase() ?? '?'

  return (
    <ModalShell title="Edit Profile" subtitle="Photo, name, and bio" onClose={onClose} onSave={handleSave}>
      <div className="flex flex-col items-center gap-3 mb-5">
        <div className="relative">
          {avatarDataUrl ? (
            <img src={avatarDataUrl} alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-forged-purple" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-forged-purple/20 border-2 border-forged-purple
              flex items-center justify-center">
              <span className="text-4xl font-black text-forged-purple">{initialLetter}</span>
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-forged-purple text-white
              flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        {avatarDataUrl && (
          <button
            onClick={() => setAvatarDataUrl(undefined)}
            className="text-[10px] text-forged-red font-bold"
          >
            Remove photo
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">Display name</label>
          <input
            type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-forged-bg border border-forged-border
              rounded-lg text-forged-text text-sm
              focus:border-forged-purple/50 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">
            Bio <span className="text-forged-text2 font-normal normal-case">({bio.length}/160)</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            placeholder="A short line about you"
            rows={3}
            className="w-full mt-1 px-3 py-2 bg-forged-bg border border-forged-border
              rounded-lg text-forged-text text-sm resize-none
              focus:border-forged-purple/50 outline-none transition-colors"
          />
        </div>
      </div>
    </ModalShell>
  )
}

// ══════════════════════════════════
// EDIT VITALS (age, sex, height, weight)
// ══════════════════════════════════
export function EditVitalsModal({ initial, onSave, onClose }: {
  initial: ProfileExtras & { heightInches?: number; currentWeight?: number }
  onSave: (next: { age?: number; sex?: Sex; heightInches?: number }) => void
  onClose: () => void
}) {
  const [age, setAge] = useState<string>(initial.age?.toString() ?? '')
  const [sex, setSex] = useState<Sex | ''>(initial.sex ?? '')
  const startFeet = initial.heightInches ? Math.floor(initial.heightInches / 12) : 0
  const startInches = initial.heightInches ? Math.round(initial.heightInches % 12) : 0
  const [feet, setFeet] = useState<string>(startFeet > 0 ? startFeet.toString() : '')
  const [inches, setInches] = useState<string>(startInches > 0 ? startInches.toString() : '')

  const handleSave = (): void => {
    const heightInches = feet || inches
      ? (parseInt(feet || '0') || 0) * 12 + (parseInt(inches || '0') || 0)
      : undefined
    onSave({
      age: age ? parseInt(age) : undefined,
      sex: sex || undefined,
      heightInches,
    })
    onClose()
  }

  return (
    <ModalShell title="Vitals" subtitle="Age, sex, height" onClose={onClose} onSave={handleSave}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">Age</label>
            <input
              type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 25"
              className="w-full mt-1 px-3 py-2 bg-forged-bg border border-forged-border
                rounded-lg text-forged-text text-sm tabular-nums
                focus:border-forged-purple/50 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">Sex</label>
            <select
              value={sex} onChange={(e) => setSex(e.target.value as Sex)}
              className="w-full mt-1 px-3 py-2 bg-forged-bg border border-forged-border
                rounded-lg text-forged-text text-sm
                focus:border-forged-purple/50 outline-none transition-colors"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">Height</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="relative">
              <input
                type="number" inputMode="numeric" value={feet} onChange={(e) => setFeet(e.target.value)}
                placeholder="5"
                className="w-full px-3 py-2 pr-8 bg-forged-bg border border-forged-border
                  rounded-lg text-forged-text text-sm tabular-nums
                  focus:border-forged-purple/50 outline-none transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-forged-text2 font-bold">ft</span>
            </div>
            <div className="relative">
              <input
                type="number" inputMode="numeric" value={inches} onChange={(e) => setInches(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 pr-8 bg-forged-bg border border-forged-border
                  rounded-lg text-forged-text text-sm tabular-nums
                  focus:border-forged-purple/50 outline-none transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-forged-text2 font-bold">in</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-forged-text2">
          Starting weight and goal weight live on the Progress page under Body Goals.
        </p>
      </div>
    </ModalShell>
  )
}

// ══════════════════════════════════
// EDIT LIFESTYLE (goal type, activity, workout style, workouts/week)
// ══════════════════════════════════
export function EditLifestyleModal({ initial, onSave, onClose }: {
  initial: ProfileExtras
  onSave: (next: Partial<ProfileExtras>) => void
  onClose: () => void
}) {
  const [goalType, setGoalType] = useState<GoalType | ''>(initial.goalType ?? '')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>(initial.activityLevel ?? '')
  const [workoutStyle, setWorkoutStyle] = useState<WorkoutStyle | ''>(initial.workoutStyle ?? '')
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState<string>(initial.workoutsPerWeekTarget?.toString() ?? '')

  const handleSave = (): void => {
    onSave({
      goalType: goalType || undefined,
      activityLevel: activityLevel || undefined,
      workoutStyle: workoutStyle || undefined,
      workoutsPerWeekTarget: workoutsPerWeek ? parseInt(workoutsPerWeek) : undefined,
    })
    onClose()
  }

  return (
    <ModalShell title="Lifestyle" subtitle="Goals, activity, training style" onClose={onClose} onSave={handleSave}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-1 block">Goal type</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(GOAL_TYPE_LABEL) as GoalType[]).map(g => (
              <button
                key={g} onClick={() => setGoalType(g)}
                className={`py-2 rounded-xl text-xs font-bold transition-all
                  ${goalType === g
                    ? 'bg-forged-purple text-white'
                    : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text hover:border-forged-purple/30'}`}
              >
                {GOAL_TYPE_LABEL[g]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-1 block">Activity level</label>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(ACTIVITY_LEVEL_LABEL) as ActivityLevel[]).map(a => (
              <button
                key={a} onClick={() => setActivityLevel(a)}
                className={`text-left py-2 px-3 rounded-xl transition-all
                  ${activityLevel === a
                    ? 'bg-forged-purple/10 border border-forged-purple'
                    : 'bg-forged-bg border border-forged-border hover:border-forged-purple/30'}`}
              >
                <p className={`text-xs font-bold ${activityLevel === a ? 'text-forged-purple' : 'text-forged-text'}`}>
                  {ACTIVITY_LEVEL_LABEL[a]}
                </p>
                <p className="text-[10px] text-forged-text2 mt-0.5">{ACTIVITY_LEVEL_DESC[a]}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-1 block">Workout style</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(WORKOUT_STYLE_LABEL) as WorkoutStyle[]).map(s => (
              <button
                key={s} onClick={() => setWorkoutStyle(s)}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all
                  ${workoutStyle === s
                    ? 'bg-forged-purple text-white'
                    : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text hover:border-forged-purple/30'}`}
              >
                {WORKOUT_STYLE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">Workouts per week target</label>
          <input
            type="number" inputMode="numeric" min="0" max="14"
            value={workoutsPerWeek} onChange={(e) => setWorkoutsPerWeek(e.target.value)}
            placeholder="e.g. 5"
            className="w-full mt-1 px-3 py-2 bg-forged-bg border border-forged-border
              rounded-lg text-forged-text text-sm tabular-nums
              focus:border-forged-purple/50 outline-none transition-colors"
          />
        </div>
      </div>
    </ModalShell>
  )
}

// ══════════════════════════════════
// EDIT HEALTH (dietary, allergens, medical notes)
// ══════════════════════════════════
export function EditHealthModal({ initial, onSave, onClose }: {
  initial: ProfileExtras
  onSave: (next: Partial<ProfileExtras>) => void
  onClose: () => void
}) {
  const [dietary, setDietary] = useState<string[]>(initial.dietaryRestrictions ?? [])
  const [allergens, setAllergens] = useState<string[]>(initial.allergens ?? [])
  const [notes, setNotes] = useState<string>(initial.medicalNotes ?? '')

  const toggle = (list: string[], setter: (l: string[]) => void, item: string): void => {
    setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  const handleSave = (): void => {
    onSave({
      dietaryRestrictions: dietary.length > 0 ? dietary : undefined,
      allergens: allergens.length > 0 ? allergens : undefined,
      medicalNotes: notes.trim() || undefined,
    })
    onClose()
  }

  return (
    <ModalShell title="Health" subtitle="Diet, allergens, notes" onClose={onClose} onSave={handleSave}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-1.5 block">
            Dietary preferences
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_DIETARY.map(d => (
              <button
                key={d} onClick={() => toggle(dietary, setDietary, d)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all
                  ${dietary.includes(d)
                    ? 'bg-forged-purple text-white'
                    : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text hover:border-forged-purple/30'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider mb-1.5 block">
            Allergens to avoid
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_ALLERGENS.map(a => (
              <button
                key={a} onClick={() => toggle(allergens, setAllergens, a)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all
                  ${allergens.includes(a)
                    ? 'bg-forged-red text-white'
                    : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text hover:border-forged-red/30'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-forged-text2 uppercase tracking-wider">
            Medical notes <span className="text-forged-text2 font-normal normal-case">(private)</span>
          </label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            placeholder="Injuries, conditions, anything else to remember"
            rows={3}
            className="w-full mt-1 px-3 py-2 bg-forged-bg border border-forged-border
              rounded-lg text-forged-text text-sm resize-none
              focus:border-forged-purple/50 outline-none transition-colors"
          />
          <p className="text-[9px] text-forged-text2 mt-1">Stored locally on your device.</p>
        </div>
      </div>
    </ModalShell>
  )
}