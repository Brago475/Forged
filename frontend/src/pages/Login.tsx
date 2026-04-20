import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { api } from '../hooks/api'

interface Props {
  onLogin: (token: string) => void
}

const IMG = {
  hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=85&auto=format&fit=crop',
  training: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1200&q=85&auto=format&fit=crop',
  nutrition: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=85&auto=format&fit=crop',
  transformation: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&q=85&auto=format&fit=crop',
}

export default function Login({ onLogin }: Props) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return isMobile ? <MobileLogin onLogin={onLogin} /> : <WebLanding onLogin={onLogin} />
}

// ══════════════════════════════════════════════════════════════════════
// MOBILE
// ══════════════════════════════════════════════════════════════════════
function MobileLogin({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const result = await api.auth.login({ email, password })
      localStorage.setItem('forged_user', JSON.stringify(result.user))
      onLogin(result.token)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-[#0f0a1f] flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(159,122,234,0.25) 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, rgba(212,168,83,0.12) 0%, transparent 60%)'
        }} />

      <div className="relative w-full max-w-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-12" style={{ animation: 'fadeInUp 0.8s ease-out both' }}>
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(159,122,234,0.6), transparent 70%)' }} />
            <div className="relative w-32 h-32 rounded-full bg-white/[0.06] border border-white/[0.15]
              flex items-center justify-center backdrop-blur-sm">
              <img src="/forgedlogo.png" alt="FORGED"
                className="w-24 h-24 object-contain"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(159,122,234,0.6)) brightness(1.3)' }} />
            </div>
          </div>
          <p className="text-white text-3xl font-black tracking-[0.3em]">FORGED</p>
          <p className="text-white/60 text-xs tracking-[0.18em] font-bold mt-2">
            TRACK. BUILD. TRANSFORM.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3"
          style={{ animation: 'fadeInUp 0.8s 0.2s ease-out both' }}>
          {error && (
            <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-3 py-2.5 text-xs text-red-200">
              {error}
            </div>
          )}

          <InputField label="EMAIL" type="email" value={email} onChange={setEmail}
            placeholder="you@email.com" focused={focused === 'email'}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />

          <InputField label="PASSWORD" type="password" value={password} onChange={setPassword}
            placeholder="••••••••" focused={focused === 'password'}
            onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />

          <button type="submit" disabled={loading}
            className="mt-3 py-4 rounded-xl text-white font-black text-sm tracking-[0.2em]
              transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              boxShadow: '0 10px 40px rgba(124,58,237,0.5)',
            }}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <p className="text-sm text-white/60 mt-8" style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
          New to FORGED?{' '}
          <Link to="/register" className="text-[#D4A853] font-black hover:brightness-125 transition-all">
            Create account
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// WEB LANDING
// ══════════════════════════════════════════════════════════════════════
function WebLanding({ onLogin }: Props) {
  const loginRef = useRef<HTMLDivElement>(null)
  const scrollToLogin = () => loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="bg-[#0f0a1f] min-h-screen text-white">

      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'linear-gradient(180deg, rgba(15,10,31,0.8) 0%, rgba(15,10,31,0) 100%)' }}>
        <div className="max-w-7xl mx-auto px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.06] border border-white/[0.1]">
              <img src="/forgedlogo.png" alt=""
                className="w-9 h-9 object-contain"
                style={{ filter: 'brightness(1.3) drop-shadow(0 2px 8px rgba(159,122,234,0.6))' }} />
            </div>
            <span className="text-white text-xl font-black tracking-[0.25em]">FORGED</span>
          </div>

          <div className="flex items-center gap-8">
            <button onClick={() => scrollToId('how-it-works')}
              className="text-white/80 text-sm font-black hover:text-white transition-colors hidden md:block tracking-wider">
              HOW IT WORKS
            </button>
            <button onClick={() => scrollToId('feat-training')}
              className="text-white/80 text-sm font-black hover:text-white transition-colors hidden md:block tracking-wider">
              FEATURES
            </button>
            <button onClick={() => scrollToId('pricing')}
              className="text-white/80 text-sm font-black hover:text-white transition-colors hidden md:block tracking-wider">
              PRICING
            </button>
            <button onClick={scrollToLogin}
              className="text-white/80 text-sm font-black hover:text-white transition-colors hidden md:block tracking-wider">
              SIGN IN
            </button>
            <button onClick={scrollToLogin}
              className="px-6 py-3 rounded-xl text-white text-sm font-black tracking-[0.15em]
                hover:brightness-110 active:scale-95 transition-all"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                boxShadow: '0 6px 20px rgba(124,58,237,0.4)',
              }}>
              START FREE
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.hero} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(15,10,31,0.85) 0%, rgba(42,27,74,0.75) 50%, rgba(92,44,24,0.7) 100%)' }} />
        </div>

        <DumbbellsCanvas />

        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(159,122,234,0.35) 0%, transparent 55%), radial-gradient(ellipse at 20% 70%, rgba(212,168,83,0.2) 0%, transparent 55%)' }} />

        <div className="relative max-w-7xl mx-auto px-10 py-24 grid grid-cols-2 gap-16 items-center w-full z-10">
          <div>
            <h1 className="text-white text-7xl xl:text-8xl font-black leading-[1.02] tracking-tight mb-8"
              style={{ animation: 'fadeInUp 0.8s 0.2s ease-out both' }}>
              Forge the body
              <br />
              you are working toward.
            </h1>

            <p className="text-white/80 text-lg leading-relaxed mb-10 max-w-xl"
              style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
              Training, nutrition, and transformation in one app. No fluff. No guesswork.
              Just the data and discipline to get stronger, week after week.
            </p>

            <div className="flex gap-4" style={{ animation: 'fadeInUp 0.8s 0.6s ease-out both' }}>
              <button onClick={scrollToLogin}
                className="group px-8 py-4 rounded-xl text-white text-sm font-black
                  tracking-[0.18em] transition-all active:scale-95
                  hover:brightness-110 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                  boxShadow: '0 12px 40px rgba(124,58,237,0.5)',
                }}>
                START TRAINING
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </button>
              <button onClick={scrollToLogin}
                className="px-8 py-4 rounded-xl text-white text-sm font-black
                  tracking-[0.18em] bg-white/[0.08] border border-white/[0.2]
                  hover:bg-white/[0.15] active:scale-95 transition-all backdrop-blur-sm">
                SIGN IN
              </button>
            </div>
          </div>

          <div className="relative hidden lg:block" style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
            <div className="absolute -inset-8 rounded-3xl opacity-50 blur-3xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #D4A853)' }} />
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/[0.15]"
              style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
              <img src={IMG.hero} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-xs text-[#D4A853] font-black tracking-[0.25em] mb-2">TODAY'S SESSION</p>
                <p className="text-white text-xl font-black">Push Day · 4 exercises</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorksSection />

      {/* FEATURES with mascots */}
      <FeatureSection
        id="feat-training"
        number="01" kicker="TRAINING" kickerColor="#a78bfa"
        title="Every rep. Every set. Every PR."
        description="Live volume tracking, automatic PR detection, rest timers that actually work, and a library of every exercise you have ever done. Cardio, strength, and duration all in one place."
        pills={['Live volume', 'PR detection', 'Rest timer', 'Cardio + strength', 'Exercise library']}
        image={IMG.training}
        imageLeft={false}
        mascotPose="curl"
      />

      <FeatureSection
        id="feat-nutrition"
        number="02" kicker="NUTRITION" kickerColor="#D4A853"
        title="Know what you eat. Hit your numbers."
        description="Barcode scan, photo capture, custom recipes, and daily macro goals that adjust to your training. Intermittent fasting built in, no separate app needed."
        pills={['Barcode scan', 'Macro goals', 'Custom recipes', 'Fasting tracker', 'Photo capture']}
        image={IMG.nutrition}
        imageLeft={true}
        mascotPose="point"
      />

      <FeatureSection
        id="feat-transformation"
        number="03" kicker="TRANSFORMATION" kickerColor="#a78bfa"
        title="See the change. Own the progress."
        description="Weekly recaps, progress photos with privacy lock, streak tracking, and transformations you can actually share. Your story, told in data."
        pills={['Progress photos', 'Weekly recap', 'Streaks', 'Achievements', 'Measurements']}
        image={IMG.transformation}
        imageLeft={false}
        mascotPose="flex"
      />

      {/* PRICING */}
      <PricingSection scrollToLogin={scrollToLogin} />

      {/* FINAL CTA */}
      <section ref={loginRef} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.3) 0%, transparent 65%)' }} />
        <div className="relative max-w-md mx-auto px-6 text-center">
          <h2 className="text-white text-5xl font-black mb-4 tracking-tight">Ready to forge?</h2>
          <p className="text-white/70 text-base mb-10">
            Create your account. First workout in 90 seconds.
          </p>
          <LoginCard onLogin={onLogin} />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.05] border border-white/[0.1]">
              <img src="/forgedlogo.png" alt=""
                className="w-9 h-9 object-contain"
                style={{ filter: 'brightness(1.3)' }} />
            </div>
            <div>
              <p className="text-white text-base font-black tracking-[0.25em]">FORGED</p>
              <p className="text-white/50 text-xs mt-1">© 2026 TCW Studio</p>
            </div>
          </div>
          <div className="flex gap-8">
            <span className="text-white/60 text-sm font-bold hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="text-white/60 text-sm font-bold hover:text-white transition-colors cursor-pointer">Terms</span>
            <span className="text-white/60 text-sm font-bold hover:text-white transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════
