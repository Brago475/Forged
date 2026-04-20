import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Lottie from 'lottie-react'
import { api } from '../hooks/api'

interface Props {
  onLogin: (token: string) => void
}

const SCREENSHOTS = {
  dashboard: '/screenshots/ss-dashboard.png',
  workout: '/screenshots/ss-workout.png',
  routines: '/screenshots/ss-routines.png',
  foodlog: '/screenshots/ss-foodlog.png',
  recap: '/screenshots/ss-recap.png',
}

const PHOTO = {
  hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=85&auto=format&fit=crop',
  lifting: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1200&q=85&auto=format&fit=crop',
  nutrition: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=85&auto=format&fit=crop',
  transformation: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&q=85&auto=format&fit=crop',
}

const LOTTIE = {
  fitness: '/animations/fitness.json',
  splitjump: '/animations/splitjump.json',
  deadbug: '/animations/deadbug.json',
  weightlifting: '/animations/weightlifting.json',
  fasting: '/animations/fasting.json',
  running: '/animations/running.json',
  loading: '/animations/loading.json',
}

// ══════════════════════════════════
// Lottie loader
// ══════════════════════════════════
function useLottie(url: string) {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    fetch(url).then(r => r.json()).then(setData).catch(() => setData(null))
  }, [url])
  return data
}

