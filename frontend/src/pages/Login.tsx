import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../hooks/api'

interface Props {
  onLogin: (token: string) => void
}

// ══════════════════════════════════
// Unsplash fitness images
// (Free, no attribution required for URL usage)
// ══════════════════════════════════
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
// MOBILE / APP VERSION — clean, focused, logo-first
// ══════════════════════════════════════════════════════════════════════
function MobileLogin({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.login({ email, password })
      localStorage.setItem('forged_user', JSON.stringify(result.user))
      onLogin(result.token)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#050507] flex flex-col items-center justify-center px-6 overflow-hidden">

      {/* Ambient glow backdrop */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(109,40,217,0.15) 0%, transparent 60%)'
        }} />

      <div className="relative w-full max-w-sm flex flex-col items-center">

        {/* Logo hero */}
        <div className="flex flex-col items-center mb-12"
          style={{ animation: 'fadeInUp 0.8s ease-out both' }}>
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full blur-2xl"
              style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.4), transparent 70%)' }} />
            <div className="relative w-28 h-28 rounded-full bg-white/[0.03] border border-white/[0.08]
              flex items-center justify-center">
              <img src="/logo-removebg-preview.png" alt="FORGED"
                className="w-20 h-20 object-contain"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(109,40,217,0.5)) brightness(1.2)' }}
              />
            </div>
          </div>
          <p className="text-white text-2xl font-black tracking-[0.25em]">FORGED</p>
          <p className="text-white/40 text-[11px] tracking-[0.15em] font-bold mt-1">
            Track. Build. Transform.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3"
          style={{ animation: 'fadeInUp 0.8s 0.2s ease-out both' }}>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 text-xs text-red-300"
              style={{ animation: 'shake 0.4s ease-out' }}>
              {error}
            </div>
          )}

          <InputField
            label="Email" type="email" value={email} onChange={setEmail}
            placeholder="you@email.com"
            focused={focused === 'email'}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
          />

          <InputField
            label="Password" type="password" value={password} onChange={setPassword}
            placeholder="••••••••"
            focused={focused === 'password'}
            onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-3 py-3.5 rounded-xl text-white font-black text-sm tracking-[0.15em] uppercase
              transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #6D28D9, #4c1d95)',
              boxShadow: '0 10px 30px rgba(109,40,217,0.4)',
            }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-white/50 mt-8"
          style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
          New to FORGED?{' '}
          <Link to="/register" className="text-[#D4A853] font-black hover:brightness-125 transition-all">
            Create account
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// WEB / DESKTOP VERSION — full landing page with scrolling sections
// ══════════════════════════════════════════════════════════════════════
function WebLanding({ onLogin }: Props) {
  const loginRef = useRef<HTMLDivElement>(null)

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="bg-[#050507] min-h-screen">

      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#050507]/80 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #D4A853)' }}>
              <img src="/logo-removebg-preview.png" alt=""
                className="w-6 h-6 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <span className="text-white text-sm font-black tracking-[0.2em]">FORGED</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => document.getElementById('feat-training')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-white/60 text-xs font-bold hover:text-white transition-colors hidden md:block">
              Features
            </button>
            <button onClick={scrollToLogin}
              className="text-white/60 text-xs font-bold hover:text-white transition-colors hidden md:block">
              Sign in
            </button>
            <button onClick={scrollToLogin}
              className="px-4 py-1.5 rounded-lg text-white text-xs font-black
                hover:brightness-110 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #4c1d95)' }}>
              Start free
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={IMG.hero} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(5,5,7,0.95) 0%, rgba(5,5,7,0.75) 50%, rgba(42,24,16,0.85) 100%)'
            }} />
        </div>

        {/* Purple radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 70% 30%, rgba(109,40,217,0.25) 0%, transparent 60%)'
          }} />

        <div className="relative max-w-7xl mx-auto px-8 py-20 grid grid-cols-2 gap-12 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6
              bg-[#D4A853]/10 border border-[#D4A853]/30"
              style={{ animation: 'fadeInUp 0.8s ease-out both' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853]" />
              <span className="text-[#D4A853] text-[10px] font-black tracking-[0.2em] uppercase">
                TCW Studio · v1.0
              </span>
            </div>

            <h1 className="text-white text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-6"
              style={{ animation: 'fadeInUp 0.8s 0.2s ease-out both' }}>
              Forge the body
              <br />
              you're{' '}
              <span className="bg-gradient-to-r from-[#9F7AEA] via-[#D4A853] to-[#9F7AEA] bg-clip-text text-transparent">
                working toward
              </span>
              .
            </h1>

            <p className="text-white/60 text-base leading-relaxed mb-8 max-w-lg"
              style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
              Training, nutrition, and transformation in one app. No BS, no fluff, just the data
              and discipline to get stronger.
            </p>

            <div className="flex gap-3"
              style={{ animation: 'fadeInUp 0.8s 0.6s ease-out both' }}>
              <button onClick={scrollToLogin}
                className="group px-6 py-3 rounded-xl text-white text-xs font-black
                  tracking-[0.12em] uppercase transition-all active:scale-95
                  hover:brightness-110 flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #6D28D9, #4c1d95)',
                  boxShadow: '0 10px 30px rgba(109,40,217,0.4)',
                }}>
                Start training
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </button>
              <button onClick={scrollToLogin}
                className="px-6 py-3 rounded-xl text-white text-xs font-black
                  tracking-[0.12em] uppercase bg-white/[0.06] border border-white/[0.1]
                  hover:bg-white/[0.1] active:scale-95 transition-all">
                Sign in
              </button>
            </div>
          </div>

          {/* Hero image card */}
          <div className="relative hidden lg:block"
            style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
            <div className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #D4A853)' }} />
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.1]"
              style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
              <img src={IMG.hero} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-[10px] text-[#D4A853] font-black tracking-[0.2em] uppercase mb-1">
                  Today's session
                </p>
                <p className="text-white text-sm font-black">Push Day · 4 exercises</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURE 1: TRAINING ─── */}
      <FeatureSection
        id="feat-training"
        number="01"
        kicker="Training"
        kickerColor="#6D28D9"
        title="Every rep. Every set. Every PR."
        description="Live volume tracking, automatic PR detection, rest timers that actually work, and a library of every exercise you've ever done. Cardio, strength, duration - we handle it all."
        pills={['Live volume', 'PR detection', 'Rest timer', 'Cardio + strength', 'Exercise library']}
        image={IMG.training}
        imageLeft={false}
      />

      {/* ─── FEATURE 2: NUTRITION ─── */}
      <FeatureSection
        id="feat-nutrition"
        number="02"
        kicker="Nutrition"
        kickerColor="#D4A853"
        title="Know what you eat. Hit your numbers."
        description="Barcode scan, photo capture, custom recipes, and daily macro goals that adjust to your training. Intermittent fasting built in, no separate app needed."
        pills={['Barcode scan', 'Macro goals', 'Custom recipes', 'Fasting tracker', 'Photo capture']}
        image={IMG.nutrition}
        imageLeft={true}
      />

      {/* ─── FEATURE 3: TRANSFORMATION ─── */}
      <FeatureSection
        id="feat-transformation"
        number="03"
        kicker="Transformation"
        kickerColor="#6D28D9"
        title="See the change. Own the progress."
        description="Weekly recaps, progress photos with privacy lock, streak tracking, and transformations you can actually share. Your story, told in data."
        pills={['Progress photos', 'Weekly recap', 'Streaks', 'Achievements', 'Measurements']}
        image={IMG.transformation}
        imageLeft={false}
      />

      {/* ─── FINAL CTA WITH LOGIN ─── */}
      <section ref={loginRef} className="relative py-24 overflow-hidden">
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #050507 0%, #1a0a2e 50%, #050507 100%)'
          }} />
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(109,40,217,0.2) 0%, transparent 70%)'
          }} />

        <div className="relative max-w-md mx-auto px-6 text-center">
          <h2 className="text-white text-4xl font-black mb-3 tracking-tight">
            Ready to{' '}
            <span className="bg-gradient-to-r from-[#9F7AEA] to-[#D4A853] bg-clip-text text-transparent">
              forge
            </span>
            ?
          </h2>
          <p className="text-white/50 text-sm mb-8">
            Create your account. First workout in 90 seconds.
          </p>

          <LoginCard onLogin={onLogin} />
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #D4A853)' }}>
              <img src="/logo-removebg-preview.png" alt="" className="w-4 h-4 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <p className="text-white/40 text-[11px] font-bold">
              © 2026 TCW Studio · FORGED
            </p>
          </div>
          <div className="flex gap-5">
            <span className="text-white/40 text-[11px] font-bold hover:text-white/70 transition-colors cursor-pointer">Privacy</span>
            <span className="text-white/40 text-[11px] font-bold hover:text-white/70 transition-colors cursor-pointer">Terms</span>
            <span className="text-white/40 text-[11px] font-bold hover:text-white/70 transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════
