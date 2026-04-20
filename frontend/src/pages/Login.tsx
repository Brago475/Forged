import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { api } from '../hooks/api'

interface Props {
  onLogin: (token: string) => void
}

// Real screenshots from your app (in public/screenshots/)
const SCREENSHOTS = {
  dashboard: '/screenshots/ss-dashboard.png',
  workout: '/screenshots/ss-workout.png',
  routines: '/screenshots/ss-routines.png',
  foodlog: '/screenshots/ss-foodlog.png',
  recap: '/screenshots/ss-recap.png',
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
              style={{ background: 'radial-gradient(circle, rgba(159,122,234,0.4), transparent 70%)' }} />
            <div className="relative w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-2xl">
              <img src="/forgedlogo.png" alt="FORGED" className="w-24 h-24 object-contain" />
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
        style={{ background: 'linear-gradient(180deg, rgba(15,10,31,0.85) 0%, rgba(15,10,31,0) 100%)' }}>
        <div className="max-w-7xl mx-auto px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <img src="/forgedlogo.png" alt="" className="w-9 h-9 object-contain" />
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

      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a0a2e 0%, #0f0a1f 45%, #2a1810 100%)'
          }} />

        <DumbbellsCanvas />

        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 40%, rgba(159,122,234,0.3) 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(212,168,83,0.18) 0%, transparent 55%)' }} />

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
            <IPhoneFrame screenshot={SCREENSHOTS.dashboard} scale={1.1} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorksSection />

      {/* TRAINING */}
      <FeatureSection
        id="feat-training"
        number="01" kicker="TRAINING" kickerColor="#a78bfa"
        title="Every rep. Every set. Every PR."
        description="Live volume tracking, automatic PR detection, rest timers that actually work, and a library of every exercise you have ever done. Cardio, strength, and duration all in one place."
        pills={['Live volume', 'PR detection', 'Rest timer', 'Cardio + strength', 'Exercise library']}
        phoneScreenshot={SCREENSHOTS.workout}
        desktopScreenshot={SCREENSHOTS.routines}
        imageLeft={false}
        mascotPose="curl"
      />

      {/* NUTRITION */}
      <FeatureSection
        id="feat-nutrition"
        number="02" kicker="NUTRITION" kickerColor="#D4A853"
        title="Know what you eat. Hit your numbers."
        description="Barcode scan, photo capture, custom recipes, and daily macro goals that adjust to your training. Intermittent fasting built in, no separate app needed."
        pills={['Barcode scan', 'Macro goals', 'Custom recipes', 'Fasting tracker', 'Photo capture']}
        phoneScreenshot={SCREENSHOTS.foodlog}
        desktopScreenshot={SCREENSHOTS.dashboard}
        imageLeft={true}
        mascotPose="point"
      />

      {/* TRANSFORMATION */}
      <FeatureSection
        id="feat-transformation"
        number="03" kicker="TRANSFORMATION" kickerColor="#a78bfa"
        title="See the change. Own the progress."
        description="Weekly recaps, progress photos with privacy lock, streak tracking, and transformations you can actually share. Your story, told in data."
        pills={['Weekly recap', 'Streaks', 'Achievements', 'Measurements', 'Share-ready']}
        phoneScreenshot={SCREENSHOTS.recap}
        desktopScreenshot={SCREENSHOTS.workout}
        imageLeft={false}
        mascotPose="flex"
      />

      {/* FINAL CTA */}
      <section ref={loginRef} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.25) 0%, transparent 65%)' }} />
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
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <img src="/forgedlogo.png" alt="" className="w-9 h-9 object-contain" />
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
// iPhone 17 Pro Max frame
// ══════════════════════════════════
function IPhoneFrame({ screenshot, scale = 1 }: { screenshot: string, scale?: number }) {
  return (
    <div className="relative" style={{ transform: `scale(${scale})` }}>
      {/* Phone body */}
      <div className="relative w-[280px] rounded-[52px] bg-gradient-to-br from-[#1a1a1e] to-[#0a0a0c]
        p-[5px] shadow-2xl"
        style={{
          aspectRatio: '9 / 19.5',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 2px rgba(255,255,255,0.04)',
        }}>
        {/* Screen */}
        <div className="relative w-full h-full rounded-[46px] overflow-hidden bg-black">
          <img src={screenshot} alt="FORGED app"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Graceful fallback if screenshot missing
              const target = e.currentTarget
              target.style.display = 'none'
              if (target.parentElement) {
                target.parentElement.style.background =
                  'linear-gradient(135deg, #1a0a2e, #2a1a4a)'
                target.parentElement.innerHTML +=
                  '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:11px;text-align:center;padding:20px;">Screenshot loading<br/><span style="font-size:9px;">' +
                  screenshot.split('/').pop() + '</span></div>'
              }
            }} />

          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[24px]
            bg-black rounded-full z-10" />
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════
// Desktop dashboard mockup frame
// ══════════════════════════════════
function DesktopFrame({ screenshot }: { screenshot: string }) {
  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-[#1a1a1e] to-[#0a0a0c] rounded-t-xl p-2 pb-0 shadow-2xl"
        style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)' }}>
        {/* Menu bar */}
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
        {/* Screen */}
        <div className="bg-black rounded-lg overflow-hidden aspect-[16/10]">
          <img src={screenshot} alt="FORGED desktop"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
              if (target.parentElement) {
                target.parentElement.style.background =
                  'linear-gradient(135deg, #1a0a2e, #2a1a4a)'
              }
            }} />
        </div>
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
    {
      n: '01', title: 'Track',
      desc: 'Log your workouts, meals, and measurements. Fast entry, no friction.',
      color: '#a78bfa',
    },
    {
      n: '02', title: 'Train',
      desc: 'Follow your routine. See last session, hit PRs, beat yesterday.',
      color: '#D4A853',
    },
    {
      n: '03', title: 'Transform',
      desc: 'Weekly recaps show your progress. Photos, streaks, numbers that add up.',
      color: '#a78bfa',
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

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={s.n}
              className={`relative bg-[#181028] border border-white/[0.06] rounded-2xl p-10
                hover:border-white/[0.15] transition-all
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                transitionDuration: '700ms',
                transitionDelay: `${i * 150}ms`,
              }}>
              <div className="absolute -top-3 left-8 px-3 py-1 rounded-md bg-[#0f0a1f]"
                style={{ border: `1px solid ${s.color}60` }}>
                <span className="text-xs font-black tracking-[0.2em]" style={{ color: s.color }}>
                  STEP {s.n}
                </span>
              </div>
              <div className="w-12 h-1 rounded-full mb-6 mt-4" style={{ background: s.color }} />
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
// FEATURE SECTION (phone + desktop + mascot)
// ══════════════════════════════════
function FeatureSection({
  id, number, kicker, kickerColor, title, description, pills,
  phoneScreenshot, desktopScreenshot, imageLeft, mascotPose,
}: {
  id: string
  number: string
  kicker: string
  kickerColor: string
  title: string
  description: string
  pills: string[]
  phoneScreenshot: string
  desktopScreenshot: string
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
    <section id={id} ref={ref} className="py-28 px-10 relative">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
        {imageLeft && (
          <div className={`order-2 lg:order-1 transition-all duration-700
            ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <ShowcaseCard
              phoneScreenshot={phoneScreenshot}
              desktopScreenshot={desktopScreenshot}
              mascotPose={mascotPose}
              accentColor={kickerColor}
            />
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

          <h2 className="text-white text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight mb-6">
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
            <ShowcaseCard
              phoneScreenshot={phoneScreenshot}
              desktopScreenshot={desktopScreenshot}
              mascotPose={mascotPose}
              accentColor={kickerColor}
            />
          </div>
        )}
      </div>
    </section>
  )
}

