import { useState, useEffect } from 'react'
import { api } from '../hooks/api'
import type { DashboardStats, User } from '../types'

interface Props {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: Props) {
  const [tab, setTab] = useState<'home' | 'workout' | 'food' | 'track' | 'profile'>('home')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [dashData, userData] = await Promise.all([
        api.workout.dashboard(),
        api.auth.me()
      ])
      setStats(dashData)
      setUser(userData)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-forged-bg flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-forged-bg pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">FORGED</h1>
          <p className="text-xs text-gray-500">
            {user?.displayName ? `Welcome, ${user.displayName}` : 'Welcome back'}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-gray-500 hover:text-gray-300 transition"
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pt-2">
        {tab === 'home' && <HomeTab stats={stats} onRefresh={loadData} />}
        {tab === 'workout' && <WorkoutTab />}
        {tab === 'food' && <FoodTab />}
        {tab === 'track' && <TrackTab onRefresh={loadData} />}
        {tab === 'profile' && <ProfileTab user={user} onLogout={onLogout} />}
      </div>

      {/* Bottom Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-forged-surface border-t border-forged-border flex">
        {[
          { key: 'home', icon: '🏠', label: 'Home' },
          { key: 'workout', icon: '🏋️', label: 'Workout' },
          { key: 'food', icon: '🍗', label: 'Food' },
          { key: 'track', icon: '📊', label: 'Track' },
          { key: 'profile', icon: '👤', label: 'Profile' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex-1 py-3 text-center ${
              tab === t.key ? 'text-forged-gold' : 'text-gray-600'
            }`}
          >
            <span className="block text-lg">{t.icon}</span>
            <span className="block text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════
// HOME TAB
// ══════════════════════════════════
function HomeTab({ stats, onRefresh }: { stats: DashboardStats | null; onRefresh: () => void }) {
  if (!stats) return <p className="text-gray-500">No data yet</p>

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Current" value={`${stats.currentWeight}`} unit="lbs" color="text-forged-red" />
        <StatCard label="Lost" value={`${stats.weightLost}`} unit="lbs" color="text-forged-green" />
        <StatCard label="Workouts" value={`${stats.totalWorkouts}`} unit="" color="text-forged-blue" />
        <StatCard label="Streak" value={`${stats.currentStreak}`} unit="days" color="text-forged-gold" />
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h2 className="text-xs text-gray-500 uppercase tracking-wide">Quick Actions</h2>
        <QuickAction label="Log Weight" emoji="⚖️" onClick={() => {}} />
        <QuickAction label="Start Workout" emoji="🏋️" onClick={() => {}} />
        <QuickAction label="Log Food" emoji="🍽️" onClick={() => {}} />
        <QuickAction label="Start Fast" emoji="⏱️" onClick={() => {}} />
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="bg-forged-surface border border-forged-border rounded-lg p-4">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>
        {value}<span className="text-xs text-gray-500 font-normal ml-1">{unit}</span>
      </p>
    </div>
  )
}

function QuickAction({ label, emoji, onClick }: { label: string; emoji: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-forged-surface border border-forged-border rounded-lg p-3 hover:border-forged-gold/30 transition text-left"
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-sm text-gray-300">{label}</span>
    </button>
  )
}

// ══════════════════════════════════
// WORKOUT TAB (scaffold)
// ══════════════════════════════════
function WorkoutTab() {
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Workout</h2>
      <p className="text-sm text-gray-500">Workout tracker coming soon — this is where your PPL plan lives</p>
    </div>
  )
}

// ══════════════════════════════════
// FOOD TAB (scaffold)
// ══════════════════════════════════
function FoodTab() {
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Nutrition</h2>
      <p className="text-sm text-gray-500">Food diary, meal plans, and fasting tracker coming soon</p>
    </div>
  )
}

// ══════════════════════════════════
// TRACK TAB
// ══════════════════════════════════
function TrackTab({ onRefresh }: { onRefresh: () => void }) {
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    loadWeights()
  }, [])

  const loadWeights = async () => {
    try {
      const data = await api.weight.getAll(30)
      setEntries(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLog = async () => {
    const w = parseFloat(weight)
    if (!w || w < 50 || w > 500) return

    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await api.weight.add({ weight: w, date: today, notes: notes || undefined })
      setWeight('')
      setNotes('')
      await loadWeights()
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Track Weight</h2>

      {/* Log Weight */}
      <div className="bg-forged-surface border border-forged-border rounded-lg p-4 space-y-3">
        <input
          type="number"
          step="0.1"
          placeholder="e.g. 274.2"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          className="w-full px-4 py-3 bg-forged-bg border border-forged-border rounded-lg text-white text-sm focus:border-forged-gold transition"
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-4 py-3 bg-forged-bg border border-forged-border rounded-lg text-white text-sm focus:border-forged-gold transition"
        />
        <button
          onClick={handleLog}
          disabled={saving}
          className="w-full py-3 bg-forged-red text-white font-semibold rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Log Weight'}
        </button>
      </div>

      {/* History */}
      <div className="bg-forged-surface border border-forged-border rounded-lg p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-3">History</p>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500">No entries yet</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry: any) => (
              <div key={entry.id} className="flex justify-between py-2 border-b border-forged-border">
                <span className="text-sm text-gray-400">{entry.date}</span>
                <span className="text-sm font-semibold text-white">{entry.weight} lbs</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════
// PROFILE TAB
// ══════════════════════════════════
function ProfileTab({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Profile</h2>

      <div className="bg-forged-surface border border-forged-border rounded-lg p-4 space-y-3">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Username</p>
          <p className="text-sm text-white">{user?.username}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Email</p>
          <p className="text-sm text-white">{user?.email}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Starting Weight</p>
          <p className="text-sm text-white">{user?.startingWeight ?? 'Not set'} lbs</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Goal Weight</p>
          <p className="text-sm text-white">{user?.goalWeight ?? 'Not set'} lbs</p>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full py-3 bg-forged-surface border border-forged-border text-gray-400 font-semibold rounded-lg text-sm hover:border-forged-red/30 hover:text-forged-red transition"
      >
        Sign Out
      </button>
    </div>
  )
}