// HOW IT WORKS
// ══════════════════════════════════
function HowItWorksSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const steps = [
    {
      n: '01', title: 'Track',
      desc: 'Log your workouts, meals, and measurements. Fast entry, no friction.',
      color: '#a78bfa',
      glyph: '📊',
    },
    {
      n: '02', title: 'Train',
      desc: 'Follow your routine. See last session, hit PRs, beat yesterday.',
      color: '#D4A853',
      glyph: '🔥',
    },
    {
      n: '03', title: 'Transform',
      desc: 'Weekly recaps show your progress. Photos, streaks, numbers that add up.',
      color: '#a78bfa',
      glyph: '⚡',
    },
  ]

  return (
    <section id="how-it-works" ref={ref} className="py-32 px-10 relative">
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-20 transition-all duration-700
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-[#D4A853] text-sm font-black tracking-[0.3em] mb-4">
            HOW IT WORKS
          </p>
          <h2 className="text-white text-5xl xl:text-6xl font-black tracking-tight">
            Three steps.<br />No shortcuts.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.n}
              className={`relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8
                hover:bg-white/[0.05] hover:border-white/[0.15] transition-all
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                transitionDuration: '700ms',
                transitionDelay: `${i * 150}ms`,
              }}>
              <div className="absolute -top-4 left-8 px-3 py-1 rounded-lg bg-[#0f0a1f] border border-white/[0.1]">
                <span className="text-xs font-black tracking-[0.2em]" style={{ color: s.color }}>
                  STEP {s.n}
                </span>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-6 mt-4"
                style={{
                  background: `linear-gradient(135deg, ${s.color}30, ${s.color}10)`,
                  border: `1px solid ${s.color}40`,
                }}>
                {s.glyph}
              </div>
              <h3 className="text-white text-3xl font-black mb-3 tracking-tight">{s.title}</h3>
              <p className="text-white/60 text-base leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════
// PRICING
// ══════════════════════════════════
function PricingSection({ scrollToLogin }: { scrollToLogin: () => void }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="pricing" ref={ref} className="py-32 px-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 60%)' }} />

      <div className="relative max-w-5xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-[#D4A853] text-sm font-black tracking-[0.3em] mb-4">PRICING</p>
          <h2 className="text-white text-5xl xl:text-6xl font-black tracking-tight mb-4">
            Free. For now.
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Everything is free while FORGED is growing.
            Pro features will launch later in 2026.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free tier */}
          <div className={`relative bg-white/[0.04] border-2 border-[#7c3aed]/50 rounded-3xl p-10
            transition-all duration-700 delay-100
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ boxShadow: '0 0 60px rgba(124,58,237,0.2)' }}>
            <div className="absolute -top-4 left-10 px-4 py-1.5 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                boxShadow: '0 6px 20px rgba(124,58,237,0.4)',
              }}>
              <span className="text-white text-xs font-black tracking-[0.2em]">AVAILABLE NOW</span>
            </div>
            <h3 className="text-white text-3xl font-black mb-2">FORGED Free</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-white text-6xl font-black">$0</span>
              <span className="text-white/50 text-sm">/ forever</span>
            </div>
            <p className="text-white/70 text-base mb-8">
              Full access to everything. Unlimited workouts, meals, progress tracking.
            </p>
            <ul className="flex flex-col gap-3 mb-8">
              {[
                'Unlimited workouts and routines',
                'Full nutrition + macro tracking',
                'Progress photos + measurements',
                'Weekly recaps and streaks',
                'Intermittent fasting tracker',
                'Exercise library + PR detection',
                'All features, no limits',
              ].map(f => (
                <li key={f} className="flex items-start gap-3 text-white/85">
                  <span className="text-[#D4A853] mt-0.5">✓</span>
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={scrollToLogin}
              className="w-full py-4 rounded-xl text-white font-black text-sm tracking-[0.18em]
                transition-all active:scale-95 hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                boxShadow: '0 10px 30px rgba(124,58,237,0.4)',
              }}>
              GET STARTED FREE
            </button>
          </div>

          {/* Pro tier teaser */}
          <div className={`relative bg-white/[0.02] border border-white/[0.1] rounded-3xl p-10
            transition-all duration-700 delay-200
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="absolute -top-4 left-10 px-4 py-1.5 rounded-xl bg-[#D4A853]/15 border border-[#D4A853]/40">
              <span className="text-[#D4A853] text-xs font-black tracking-[0.2em]">COMING 2026</span>
            </div>
            <h3 className="text-white/80 text-3xl font-black mb-2">FORGED Pro</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-white/60 text-6xl font-black">TBA</span>
            </div>
            <p className="text-white/50 text-base mb-8">
              Advanced features for serious lifters and coaches, launching later in 2026.
            </p>
            <ul className="flex flex-col gap-3 mb-8">
              {[
                'AI-powered routine suggestions',
                'Coach mode for training clients',
                'Advanced analytics dashboard',
                'Priority support',
                'Export data to CSV',
                'Apple Health / Google Fit sync',
                'More features to be announced',
              ].map(f => (
                <li key={f} className="flex items-start gap-3 text-white/50">
                  <span className="text-white/30 mt-0.5">○</span>
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <button disabled
              className="w-full py-4 rounded-xl text-white/50 font-black text-sm tracking-[0.18em]
                bg-white/[0.04] border border-white/[0.1] cursor-not-allowed">
              COMING SOON
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════
// FEATURE SECTION (with mascot)
// ══════════════════════════════════
function FeatureSection({
  id, number, kicker, kickerColor, title, description, pills, image, imageLeft, mascotPose,
}: {
  id: string
  number: string
  kicker: string
  kickerColor: string
  title: string
  description: string
  pills: string[]
  image: string
  imageLeft: boolean
  mascotPose: 'curl' | 'point' | 'flex'
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.15 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const isGold = kickerColor === '#D4A853'
  const pillClass = isGold
    ? 'bg-[#D4A853]/15 text-[#D4A853] border border-[#D4A853]/30'
    : 'bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30'

  return (
    <section id={id} ref={ref} className="py-32 px-10 relative">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        {imageLeft && (
          <div className={`order-2 lg:order-1 transition-all duration-700
            ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <ImageCardWithMascot image={image} pose={mascotPose} accentColor={kickerColor} />
          </div>
        )}

        <div className={`order-1 ${imageLeft ? 'lg:order-2' : ''} transition-all duration-700
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-black tracking-[0.35em]" style={{ color: kickerColor }}>
              {number}
            </span>
            <span className="h-[1px] w-12" style={{ backgroundColor: kickerColor, opacity: 0.5 }} />
            <span className="text-sm font-black tracking-[0.25em]" style={{ color: kickerColor }}>
              {kicker}
            </span>
          </div>

          <h2 className="text-white text-5xl xl:text-6xl font-black leading-[1.1] tracking-tight mb-6">
            {title}
          </h2>

          <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-xl">
            {description}
          </p>

          <div className="flex flex-wrap gap-2">
            {pills.map(p => (
              <span key={p} className={`px-4 py-2 rounded-lg text-xs font-black tracking-[0.1em] ${pillClass}`}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {!imageLeft && (
          <div className={`order-2 transition-all duration-700 delay-200
            ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <ImageCardWithMascot image={image} pose={mascotPose} accentColor={kickerColor} />
          </div>
        )}
      </div>
    </section>
  )
}

