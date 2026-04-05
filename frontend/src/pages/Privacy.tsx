import { useState, useEffect } from 'react'

const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: { d: React.ReactNode; size?: number; className?: string; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>{d}</svg>
}

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5 transition-all duration-500 ease-out hover:border-forged-purple/20 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>{children}</div>
}

function Toggle({ label, sublabel, value, onChange }: { label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between py-3 border-b border-forged-text2/10 last:border-0 text-left">
      <div>
        <p className="text-sm text-forged-text font-medium">{label}</p>
        {sublabel && <p className="text-[10px] text-forged-text2">{sublabel}</p>}
      </div>
      <div className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5 ${value ? 'bg-forged-purple' : 'bg-forged-surface2 border border-forged-border'}`}>
        <div className={`w-5 h-5 rounded-full transition-all duration-200 shadow-sm ${value ? 'translate-x-5 bg-white' : 'translate-x-0 bg-forged-text2/40'}`} />
      </div>
    </button>
  )
}

export default function PrivacyPage({ onBack }: { onBack: () => void }) {
  const [dataVis, setDataVis] = useState<'private' | 'friends'>('private')
  const [shareProgress, setShareProgress] = useState(false)
  const [activityStatus, setActivityStatus] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all"><Icon d={I.chevL} size={16} /></button>
        <h1 className="text-2xl font-black text-forged-text">Privacy</h1>
      </div>

      <Card delay={60}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-forged-purple/10 flex items-center justify-center"><Icon d={I.lock} size={16} className="text-forged-purple" /></div>
          <p className="text-sm font-black text-forged-text">Data Visibility</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setDataVis('private')} className={`py-3 rounded-xl text-sm font-bold transition-all ${dataVis === 'private' ? 'bg-forged-purple text-white' : 'bg-forged-bg border border-forged-border text-forged-text2'}`}>Private</button>
          <button onClick={() => setDataVis('friends')} className={`py-3 rounded-xl text-sm font-bold transition-all ${dataVis === 'friends' ? 'bg-forged-purple text-white' : 'bg-forged-bg border border-forged-border text-forged-text2'}`}>Friends Only</button>
        </div>
        <Toggle label="Share Progress" sublabel="Allow friends to see your weight and streak" value={shareProgress} onChange={setShareProgress} />
        <Toggle label="Activity Status" sublabel="Show when you're active in the app" value={activityStatus} onChange={setActivityStatus} />
      </Card>

      <Card delay={140}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Your Data</p>
        <p className="text-sm text-forged-text2 mb-3">All your data is stored securely. We never sell your personal information.</p>
        <Row label="Food Logs" value="Encrypted" />
        <Row label="Weight Data" value="Encrypted" />
        <Row label="Workout History" value="Encrypted" />
        <Row label="Progress Photos" value="Local Only" />
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-forged-text2/10 last:border-0">
      <span className="text-sm text-forged-text2">{label}</span>
      <span className="text-sm font-bold text-forged-text">{value}</span>
    </div>
  )
}