function LottiePlayer({ src, className = '' }: {
  src: string
  className?: string
}) {
  const data = useLottie(src)
  if (!data) return <div className={`${className} bg-white/[0.03] rounded-xl`} />
  return <Lottie animationData={data} loop autoplay className={className} />
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
// MOBILE — with corner lotties and big logo
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

      <div className="absolute top-8 right-8 w-24 h-24 opacity-70 pointer-events-none">
        <LottiePlayer src={LOTTIE.fitness} className="w-full h-full" />
      </div>
      <div className="absolute bottom-8 left-8 w-20 h-20 opacity-60 pointer-events-none">
        <LottiePlayer src={LOTTIE.loading} className="w-full h-full" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-10" style={{ animation: 'fadeInUp 0.8s ease-out both' }}>
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(159,122,234,0.5), transparent 70%)' }} />
            <div className="relative w-48 h-48 rounded-3xl bg-white flex items-center justify-center shadow-2xl">
              <img src="/forgedlogo.png" alt="FORGED" className="w-40 h-40 object-contain" />
            </div>
          </div>
          <p className="text-white text-4xl font-black tracking-[0.3em] mt-2">FORGED</p>
          <p className="text-white/60 text-xs tracking-[0.18em] font-bold mt-3">
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

      <nav className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'linear-gradient(180deg, rgba(15,10,31,0.85) 0%, rgba(15,10,31,0) 100%)' }}>
        <div className="max-w-7xl mx-auto px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg">
              <img src="/forgedlogo.png" alt="" className="w-12 h-12 object-contain" />
            </div>
            <span className="text-white text-2xl font-black tracking-[0.25em]">FORGED</span>
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
              START HERE
            </button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={PHOTO.hero} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(15,10,31,0.9) 0%, rgba(42,27,74,0.8) 50%, rgba(92,44,24,0.75) 100%)'
            }} />
        </div>

        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 40%, rgba(159,122,234,0.3) 0%, transparent 60%)' }} />

        <div className="relative max-w-7xl mx-auto px-10 py-24 grid grid-cols-2 gap-16 items-center w-full z-10">
          <div>
            <h1 className="text-white text-7xl xl:text-8xl font-black leading-[1.02] tracking-tight mb-8"
              style={{ animation: 'fadeInUp 0.8s 0.2s ease-out both' }}>
              Forge the body
              <br />
              you are working toward.
            </h1>

            <p className="text-white/85 text-lg leading-relaxed mb-10 max-w-xl"
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
                START HERE
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

          <div className="relative hidden lg:flex items-center justify-center"
            style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
            <div className="w-full max-w-md">
              <LottiePlayer src={LOTTIE.fitness} className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      <HowItWorksSection />

      <FeatureSplit
        id="feat-training"
        number="01" kicker="TRAINING" kickerColor="#a78bfa"
        title="Every rep. Every set. Every PR."
        description="Live volume tracking, automatic PR detection, rest timers that actually work, and a library of every exercise you have ever done."
        pills={['Live volume', 'PR detection', 'Rest timer', 'Cardio + strength']}
        mainPhoto={PHOTO.lifting}
        overlayScreenshot={SCREENSHOTS.workout}
        lottie={LOTTIE.weightlifting}
        imageLeft={false}
      />

      <FeatureCollage
        id="feat-nutrition"
        number="02" kicker="NUTRITION" kickerColor="#D4A853"
        title="Know what you eat. Hit your numbers."
        description="Barcode scan, photo capture, custom recipes, and daily macro goals that adjust to your training."
        pills={['Barcode scan', 'Macro goals', 'Custom recipes', 'Fasting tracker']}
        mainPhoto={PHOTO.nutrition}
        overlayScreenshot={SCREENSHOTS.foodlog}
        secondaryScreenshot={SCREENSHOTS.dashboard}
        lottie={LOTTIE.fasting}
        imageLeft={true}
      />

      <FeatureSideBySide
        id="feat-transformation"
        number="03" kicker="TRANSFORMATION" kickerColor="#a78bfa"
        title="See the change. Own the progress."
        description="Weekly recaps, progress photos with privacy lock, streak tracking, and transformations you can actually share."
        pills={['Weekly recap', 'Streaks', 'Achievements', 'Measurements']}
        mainPhoto={PHOTO.transformation}
        screenshot={SCREENSHOTS.recap}
        lottie={LOTTIE.running}
        imageLeft={false}
      />

      <section ref={loginRef} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.25) 0%, transparent 65%)' }} />
        <div className="relative max-w-md mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32">
              <LottiePlayer src={LOTTIE.loading} className="w-full h-full" />
            </div>
          </div>
          <h2 className="text-white text-5xl font-black mb-4 tracking-tight">Ready to forge?</h2>
          <p className="text-white/70 text-base mb-10">
            Create your account. First workout in 90 seconds.
          </p>
          <LoginCard onLogin={onLogin} />
        </div>
      </section>

      <footer className="py-16 px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <img src="/forgedlogo.png" alt="" className="w-11 h-11 object-contain" />
            </div>
            <div>
              <p className="text-white text-lg font-black tracking-[0.25em]">FORGED</p>
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
// iPhone Frame
// ══════════════════════════════════
function IPhoneFrame({ screenshot }: { screenshot: string }) {
  return (
    <div className="relative w-[240px] rounded-[46px] bg-gradient-to-br from-[#1a1a1e] to-[#0a0a0c] p-[4px] shadow-2xl"
      style={{
        aspectRatio: '9 / 19.5',
        boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
      }}>
      <div className="relative w-full h-full rounded-[42px] overflow-hidden bg-black">
        <img src={screenshot} alt="FORGED app" className="w-full h-full object-contain bg-[#0a0a0c]" />
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[78px] h-[20px] bg-black rounded-full z-10" />
      </div>
    </div>
  )
}

// ══════════════════════════════════
// Desktop Frame
// ══════════════════════════════════
function DesktopFrame({ screenshot }: { screenshot: string }) {
  return (
    <div className="bg-gradient-to-br from-[#1a1a1e] to-[#0a0a0c] rounded-t-xl p-2 pb-0 shadow-2xl"
      style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-1.5 px-3 py-2 mb-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <div className="flex-1 flex justify-center">
          <div className="bg-white/5 rounded-md px-3 py-0.5 text-[9px] text-white/40 font-bold tracking-wide">
            forgedgyms.com
          </div>
        </div>
      </div>
      <div className="bg-black rounded-lg overflow-hidden aspect-[16/10]">
        <img src={screenshot} alt="FORGED desktop" className="w-full h-full object-contain bg-[#0a0a0c]" />
      </div>
    </div>
  )
}

