import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Lottie from 'lottie-react'
import * as THREE from 'three'
import { api } from '../hooks/api'

interface Props {
  onLogin: (token: string) => void
}

// Free high-quality Unsplash fitness photos
const PHOTO = {
  hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1800&q=90&auto=format&fit=crop',
  training: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1600&q=90&auto=format&fit=crop',
  nutrition: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600&q=90&auto=format&fit=crop',
  transformation: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1600&q=90&auto=format&fit=crop',
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

function LottiePlayer({ src, className = '' }: { src: string, className?: string }) {
  const data = useLottie(src)
  if (!data) return null
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
// MOBILE — logo fills box
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

      {/* Three.js particle field background */}
      <ParticleField />

      <div className="relative w-full max-w-sm flex flex-col items-center z-10">
        <div className="flex flex-col items-center mb-10" style={{ animation: 'fadeInUp 0.8s ease-out both' }}>
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(159,122,234,0.5), transparent 70%)' }} />
            {/* Logo: tight padding, fills the white box */}
            <div className="relative w-36 h-36 rounded-2xl bg-white flex items-center justify-center shadow-2xl p-1">
              <img src="/forgedlogo.png" alt="FORGED" className="w-full h-full object-contain" />
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
    <div className="bg-[#0f0a1f] min-h-screen text-white relative">

      {/* Global particle field — lives behind everything */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ParticleField />
      </div>

      <nav className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'linear-gradient(180deg, rgba(15,10,31,0.85) 0%, rgba(15,10,31,0) 100%)' }}>
        <div className="max-w-7xl mx-auto px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg p-1">
              <img src="/forgedlogo.png" alt="" className="w-full h-full object-contain" />
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

      {/* HERO — cinematic photo + floating 3D dumbbells + Lottie on top */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={PHOTO.hero} alt="" className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(15,10,31,0.9) 0%, rgba(42,27,74,0.75) 50%, rgba(92,44,24,0.7) 100%)'
            }} />
        </div>

        {/* Floating 3D dumbbells */}
        <DumbbellsCanvas />

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

          {/* Hero right: big Lottie character ON TOP of hero, no phone frames */}
          <div className="relative hidden lg:flex items-center justify-center"
            style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-60"
                style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)' }} />
              <div className="relative">
                <LottiePlayer src={LOTTIE.fitness} className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <HowItWorksSection />

      {/* TRAINING — big photo with Lottie on top + 3D barbell */}
      <FeatureSection
        id="feat-training"
        number="01" kicker="TRAINING" kickerColor="#a78bfa"
        title="Every rep. Every set. Every PR."
        description="Live volume tracking, automatic PR detection, rest timers that actually work, and a library of every exercise you have ever done."
        pills={['Live volume', 'PR detection', 'Rest timer', 'Cardio + strength']}
        photo={PHOTO.training}
        lottie={LOTTIE.weightlifting}
        imageLeft={false}
      />

      <FeatureSection
        id="feat-nutrition"
        number="02" kicker="NUTRITION" kickerColor="#D4A853"
        title="Know what you eat. Hit your numbers."
        description="Barcode scan, photo capture, custom recipes, and daily macro goals that adjust to your training."
        pills={['Barcode scan', 'Macro goals', 'Custom recipes', 'Fasting tracker']}
        photo={PHOTO.nutrition}
        lottie={LOTTIE.fasting}
        imageLeft={true}
      />

      <FeatureSection
        id="feat-transformation"
        number="03" kicker="TRANSFORMATION" kickerColor="#a78bfa"
        title="See the change. Own the progress."
        description="Weekly recaps, progress photos with privacy lock, streak tracking, and transformations you can actually share."
        pills={['Weekly recap', 'Streaks', 'Achievements', 'Measurements']}
        photo={PHOTO.transformation}
        lottie={LOTTIE.running}
        imageLeft={false}
      />

      {/* FINAL CTA — Lottie inline with headline */}
      <section ref={loginRef} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.25) 0%, transparent 65%)' }} />
        <div className="relative max-w-md mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 flex-shrink-0">
              <LottiePlayer src={LOTTIE.loading} className="w-full h-full" />
            </div>
            <h2 className="text-white text-5xl font-black tracking-tight">Ready to forge?</h2>
          </div>
          <p className="text-white/70 text-base mb-10">
            Create your account. First workout in 90 seconds.
          </p>
          <LoginCard onLogin={onLogin} />
        </div>
      </section>

      <footer className="py-16 px-10 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg p-1">
              <img src="/forgedlogo.png" alt="" className="w-full h-full object-contain" />
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
// Three.js ParticleField — purple/gold dots drifting
// ══════════════════════════════════
function ParticleField() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Particles
    const particleCount = 150
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const purple = new THREE.Color('#a78bfa')
    const gold = new THREE.Color('#D4A853')

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5
      const c = Math.random() > 0.7 ? gold : purple
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    let frameId: number
    const animate = () => {
      points.rotation.y += 0.0005
      points.rotation.x += 0.0002
      const pos = geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += 0.002
        if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = -5
      }
      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}