// ══════════════════════════════════
// IMAGE CARD WITH MASCOT overlay
// ══════════════════════════════════
function ImageCardWithMascot({ image, pose, accentColor }: {
  image: string
  pose: 'curl' | 'point' | 'flex'
  accentColor: string
}) {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-3xl opacity-40 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #D4A853)' }} />
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/[0.15]"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
        <img src={image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Mascot floats in bottom-right corner of image */}
        <div className="absolute bottom-4 right-4 w-32 h-32 pointer-events-none">
          <MascotCanvas pose={pose} accentColor={accentColor} />
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// MASCOT — procedural stylized figure
// ══════════════════════════════════
function MascotCanvas({ pose, accentColor }: {
  pose: 'curl' | 'point' | 'flex'
  accentColor: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    camera.position.set(0, 0.8, 4.5)
    camera.lookAt(0, 0.5, 0)

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const figure = new THREE.Group()

    const col = new THREE.Color(accentColor)
    const metalMat = new THREE.MeshStandardMaterial({
      color: col, metalness: 0.85, roughness: 0.25,
      emissive: col, emissiveIntensity: 0.2,
    })
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x2a1f3a, metalness: 0.7, roughness: 0.4,
    })

    // Head (sphere)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), metalMat)
    head.position.y = 1.3
    figure.add(head)

    // Torso (tapered cylinder)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.9, 8), metalMat)
    torso.position.y = 0.5
    figure.add(torso)

    // Hips (small cylinder)
    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.2, 8), darkMat)
    hips.position.y = 0
    figure.add(hips)

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8), darkMat)
    leftLeg.position.set(-0.15, -0.5, 0)
    figure.add(leftLeg)
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8), darkMat)
    rightLeg.position.set(0.15, -0.5, 0)
    figure.add(rightLeg)

    // Arms - shoulders
    const armMat = metalMat

    // LEFT ARM (user's left, our right)
    const leftShoulder = new THREE.Group()
    leftShoulder.position.set(0.42, 0.85, 0)
    const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.45, 8), armMat)
    leftUpperArm.position.y = -0.22
    leftShoulder.add(leftUpperArm)

    const leftForearmPivot = new THREE.Group()
    leftForearmPivot.position.y = -0.45
    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.4, 8), armMat)
    leftForearm.position.y = -0.2
    leftForearmPivot.add(leftForearm)
    // Fist
    const leftFist = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), armMat)
    leftFist.position.y = -0.45
    leftForearmPivot.add(leftFist)
    leftShoulder.add(leftForearmPivot)

    // RIGHT ARM (mirror)
    const rightShoulder = new THREE.Group()
    rightShoulder.position.set(-0.42, 0.85, 0)
    const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.45, 8), armMat)
    rightUpperArm.position.y = -0.22
    rightShoulder.add(rightUpperArm)

    const rightForearmPivot = new THREE.Group()
    rightForearmPivot.position.y = -0.45
    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.4, 8), armMat)
    rightForearm.position.y = -0.2
    rightForearmPivot.add(rightForearm)
    const rightFist = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), armMat)
    rightFist.position.y = -0.45
    rightForearmPivot.add(rightFist)
    rightShoulder.add(rightForearmPivot)

    figure.add(leftShoulder)
    figure.add(rightShoulder)

    // Apply pose
    if (pose === 'curl') {
      // Right arm doing bicep curl (forearm up)
      rightShoulder.rotation.z = 0.1
      rightForearmPivot.rotation.x = -2.2  // forearm curled up
      // Left arm relaxed
      leftShoulder.rotation.z = -0.1
    } else if (pose === 'point') {
      // Right arm pointing forward/down (at food)
      rightShoulder.rotation.x = -1.2
      rightShoulder.rotation.z = 0.2
      rightForearmPivot.rotation.x = -0.3
      leftShoulder.rotation.z = -0.1
    } else if (pose === 'flex') {
      // Both arms up, bicep pose
      rightShoulder.rotation.z = -1.3
      rightForearmPivot.rotation.x = -2.2
      leftShoulder.rotation.z = 1.3
      leftForearmPivot.rotation.x = -2.2
    }

    scene.add(figure)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const keyLight = new THREE.PointLight(col.getHex(), 3, 10)
    keyLight.position.set(2, 2, 3)
    scene.add(keyLight)
    const fillLight = new THREE.PointLight(0xffffff, 1, 10)
    fillLight.position.set(-2, 1, 2)
    scene.add(fillLight)

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const s = Math.min(parent.clientWidth, parent.clientHeight)
      renderer.setSize(s, s, false)
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    // Scroll tracking
    let scrollY = window.scrollY
    let lastScroll = scrollY
    let scrollDelta = 0
    const onScroll = () => {
      const now = window.scrollY
      scrollDelta = now - lastScroll
      lastScroll = now
      scrollY = now
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const clock = new THREE.Clock()
    let frameId: number
    const animate = () => {
      const t = clock.getElapsedTime()

      // Head looks up/down based on scroll direction
      const targetLookY = Math.max(-0.5, Math.min(0.5, -scrollDelta * 0.01))
      head.rotation.x += (targetLookY - head.rotation.x) * 0.1
      scrollDelta *= 0.9  // decay

      // Whole body gentle sway
      figure.rotation.y = Math.sin(t * 0.6) * 0.15
      figure.position.y = Math.sin(t * 0.8) * 0.05

      // Breathing scale on torso
      const breath = 1 + Math.sin(t * 1.5) * 0.02
      torso.scale.set(breath, 1, breath)

      // Pose-specific idle motion
      if (pose === 'curl') {
        // Curl rep - oscillate forearm
        rightForearmPivot.rotation.x = -1.6 + Math.sin(t * 1.2) * 0.7
      } else if (pose === 'flex') {
        // Pulse flex - slight squeeze on both
        const sq = Math.sin(t * 1.0) * 0.08
        leftForearmPivot.rotation.x = -2.2 + sq
        rightForearmPivot.rotation.x = -2.2 + sq
      } else if (pose === 'point') {
        // Slight pointing wave
        rightShoulder.rotation.x = -1.2 + Math.sin(t * 0.8) * 0.1
      }

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      figure.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
      renderer.dispose()
    }
  }, [pose, accentColor])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