// ══════════════════════════════════
// Photo Frame
// ══════════════════════════════════
function PhotoFrame({ photo, className = '' }: { photo: string, className?: string }) {
  return (
    <div className={`relative rounded-3xl overflow-hidden border border-white/[0.1] ${className}`}
      style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
      <img src={photo} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  )
}

// ══════════════════════════════════
// FEATURE HEADER
// ══════════════════════════════════
function FeatureHeader({ number, kicker, kickerColor, title, description, pills }: {
  number: string; kicker: string; kickerColor: string
  title: string; description: string; pills: string[]
}) {
  const isGold = kickerColor === '#D4A853'
  const pillClass = isGold
    ? 'bg-[#D4A853]/15 text-[#D4A853] border border-[#D4A853]/30'
    : 'bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30'

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-black tracking-[0.35em]" style={{ color: kickerColor }}>{number}</span>
        <span className="h-[1px] w-12" style={{ backgroundColor: kickerColor, opacity: 0.5 }} />
        <span className="text-sm font-black tracking-[0.25em]" style={{ color: kickerColor }}>{kicker}</span>
      </div>
      <h2 className="text-white text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight mb-6">{title}</h2>
      <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-xl">{description}</p>
      <div className="flex flex-wrap gap-2">
        {pills.map(p => (
          <span key={p} className={`px-4 py-2 rounded-lg text-xs font-black tracking-[0.1em] ${pillClass}`}>{p}</span>
        ))}
      </div>
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
    { n: '01', title: 'Track', desc: 'Log your workouts, meals, and measurements. Fast entry, no friction.', color: '#a78bfa', lottie: LOTTIE.splitjump },
    { n: '02', title: 'Train', desc: 'Follow your routine. See last session, hit PRs, beat yesterday.', color: '#D4A853', lottie: LOTTIE.deadbug },
    { n: '03', title: 'Transform', desc: 'Weekly recaps show your progress. Photos, streaks, numbers that add up.', color: '#a78bfa', lottie: LOTTIE.running },
  ]

  return (
    <section id="how-it-works" ref={ref} className="py-32 px-10 relative">
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-[#D4A853] text-sm font-black tracking-[0.3em] mb-4">HOW IT WORKS</p>
          <h2 className="text-white text-5xl xl:text-6xl font-black tracking-tight">Three steps.<br />No shortcuts.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => <TiltStepCard key={s.n} step={s} index={i} visible={visible} />)}
        </div>
      </div>
    </section>
  )
}

function TiltStepCard({ step, index, visible }: {
  step: { n: string; title: string; desc: string; color: string; lottie: string }
  index: number; visible: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const onMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = (e.clientX - centerX) / (rect.width / 2)
    const dy = (e.clientY - centerY) / (rect.height / 2)
    setTilt({ x: dy * -8, y: dx * 8 })
  }

  const onLeave = () => { setTilt({ x: 0, y: 0 }); setHovered(false) }

  return (
    <div ref={cardRef} onMouseMove={onMove} onMouseEnter={() => setHovered(true)} onMouseLeave={onLeave}
      className={`relative bg-[#181028] border rounded-2xl p-10 transition-all duration-300 cursor-pointer
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{
        transitionDuration: visible ? '300ms' : '700ms',
        transitionDelay: visible ? '0ms' : `${index * 150}ms`,
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.02 : 1})`,
        borderColor: hovered ? `${step.color}80` : 'rgba(255,255,255,0.06)',
        boxShadow: hovered ? `0 30px 60px rgba(0,0,0,0.4), 0 0 60px ${step.color}30` : 'none',
      }}>
      <div className="absolute -top-3 left-8 px-3 py-1 rounded-md bg-[#0f0a1f]" style={{ border: `1px solid ${step.color}80` }}>
        <span className="text-xs font-black tracking-[0.2em]" style={{ color: step.color }}>STEP {step.n}</span>
      </div>
      <div className="relative w-40 h-40 mx-auto mb-4 mt-4">
        <div className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-500"
          style={{ background: `radial-gradient(circle, ${step.color}, transparent 70%)`, opacity: hovered ? 0.5 : 0.2 }} />
        <div className="relative w-full h-full"><LottiePlayer src={step.lottie} className="w-full h-full" /></div>
      </div>
      <div className="h-1 rounded-full mb-4 mx-auto transition-all duration-300"
        style={{ background: step.color, width: hovered ? '80px' : '48px' }} />
      <h3 className="text-white text-3xl font-black mb-3 tracking-tight text-center">{step.title}</h3>
      <p className="text-white/60 text-base leading-relaxed text-center">{step.desc}</p>
    </div>
  )
}