// ══════════════════════════════════
// Three.js Dumbbells — floating in hero
// ══════════════════════════════════
function DumbbellsCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.z = 10

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const light1 = new THREE.DirectionalLight(0xffffff, 1)
    light1.position.set(5, 5, 5)
    scene.add(light1)
    const light2 = new THREE.PointLight(0x7c3aed, 2, 20)
    light2.position.set(-3, 2, 4)
    scene.add(light2)
    const light3 = new THREE.PointLight(0xD4A853, 1.5, 20)
    light3.position.set(3, -2, 4)
    scene.add(light3)
    scene.add(new THREE.AmbientLight(0x404080, 0.5))

    const dumbbells: { group: THREE.Group; speed: number; offset: number }[] = []

    const makeDumbbell = (color: number) => {
      const group = new THREE.Group()
      const barMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 })
      const plateMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.4 })

      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 16), barMat)
      bar.rotation.z = Math.PI / 2
      group.add(bar)

      const plateGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 24)
      const p1 = new THREE.Mesh(plateGeom, plateMat); p1.rotation.z = Math.PI / 2; p1.position.x = 0.7; group.add(p1)
      const p2 = new THREE.Mesh(plateGeom, plateMat); p2.rotation.z = Math.PI / 2; p2.position.x = -0.7; group.add(p2)

      return group
    }

    const colors = [0x7c3aed, 0xD4A853, 0xa78bfa, 0x5b21b6, 0xD4A853, 0x7c3aed]
    for (let i = 0; i < 6; i++) {
      const d = makeDumbbell(colors[i])
      d.position.x = (Math.random() - 0.5) * 12
      d.position.y = (Math.random() - 0.5) * 6
      d.position.z = (Math.random() - 0.5) * 4
      d.rotation.x = Math.random() * Math.PI
      d.rotation.y = Math.random() * Math.PI
      scene.add(d)
      dumbbells.push({ group: d, speed: 0.002 + Math.random() * 0.004, offset: Math.random() * Math.PI * 2 })
    }

    let frameId: number
    const clock = new THREE.Clock()
    const animate = () => {
      const t = clock.getElapsedTime()
      dumbbells.forEach((d) => {
        d.group.rotation.x += d.speed
        d.group.rotation.y += d.speed * 0.7
        d.group.position.y += Math.sin(t + d.offset) * 0.003
      })
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none z-[5]" />
}

// ══════════════════════════════════
// Three.js Rotating Barbell — for feature sections
// ══════════════════════════════════
function BarbellCanvas({ accentColor }: { accentColor: string }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.z = 6

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x606090, 0.6))
    const l1 = new THREE.DirectionalLight(0xffffff, 1)
    l1.position.set(3, 3, 5)
    scene.add(l1)
    const glow = new THREE.PointLight(new THREE.Color(accentColor).getHex(), 2, 10)
    glow.position.set(0, 0, 2)
    scene.add(glow)

    const group = new THREE.Group()
    const barMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.95, roughness: 0.2 })
    const plateMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accentColor), metalness: 0.7, roughness: 0.3 })

    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 16), barMat)
    bar.rotation.z = Math.PI / 2
    group.add(bar)

    const plateGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.25, 32)
    for (let i = 0; i < 2; i++) {
      const plateOuter = new THREE.Mesh(plateGeom, plateMat); plateOuter.rotation.z = Math.PI / 2
      plateOuter.position.x = i === 0 ? 1.8 : -1.8; group.add(plateOuter)
      const plateInner = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.28, 32), plateMat)
      plateInner.rotation.z = Math.PI / 2
      plateInner.position.x = i === 0 ? 1.5 : -1.5; group.add(plateInner)
    }

    scene.add(group)

    let frameId: number
    const animate = () => {
      group.rotation.y += 0.006
      group.rotation.x = Math.sin(Date.now() * 0.0005) * 0.15
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [accentColor])

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}

// ══════════════════════════════════
// FEATURE SECTION — big photo background + Lottie on top + 3D barbell
// ══════════════════════════════════
function FeatureSection({ id, number, kicker, kickerColor, title, description, pills, photo, lottie, imageLeft }: {
  id: string; number: string; kicker: string; kickerColor: string
  title: string; description: string; pills: string[]
  photo: string; lottie: string; imageLeft: boolean
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const isGold = kickerColor === '#D4A853'
  const pillClass = isGold
    ? 'bg-[#D4A853]/15 text-[#D4A853] border border-[#D4A853]/30'
    : 'bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30'

  const visual = (
    <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden border border-white/[0.1]"
      style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
      {/* Big photo as the entire visual */}
      <img src={photo} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, transparent 30%, rgba(15,10,31,0.6) 100%)` }} />

      {/* 3D rotating barbell overlay */}
      <div className="absolute inset-0">
        <BarbellCanvas accentColor={kickerColor} />
      </div>

      {/* Lottie big, on top of photo */}
      <div className="absolute bottom-6 right-6 w-48 h-48 pointer-events-none">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-50"
          style={{ background: `radial-gradient(circle, ${kickerColor}, transparent 70%)` }} />
        <div className="relative w-full h-full">
          <LottiePlayer src={lottie} className="w-full h-full" />
        </div>
      </div>
    </div>
  )

  return (
    <section id={id} ref={ref} className="py-28 px-10 relative z-10">
      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
        {imageLeft && (
          <div className={`order-2 lg:order-1 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            {visual}
          </div>
        )}

        <div className={`order-1 ${imageLeft ? 'lg:order-2' : ''} transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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

        {!imageLeft && (
          <div className={`order-2 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            {visual}
          </div>
        )}
      </div>
    </section>
  )
}

// ══════════════════════════════════
// HOW IT WORKS — tilt cards, Lottie inside each
// ══════════════════════════════════
function HowItWorksSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const steps = [
    { n: '01', title: 'Track', desc: 'Log your workouts, meals, and measurements. Fast entry, no friction.', color: '#a78bfa', lottie: LOTTIE.splitjump },
    { n: '02', title: 'Train', desc: 'Follow your routine. See last session, hit PRs, beat yesterday.', color: '#D4A853', lottie: LOTTIE.deadbug },
    { n: '03', title: 'Transform', desc: 'Weekly recaps show your progress. Photos, streaks, numbers that add up.', color: '#a78bfa', lottie: LOTTIE.running },
  ]

  return (
    <section id="how-it-works" ref={ref} className="py-32 px-10 relative z-10">
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
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
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