// FEATURE SECTION (reused)
// ══════════════════════════════════
function FeatureSection({
  id, number, kicker, kickerColor, title, description, pills, image, imageLeft,
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
}) {
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

  const pillColor = kickerColor === '#D4A853' ? 'text-[#D4A853] bg-[#D4A853]/10' : 'text-[#9F7AEA] bg-[#6D28D9]/15'

  return (
    <section id={id} ref={ref} className="py-24 px-8 relative">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

        {imageLeft && (
          <div className={`order-2 lg:order-1 transition-all duration-700
            ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <ImageCard image={image} />
          </div>
        )}

        <div className={`order-1 ${imageLeft ? 'lg:order-2' : ''} transition-all duration-700
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase"
              style={{ color: kickerColor }}>
              {number}
            </span>
            <span className="h-[0.5px] w-8" style={{ backgroundColor: kickerColor, opacity: 0.4 }} />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase"
              style={{ color: kickerColor }}>
              {kicker}
            </span>
          </div>

          <h2 className="text-white text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight mb-5">
            {title}
          </h2>

          <p className="text-white/55 text-base leading-relaxed mb-6 max-w-lg">
            {description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {pills.map(p => (
              <span key={p} className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-[0.1em] ${pillColor}`}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {!imageLeft && (
          <div className={`order-2 transition-all duration-700 delay-200
            ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <ImageCard image={image} />
          </div>
        )}
      </div>
    </section>
  )
}

// ══════════════════════════════════
// IMAGE CARD with glow
// ══════════════════════════════════
function ImageCard({ image }: { image: string }) {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl opacity-30 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #6D28D9, #D4A853)' }} />
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/[0.08]"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <img src={image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
    </div>
  )
}

// ══════════════════════════════════
// LOGIN CARD (reused in web final CTA)
// ══════════════════════════════════
function LoginCard({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.login({ email, password })
      localStorage.setItem('forged_user', JSON.stringify(result.user))
      onLogin(result.token)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0d0d13]/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8"
      style={{ boxShadow: '0 0 80px rgba(109,40,217,0.15), 0 20px 60px rgba(0,0,0,0.4)' }}>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 text-xs text-red-300 text-left"
            style={{ animation: 'shake 0.4s ease-out' }}>
            {error}
          </div>
        )}

        <InputField
          label="Email" type="email" value={email} onChange={setEmail}
          placeholder="you@email.com"
          focused={focused === 'email'}
          onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
        />

        <InputField
          label="Password" type="password" value={password} onChange={setPassword}
          placeholder="••••••••"
          focused={focused === 'password'}
          onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
        />

        <button
          type="submit" disabled={loading}
          className="mt-2 py-3.5 rounded-xl text-white font-black text-sm tracking-[0.15em] uppercase
            transition-all active:scale-[0.98] disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #6D28D9, #4c1d95)',
            boxShadow: '0 10px 30px rgba(109,40,217,0.4)',
          }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-xs text-white/50 text-center mt-5">
        New to FORGED?{' '}
        <Link to="/register" className="text-[#D4A853] font-black hover:brightness-125 transition-all">
          Create account
        </Link>
      </p>
    </div>
  )
}

// ══════════════════════════════════
// INPUT FIELD (reused in mobile + web card)
// ══════════════════════════════════
function InputField({
  label, type, value, onChange, placeholder, focused, onFocus, onBlur,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  focused: boolean
  onFocus: () => void
  onBlur: () => void
}) {
  return (
    <div className="text-left">
      <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.15em] mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        required
        className={`w-full px-4 py-3 bg-white/[0.04] text-white text-sm placeholder:text-white/20
          border rounded-xl outline-none transition-all
          ${focused
            ? 'border-[#6D28D9]/60 shadow-[0_0_0_3px_rgba(109,40,217,0.1)]'
            : 'border-white/[0.08] hover:border-white/[0.15]'}`}
      />
    </div>
  )
}