// ══════════════════════════════════
// FEATURE SPLIT
// ══════════════════════════════════
function FeatureSplit({ id, number, kicker, kickerColor, title, description, pills, mainPhoto, overlayScreenshot, lottie, imageLeft }: {
  id: string; number: string; kicker: string; kickerColor: string
  title: string; description: string; pills: string[]
  mainPhoto: string; overlayScreenshot: string; lottie: string; imageLeft: boolean
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id={id} ref={ref} className="py-28 px-10 relative">
      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
        {imageLeft && (
          <div className={`order-2 lg:order-1 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <SplitVisual photo={mainPhoto} screenshot={overlayScreenshot} lottie={lottie} accentColor={kickerColor} />
          </div>
        )}
        <div className={`order-1 ${imageLeft ? 'lg:order-2' : ''} transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <FeatureHeader number={number} kicker={kicker} kickerColor={kickerColor} title={title} description={description} pills={pills} />
        </div>
        {!imageLeft && (
          <div className={`order-2 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <SplitVisual photo={mainPhoto} screenshot={overlayScreenshot} lottie={lottie} accentColor={kickerColor} />
          </div>
        )}
      </div>
    </section>
  )
}

function SplitVisual({ photo, screenshot, lottie, accentColor }: { photo: string; screenshot: string; lottie: string; accentColor: string }) {
  return (
    <div className="relative">
      <PhotoFrame photo={photo} className="aspect-[4/5] w-full" />
      <div className="absolute -bottom-8 -right-8 z-10"><IPhoneFrame screenshot={screenshot} /></div>
      <div className="absolute -bottom-4 -left-8 w-36 h-36 z-10">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }} />
        <div className="relative w-full h-full"><LottiePlayer src={lottie} className="w-full h-full" /></div>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// FEATURE COLLAGE
// ══════════════════════════════════
function FeatureCollage({ id, number, kicker, kickerColor, title, description, pills, mainPhoto, overlayScreenshot, secondaryScreenshot, lottie, imageLeft }: {
  id: string; number: string; kicker: string; kickerColor: string
  title: string; description: string; pills: string[]
  mainPhoto: string; overlayScreenshot: string; secondaryScreenshot: string; lottie: string; imageLeft: boolean
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id={id} ref={ref} className="py-28 px-10 relative">
      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center">
        {imageLeft && (
          <div className={`order-2 lg:order-1 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <CollageVisual photo={mainPhoto} overlayScreenshot={overlayScreenshot} secondaryScreenshot={secondaryScreenshot} lottie={lottie} accentColor={kickerColor} />
          </div>
        )}
        <div className={`order-1 ${imageLeft ? 'lg:order-2' : ''} transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <FeatureHeader number={number} kicker={kicker} kickerColor={kickerColor} title={title} description={description} pills={pills} />
        </div>
        {!imageLeft && (
          <div className={`order-2 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <CollageVisual photo={mainPhoto} overlayScreenshot={overlayScreenshot} secondaryScreenshot={secondaryScreenshot} lottie={lottie} accentColor={kickerColor} />
          </div>
        )}
      </div>
    </section>
  )
}

function CollageVisual({ photo, overlayScreenshot, secondaryScreenshot, lottie, accentColor }: {
  photo: string; overlayScreenshot: string; secondaryScreenshot: string; lottie: string; accentColor: string
}) {
  return (
    <div className="relative min-h-[500px]">
      <div className="absolute top-0 left-0 w-[70%] z-0"><PhotoFrame photo={photo} className="aspect-[4/3]" /></div>
      <div className="absolute top-12 right-0 w-[42%] z-10 hidden md:block"><DesktopFrame screenshot={secondaryScreenshot} /></div>
      <div className="absolute bottom-0 right-8 z-20 hidden md:block" style={{ transform: 'scale(0.85)', transformOrigin: 'bottom right' }}>
        <IPhoneFrame screenshot={overlayScreenshot} />
      </div>
      <div className="absolute bottom-8 left-8 w-28 h-28 z-30">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }} />
        <div className="relative w-full h-full"><LottiePlayer src={lottie} className="w-full h-full" /></div>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// FEATURE SIDE-BY-SIDE
// ══════════════════════════════════
function FeatureSideBySide({ id, number, kicker, kickerColor, title, description, pills, mainPhoto, screenshot, lottie, imageLeft }: {
  id: string; number: string; kicker: string; kickerColor: string
  title: string; description: string; pills: string[]
  mainPhoto: string; screenshot: string; lottie: string; imageLeft: boolean
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id={id} ref={ref} className="py-28 px-10 relative">
      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
        {imageLeft && (
          <div className={`order-2 lg:order-1 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <SideBySideVisual photo={mainPhoto} screenshot={screenshot} lottie={lottie} accentColor={kickerColor} />
          </div>
        )}
        <div className={`order-1 ${imageLeft ? 'lg:order-2' : ''} transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <FeatureHeader number={number} kicker={kicker} kickerColor={kickerColor} title={title} description={description} pills={pills} />
        </div>
        {!imageLeft && (
          <div className={`order-2 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <SideBySideVisual photo={mainPhoto} screenshot={screenshot} lottie={lottie} accentColor={kickerColor} />
          </div>
        )}
      </div>
    </section>
  )
}

function SideBySideVisual({ photo, screenshot, lottie, accentColor }: { photo: string; screenshot: string; lottie: string; accentColor: string }) {
  return (
    <div className="relative">
      <div className="flex gap-4 items-end">
        <PhotoFrame photo={photo} className="flex-1 aspect-[3/4]" />
        <div className="flex-shrink-0"><IPhoneFrame screenshot={screenshot} /></div>
      </div>
      <div className="flex justify-center -mt-6">
        <div className="w-32 h-32 relative">
          <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }} />
          <div className="relative w-full h-full"><LottiePlayer src={lottie} className="w-full h-full" /></div>
        </div>
      </div>
    </div>
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
          <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-3 py-2.5 text-xs text-red-200 text-left">{error}</div>
        )}
        <InputField label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="you@email.com"
          focused={focused === 'email'} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
        <InputField label="PASSWORD" type="password" value={password} onChange={setPassword} placeholder="••••••••"
          focused={focused === 'password'} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
        <button type="submit" disabled={loading}
          className="mt-3 py-4 rounded-xl text-white font-black text-sm tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 10px 40px rgba(124,58,237,0.5)' }}>
          {loading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>
      </form>
      <p className="text-sm text-white/60 text-center mt-6">
        New to FORGED?{' '}
        <Link to="/register" className="text-[#D4A853] font-black hover:brightness-125 transition-all">Create account</Link>
      </p>
    </div>
  )
}

// ══════════════════════════════════
// INPUT FIELD
// ══════════════════════════════════
function InputField({ label, type, value, onChange, placeholder, focused, onFocus, onBlur }: {
  label: string; type: string; value: string; onChange: (v: string) => void
  placeholder: string; focused: boolean; onFocus: () => void; onBlur: () => void
}) {
  return (
    <div className="text-left">
      <label className="block text-xs font-black text-white/70 tracking-[0.18em] mb-2">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
        placeholder={placeholder} required
        className={`w-full px-4 py-3.5 bg-white/[0.06] text-white text-base placeholder:text-white/30 border rounded-xl outline-none transition-all
          ${focused ? 'border-[#7c3aed]/70 shadow-[0_0_0_3px_rgba(124,58,237,0.15)]' : 'border-white/[0.15] hover:border-white/[0.25]'}`}
      />
    </div>
  )
}