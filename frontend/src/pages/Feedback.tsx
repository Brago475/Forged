import { useState, useEffect } from 'react'

const I = {
  chevL: <><path d="M15 18l-6-6 6-6"/></>,
  send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  bug: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
}

function Icon({ d, size = 20, className = '', sw = 1.8 }: { d: React.ReactNode; size?: number; className?: string; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>{d}</svg>
}

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [v, setV] = useState(false)
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t) }, [delay])
  return <div className={`bg-forged-surface border border-forged-border rounded-2xl p-5 transition-all duration-500 ease-out hover:border-forged-purple/20 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>{children}</div>
}

interface FeedbackEntry { id: string; type: string; message: string; date: string }
const FB_KEY = 'forged_feedback'
function loadFeedback(): FeedbackEntry[] { try { return JSON.parse(localStorage.getItem(FB_KEY) || '[]') } catch { return [] } }
function saveFeedback(f: FeedbackEntry[]) { localStorage.setItem(FB_KEY, JSON.stringify(f)) }

export default function FeedbackPage({ onBack }: { onBack: () => void }) {
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [history, setHistory] = useState<FeedbackEntry[]>(loadFeedback)

  const handleSend = () => {
    if (!message.trim()) return
    const entry: FeedbackEntry = {
      id: crypto.randomUUID(),
      type,
      message: message.trim(),
      date: new Date().toISOString(),
    }
    const next = [entry, ...history]
    setHistory(next)
    saveFeedback(next)
    setMessage('')
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const typeConfig = {
    bug: { label: 'Bug Report', icon: I.bug, color: 'text-forged-red', bg: 'bg-forged-red/10' },
    feature: { label: 'Feature Request', icon: I.zap, color: 'text-forged-purple', bg: 'bg-forged-purple/10' },
    general: { label: 'General Feedback', icon: I.heart, color: 'text-forged-green', bg: 'bg-forged-green/10' },
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-forged-surface border border-forged-border flex items-center justify-center text-forged-text2 hover:text-forged-text active:scale-95 transition-all">
          <Icon d={I.chevL} size={16} />
        </button>
        <h1 className="text-2xl font-black text-forged-text">Feedback</h1>
      </div>

      <Card delay={60}>
        <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Send Feedback</p>

        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['bug', 'feature', 'general'] as const).map(t => {
            const cfg = typeConfig[t]
            return (
              <button key={t} onClick={() => setType(t)}
                className={`py-3 rounded-xl flex flex-col items-center gap-1.5 transition-all
                  ${type === t
                    ? 'bg-forged-purple text-white border border-forged-purple'
                    : 'bg-forged-bg border border-forged-border text-forged-text2 hover:text-forged-text'}`}>
                <Icon d={cfg.icon} size={16} sw={2} />
                <span className="text-[10px] font-bold">{cfg.label}</span>
              </button>
            )
          })}
        </div>

        {/* Message */}
        <textarea placeholder={
          type === 'bug' ? 'Describe the bug. What happened? What did you expect?'
            : type === 'feature' ? 'What feature would you like to see? How would it help?'
            : 'Share your thoughts about the app...'
        }
          value={message} onChange={e => setMessage(e.target.value)} rows={5}
          className="w-full px-4 py-3 bg-forged-bg border border-forged-border rounded-xl
            text-forged-text text-sm placeholder:text-forged-text2
            focus:border-forged-purple/50 transition-colors resize-none mb-3" />

        {/* Send button */}
        <button onClick={handleSend} disabled={!message.trim()}
          className={`w-full py-3 rounded-xl font-black text-sm transition-all
            flex items-center justify-center gap-2 disabled:opacity-50
            ${sent
              ? 'bg-forged-green text-white'
              : 'bg-forged-purple text-white hover:brightness-110 active:scale-[0.98]'}`}>
          {sent ? (
            <><Icon d={I.check} size={16} sw={2.5} /> Sent! Thank you</>
          ) : (
            <><Icon d={I.send} size={16} sw={2} /> Send Feedback</>
          )}
        </button>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card delay={140}>
          <p className="text-[11px] font-bold text-forged-text2 uppercase tracking-widest mb-3">Previous Feedback</p>
          <div className="flex flex-col max-h-64 overflow-y-auto">
            {history.map(entry => {
              const cfg = typeConfig[entry.type as keyof typeof typeConfig] || typeConfig.general
              return (
                <div key={entry.id} className="py-3 border-b border-forged-text2/10 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-forged-text2">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-forged-text">{entry.message}</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Info */}
      <Card delay={220}>
        <p className="text-xs text-forged-text2 text-center">
          Feedback is stored locally for now. In the future, it will be sent directly to the dev team.
        </p>
        <p className="text-[10px] text-forged-text2 text-center mt-2">
          FORGED v1.0.0 &middot; Built by TCW Studio
        </p>
      </Card>
    </div>
  )
}