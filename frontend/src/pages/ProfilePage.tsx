import { useState, useEffect } from 'react'
import { api } from '../hooks/api'
import { useTheme } from '../hooks/useTheme'
import type { User } from '../types'

// ══════════════════════════════════
// ICONS
// ══════════════════════════════════
const I = {
  edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  scale: <><path d="M8 21h8"/><path d="M12 17V3"/><path d="M2 11h4l2-4 4 8 4-8 2 4h4"/></>,
  flame: <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.39-2.35 1-3.5.33.43.67.77 1.5 1.5z"/></>,
  user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
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

// ══════════════════════════════════
// SHARED UI
// ══════════════════════════════════
function Card({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5
      transition-all duration-500 ease-out hover:border-forged-purple/20
      ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

// ══════════════════════════════════
// GOALS — stored in localStorage
// ══════════════════════════════════
interface UserGoals {
  goalType: 'cut' | 'bulk' | 'maintain'
  targetWeight: string
  dailyCalories: string
  protein: string
  carbs: string
  fat: string
}

const GOALS_KEY = 'forged_goals'
const defaultGoals: UserGoals = {
  goalType: 'cut', targetWeight: '', dailyCalories: '2400',
  protein: '180', carbs: '250', fat: '65',
}

function loadGoals(): UserGoals {
  try { return { ...defaultGoals, ...JSON.parse(localStorage.getItem(GOALS_KEY) || '{}') } }
  catch { return defaultGoals }
}
function saveGoals(g: UserGoals) { localStorage.setItem(GOALS_KEY, JSON.stringify(g)) }

// ══════════════════════════════════
// PROFILE PAGE
// ══════════════════════════════════
export default function ProfilePage({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const [editingProfile, setEditingProfile] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Goals
  const [goals, setGoals] = useState<UserGoals>(loadGoals)
  const [editingGoals, setEditingGoals] = useState(false)
  const [goalDraft, setGoalDraft] = useState<UserGoals>(goals)

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await api.auth.updateProfile({ displayName: displayName || undefined })
      setEditingProfile(false)
    } catch (e) { console.error(e) }
    finally { setSavingProfile(false) }
  }

  const handleSaveGoals = () => {
    setGoals(goalDraft)
    saveGoals(goalDraft)
    setEditingGoals(false)
  }

  const initial = (user?.displayName || user?.username || '?')[0].toUpperCase()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black text-forged-text">Profile</h1>

      {/* ── User Info ── */}
      <Card delay={60}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-forged-purple/20 border-2 border-forged-purple
            flex items-center justify-center shadow-lg shadow-forged-purple/10 flex-shrink-0">
            <span className="text-2xl font-black text-forged-purple">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <div className="flex flex-col gap-2">
                <input type="text" value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="px-3 py-2 bg-forged-bg border border-forged-border rounded-lg
                    text-forged-text text-sm focus:border-forged-purple/50 transition-colors" />
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} disabled={savingProfile}
                    className="px-4 py-1.5 bg-forged-purple text-white font-bold rounded-lg text-xs
                      hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                    {savingProfile ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditingProfile(false); setDisplayName(user?.displayName || '') }}
                    className="px-3 py-1.5 text-xs text-forged-text2 hover:text-forged-text transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black text-forged-text truncate">
                    {user?.displayName || user?.username}
                  </p>
                  <button onClick={() => setEditingProfile(true)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center
                      text-forged-text2 hover:text-forged-purple hover:bg-forged-purple/10 transition-all">
                    <Icon d={I.edit} size={13} />
                  </button>
                </div>
                <p className="text-sm text-forged-text2">{user?.email}</p>
              </>
            )}
          </div>
        </div>

        {/* User stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-forged-text2/10">
          <div className="text-center">
            <p className="text-[10px] text-forged-text2 font-bold uppercase">Height</p>
            <p className="text-sm font-black text-forged-text mt-0.5">
              {user?.heightInches ? `${Math.floor(user.heightInches / 12)}'${Math.round(user.heightInches % 12)}"` : 'Not set'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-forged-text2 font-bold uppercase">Starting</p>
            <p className="text-sm font-black text-forged-text mt-0.5">
              {user?.startingWeight ? `${user.startingWeight} lbs` : 'Not set'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-forged-text2 font-bold uppercase">Goal</p>
            <p className="text-sm font-black text-forged-text mt-0.5">
              {user?.goalWeight ? `${user.goalWeight} lbs` : 'Not set'}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Goals ── */}
      <Card delay={140}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-forged-purple/10 flex items-center justify-center">
              <Icon d={I.target} size={16} className="text-forged-purple" />
            </div>
            <p className="text-sm font-black text-forged-text">Goals</p>
          </div>
          <button onClick={() => { if (editingGoals) handleSaveGoals(); else { setGoalDraft(goals); setEditingGoals(true) } }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95
              ${editingGoals
                ? 'bg-forged-green text-white hover:brightness-110'
                : 'text-forged-purple hover:bg-forged-purple/10'}`}>
            {editingGoals ? 'Save' : 'Edit'}
          </button>
        </div>

        {editingGoals ? (
          <div className="flex flex-col gap-3">
            {/* Goal type */}
            <div>
              <label className="text-[10px] text-forged-text2 font-bold uppercase block mb-1.5">Goal Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cut', 'bulk', 'maintain'] as const).map(gt => (
                  <button key={gt} onClick={() => setGoalDraft({ ...goalDraft, goalType: gt })}
                    className={`py-2.5 rounded-xl text-sm font-bold capitalize transition-all
                      ${goalDraft.goalType === gt
                        ? 'bg-forged-purple text-white'
                        : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text hover:border-forged-purple/30'}`}>
                    {gt === 'cut' ? 'Cut' : gt === 'bulk' ? 'Bulk' : 'Maintain'}
                  </button>
                ))}
              </div>
            </div>

            {/* Target weight */}
            <div>
              <label className="text-[10px] text-forged-text2 font-bold uppercase block mb-1">Target Weight (lbs)</label>
              <input type="number" value={goalDraft.targetWeight}
                onChange={e => setGoalDraft({ ...goalDraft, targetWeight: e.target.value })}
                placeholder="e.g. 175"
                className="w-full px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
                  text-forged-text text-sm placeholder:text-forged-text2
                  focus:border-forged-purple/50 transition-colors" />
            </div>

            {/* Daily calories */}
            <div>
              <label className="text-[10px] text-forged-text2 font-bold uppercase block mb-1">Daily Calorie Target</label>
              <input type="number" value={goalDraft.dailyCalories}
                onChange={e => setGoalDraft({ ...goalDraft, dailyCalories: e.target.value })}
                placeholder="e.g. 2400"
                className="w-full px-3 py-2.5 bg-forged-bg border border-forged-border rounded-xl
                  text-forged-text text-sm placeholder:text-forged-text2
                  focus:border-forged-purple/50 transition-colors" />
            </div>

            {/* Macro targets */}
            <div>
              <label className="text-[10px] text-forged-text2 font-bold uppercase block mb-1.5">Macro Targets (grams)</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-forged-text2 font-bold block mb-0.5">Protein</label>
                  <input type="number" value={goalDraft.protein}
                    onChange={e => setGoalDraft({ ...goalDraft, protein: e.target.value })}
                    className="w-full px-2 py-2 bg-forged-bg border border-forged-border rounded-lg
                      text-forged-text text-sm text-center focus:border-forged-purple/50 transition-colors" />
                </div>
                <div>
                  <label className="text-[9px] text-forged-text2 font-bold block mb-0.5">Carbs</label>
                  <input type="number" value={goalDraft.carbs}
                    onChange={e => setGoalDraft({ ...goalDraft, carbs: e.target.value })}
                    className="w-full px-2 py-2 bg-forged-bg border border-forged-border rounded-lg
                      text-forged-text text-sm text-center focus:border-forged-purple/50 transition-colors" />
                </div>
                <div>
                  <label className="text-[9px] text-forged-text2 font-bold block mb-0.5">Fat</label>
                  <input type="number" value={goalDraft.fat}
                    onChange={e => setGoalDraft({ ...goalDraft, fat: e.target.value })}
                    className="w-full px-2 py-2 bg-forged-bg border border-forged-border rounded-lg
                      text-forged-text text-sm text-center focus:border-forged-purple/50 transition-colors" />
                </div>
              </div>
            </div>

            <button onClick={() => { setEditingGoals(false); setGoalDraft(goals) }}
              className="text-xs text-forged-text2 hover:text-forged-text transition-colors font-bold self-start">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Goal type badge */}
            <div className="flex items-center justify-between py-2 border-b border-forged-text2/10">
              <span className="text-sm text-forged-text2">Goal Type</span>
              <span className={`text-xs font-black px-3 py-1 rounded-full capitalize
                ${goals.goalType === 'cut' ? 'bg-forged-red/10 text-forged-red' :
                  goals.goalType === 'bulk' ? 'bg-forged-green/10 text-forged-green' :
                  'bg-forged-blue/10 text-forged-blue'}`}>
                {goals.goalType}
              </span>
            </div>
            <GoalRow label="Target Weight" value={goals.targetWeight ? `${goals.targetWeight} lbs` : 'Not set'} />
            <GoalRow label="Daily Calories" value={`${goals.dailyCalories} cal`} />
            <GoalRow label="Protein" value={`${goals.protein}g`} />
            <GoalRow label="Carbs" value={`${goals.carbs}g`} />
            <GoalRow label="Fat" value={`${goals.fat}g`} />
          </div>
        )}
      </Card>

      {/* ── Preferences ── */}
      <Card delay={220}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-forged-purple/10 flex items-center justify-center">
            <Icon d={I.settings} size={16} className="text-forged-purple" />
          </div>
          <p className="text-sm font-black text-forged-text">Preferences</p>
        </div>

        {/* Theme */}
        <button onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-xl
            bg-forged-bg border border-forged-border
            hover:border-forged-purple/30 transition-all mb-2">
          <div className="flex items-center gap-3">
            <Icon d={theme === 'dark' ? I.moon : I.sun} size={18} className="text-forged-text2" />
            <span className="text-sm text-forged-text font-medium">Theme</span>
          </div>
          <span className="text-xs text-forged-text2 font-bold capitalize">{theme}</span>
        </button>

        {/* Units */}
        <div className="flex items-center justify-between p-3 rounded-xl
          bg-forged-bg border border-forged-border">
          <div className="flex items-center gap-3">
            <Icon d={I.scale} size={18} className="text-forged-text2" />
            <span className="text-sm text-forged-text font-medium">Units</span>
          </div>
          <span className="text-xs text-forged-text2 font-bold">lbs / oz</span>
        </div>
      </Card>

      {/* ── Account ── */}
      <Card delay={300}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-forged-purple/10 flex items-center justify-center">
            <Icon d={I.lock} size={16} className="text-forged-purple" />
          </div>
          <p className="text-sm font-black text-forged-text">Account</p>
        </div>

        <div className="flex flex-col gap-2">
          <button className="w-full flex items-center justify-between p-3 rounded-xl
            bg-forged-bg border border-forged-border
            hover:border-forged-purple/30 transition-all text-left">
            <div className="flex items-center gap-3">
              <Icon d={I.lock} size={16} className="text-forged-text2" />
              <span className="text-sm text-forged-text font-medium">Change Password</span>
            </div>
            <span className="text-xs text-forged-text2">→</span>
          </button>

          <button onClick={onLogout}
            className="w-full flex items-center justify-between p-3 rounded-xl
              bg-forged-bg border border-forged-border
              hover:border-forged-red/30 transition-all text-left group">
            <div className="flex items-center gap-3">
              <Icon d={I.logout} size={16} className="text-forged-text2 group-hover:text-forged-red transition-colors" />
              <span className="text-sm text-forged-text font-medium group-hover:text-forged-red transition-colors">Sign Out</span>
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-3 rounded-xl
            bg-forged-bg border border-forged-border
            hover:border-forged-red/30 transition-all text-left group mt-2">
            <div className="flex items-center gap-3">
              <Icon d={I.trash} size={16} className="text-forged-text2 group-hover:text-forged-red transition-colors" />
              <span className="text-sm text-forged-text2 font-medium group-hover:text-forged-red transition-colors">Delete Account</span>
            </div>
          </button>
        </div>
      </Card>

      {/* ── App Info ── */}
      <div className="text-center py-2">
        <p className="text-[10px] text-forged-text2">FORGED v1.0.0</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// GOAL ROW
// ══════════════════════════════════
function GoalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-forged-text2/10 last:border-0">
      <span className="text-sm text-forged-text2">{label}</span>
      <span className="text-sm font-bold text-forged-text">{value}</span>
    </div>
  )
}