// ══════════════════════════════════
// 3D DUMBBELLS (hero)
// ══════════════════════════════════
function DumbbellsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    camera.position.z = 12

    const renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const makeDumbbell = (): THREE.Group => {
      const group = new THREE.Group()
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a22, metalness: 0.9, roughness: 0.25,
      })
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd4a853, metalness: 0.95, roughness: 0.2,
        emissive: 0xd4a853, emissiveIntensity: 0.08,
      })
      const purpleMat = new THREE.MeshStandardMaterial({
        color: 0x7c3aed, metalness: 0.9, roughness: 0.25,
        emissive: 0x7c3aed, emissiveIntensity: 0.15,
      })
      const plateMat = Math.random() > 0.5 ? goldMat : purpleMat

      const left = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.35, 24), plateMat)
      left.rotation.z = Math.PI / 2
      left.position.x = -0.9
      group.add(left)

      const right = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.35, 24), plateMat)
      right.rotation.z = Math.PI / 2
      right.position.x = 0.9
      group.add(right)

      const innerLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.2, 24), metalMat)
      innerLeft.rotation.z = Math.PI / 2
      innerLeft.position.x = -0.65
      group.add(innerLeft)

      const innerRight = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.2, 24), metalMat)
      innerRight.rotation.z = Math.PI / 2
      innerRight.position.x = 0.65
      group.add(innerRight)

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.3, 16), metalMat)
      handle.rotation.z = Math.PI / 2
      group.add(handle)

      for (const sign of [-1, 1]) {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), metalMat)
        cap.position.x = sign * 1.1
        group.add(cap)
      }
      return group
    }

    const dumbbells: Array<{
      mesh: THREE.Group
      rotSpeed: THREE.Vector3
      floatSpeed: number
      floatPhase: number
      baseY: number
    }> = []

    const positions = [
      { x: -7, y: 2.5, z: -2 },
      { x: 6, y: -2, z: -3 },
      { x: -4, y: -3, z: 1 },
      { x: 5, y: 3, z: 0 },
      { x: -8, y: -0.5, z: -5 },
      { x: 8, y: 1.5, z: -4 },
    ]

    positions.forEach(pos => {
      const dumb = makeDumbbell()
      dumb.position.set(pos.x, pos.y, pos.z)
      const scale = 0.7 + Math.random() * 0.4
      dumb.scale.set(scale, scale, scale)
      dumb.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 0.3
      )
      scene.add(dumb)
      dumbbells.push({
        mesh: dumb,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.002,
        ),
        floatSpeed: 0.3 + Math.random() * 0.4,
        floatPhase: Math.random() * Math.PI * 2,
        baseY: pos.y,
      })
    })

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const purpleLight = new THREE.PointLight(0x9f7aea, 3, 25)
    purpleLight.position.set(-5, 4, 5)
    scene.add(purpleLight)
    const goldLight = new THREE.PointLight(0xd4a853, 2.5, 20)
    goldLight.position.set(5, -3, 4)
    scene.add(goldLight)
    const whiteLight = new THREE.DirectionalLight(0xffffff, 0.8)
    whiteLight.position.set(0, 5, 10)
    scene.add(whiteLight)

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    const clock = new THREE.Clock()
    let frameId: number
    const animate = () => {
      const t = clock.getElapsedTime()
      dumbbells.forEach(d => {
        d.mesh.rotation.x += d.rotSpeed.x
        d.mesh.rotation.y += d.rotSpeed.y
        d.mesh.rotation.z += d.rotSpeed.z
        d.mesh.position.y = d.baseY + Math.sin(t * d.floatSpeed + d.floatPhase) * 0.4
      })
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      dumbbells.forEach(d => {
        d.mesh.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose()
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
            else obj.material.dispose()
          }
        })
      })
      renderer.dispose()
    }
  }, [])

  return (
    <canvas ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.55 }} />
  )
}