// ══════════════════════════════════
// SHOWCASE CARD — desktop mockup + phone overlay + mascot below
// ══════════════════════════════════
function ShowcaseCard({ phoneScreenshot, desktopScreenshot, mascotPose, accentColor }: {
  phoneScreenshot: string
  desktopScreenshot: string
  mascotPose: 'curl' | 'point' | 'flex'
  accentColor: string
}) {
  return (
    <div className="relative">
      <div className="relative">
        {/* Desktop in back */}
        <div className="relative z-0">
          <DesktopFrame screenshot={desktopScreenshot} />
        </div>

        {/* Phone overlapping bottom-left of desktop */}
        <div className="absolute z-10 -bottom-8 -left-6 sm:-bottom-10 sm:-left-10">
          <div style={{ transform: 'scale(0.7)', transformOrigin: 'bottom left' }}>
            <IPhoneFrame screenshot={phoneScreenshot} />
          </div>
        </div>
      </div>

      {/* Mascot below, centered */}
      <div className="flex justify-end mt-4 pr-4">
        <div className="w-32 h-32 relative">
          <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
            style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }} />
          <div className="relative w-full h-full">
            <MascotCanvas pose={mascotPose} accentColor={accentColor} />
          </div>
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

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), metalMat)
    head.position.y = 1.3
    figure.add(head)

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.9, 8), metalMat)
    torso.position.y = 0.5
    figure.add(torso)

    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.2, 8), darkMat)
    hips.position.y = 0
    figure.add(hips)

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8), darkMat)
    leftLeg.position.set(-0.15, -0.5, 0)
    figure.add(leftLeg)
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8), darkMat)
    rightLeg.position.set(0.15, -0.5, 0)
    figure.add(rightLeg)

    const armMat = metalMat

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
    const leftFist = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), armMat)
    leftFist.position.y = -0.45
    leftForearmPivot.add(leftFist)
    leftShoulder.add(leftForearmPivot)

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

    if (pose === 'curl') {
      rightShoulder.rotation.z = 0.1
      rightForearmPivot.rotation.x = -2.2
      leftShoulder.rotation.z = -0.1
    } else if (pose === 'point') {
      rightShoulder.rotation.x = -1.2
      rightShoulder.rotation.z = 0.2
      rightForearmPivot.rotation.x = -0.3
      leftShoulder.rotation.z = -0.1
    } else if (pose === 'flex') {
      rightShoulder.rotation.z = -1.3
      rightForearmPivot.rotation.x = -2.2
      leftShoulder.rotation.z = 1.3
      leftForearmPivot.rotation.x = -2.2
    }

    scene.add(figure)

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

    let lastScroll = window.scrollY
    let scrollDelta = 0
    const onScroll = () => {
      const now = window.scrollY
      scrollDelta = now - lastScroll
      lastScroll = now
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const clock = new THREE.Clock()
    let frameId: number
    const animate = () => {
      const t = clock.getElapsedTime()

      const targetLookY = Math.max(-0.5, Math.min(0.5, -scrollDelta * 0.01))
      head.rotation.x += (targetLookY - head.rotation.x) * 0.1
      scrollDelta *= 0.9

      figure.rotation.y = Math.sin(t * 0.6) * 0.15
      figure.position.y = Math.sin(t * 0.8) * 0.05

      const breath = 1 + Math.sin(t * 1.5) * 0.02
      torso.scale.set(breath, 1, breath)

      if (pose === 'curl') {
        rightForearmPivot.rotation.x = -1.6 + Math.sin(t * 1.2) * 0.7
      } else if (pose === 'flex') {
        const sq = Math.sin(t * 1.0) * 0.08
        leftForearmPivot.rotation.x = -2.2 + sq
        rightForearmPivot.rotation.x = -2.2 + sq
      } else if (pose === 'point') {
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
      style={{ opacity: 0.5 }} />
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

// ══════════════════════════════════
// INPUT FIELD
// ══════════════════════════════════
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