// ══════════════════════════════════
// LOGIN CARD
// ══════════════════════════════════
function LoginCard({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const result = await api.auth.login({ email, password })
      localStorage.setItem('forged_user', JSON.stringify(result.user))
      onLogin(result.token)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-10"
      style={{ boxShadow: '0 0 100px rgba(124,58,237,0.2), 0 25px 70px rgba(0,0,0,0.5)' }}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-3 py-2.5 text-xs text-red-200 text-left">
            {error}
          </div>
        )}

        <InputField label="EMAIL" type="email" value={email} onChange={setEmail}
          placeholder="you@email.com" focused={focused === 'email'}
          onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />

        <InputField label="PASSWORD" type="password" value={password} onChange={setPassword}
          placeholder="••••••••" focused={focused === 'password'}
          onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />

        <button type="submit" disabled={loading}
          className="mt-3 py-4 rounded-xl text-white font-black text-sm tracking-[0.2em]
            transition-all active:scale-[0.98] disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            boxShadow: '0 10px 40px rgba(124,58,237,0.5)',
          }}>
          {loading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>
      </form>

      <p className="text-sm text-white/60 text-center mt-6">
        New to FORGED?{' '}
        <Link to="/register" className="text-[#D4A853] font-black hover:brightness-125 transition-all">
          Create account
        </Link>
      </p>
    </div>
  )
}

function InputField({
  label, type, value, onChange, placeholder, focused, onFocus, onBlur,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void
  placeholder: string; focused: boolean; onFocus: () => void; onBlur: () => void
}) {
  return (
    <div className="text-left">
      <label className="block text-xs font-black text-white/70 tracking-[0.18em] mb-2">
        {label}
      </label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus} onBlur={onBlur}
        placeholder={placeholder} required
        className={`w-full px-4 py-3.5 bg-white/[0.06] text-white text-base placeholder:text-white/30
          border rounded-xl outline-none transition-all
          ${focused
            ? 'border-[#7c3aed]/70 shadow-[0_0_0_3px_rgba(124,58,237,0.15)]'
            : 'border-white/[0.15] hover:border-white/[0.25]'}`}
      />
    </div>
  )
}