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
    <div className="fixed inset-0 bg-[#0f0a1f] flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(159,122,234,0.25) 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, rgba(212,168,83,0.12) 0%, transparent 60%)'
        }} />

      <div className="relative w-full max-w-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-12"
          style={{ animation: 'fadeInUp 0.8s ease-out both' }}>
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(159,122,234,0.6), transparent 70%)' }} />
            <div className="relative w-32 h-32 rounded-full bg-white/[0.06] border border-white/[0.15]
              flex items-center justify-center backdrop-blur-sm">
              <img src="/logo-removebg-preview.png" alt="FORGED"
                className="w-24 h-24 object-contain"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(159,122,234,0.6)) brightness(1.3)' }}
              />
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
            placeholder="you@email.com"
            focused={focused === 'email'}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />

          <InputField label="PASSWORD" type="password" value={password} onChange={setPassword}
            placeholder="••••••••"
            focused={focused === 'password'}
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

        <p className="text-sm text-white/60 mt-8"
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

  return (
    <div className="bg-[#0f0a1f] min-h-screen text-white">

      {/* NAV — bigger, no bg */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'linear-gradient(180deg, rgba(15,10,31,0.8) 0%, rgba(15,10,31,0) 100%)' }}>
        <div className="max-w-7xl mx-auto px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.06] border border-white/[0.1]">
              <img src="/logo-removebg-preview.png" alt=""
                className="w-9 h-9 object-contain"
                style={{ filter: 'brightness(1.3) drop-shadow(0 2px 8px rgba(159,122,234,0.6))' }} />
            </div>
            <span className="text-white text-xl font-black tracking-[0.25em]">FORGED</span>
          </div>

          <div className="flex items-center gap-8">
            <button onClick={() => document.getElementById('feat-training')?.scrollIntoView({ behavior: 'smooth' })}
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
              START FREE
            </button>
          </div>
        </div>
      </nav>

      {/* HERO with 3D dumbbells */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.hero} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(15,10,31,0.85) 0%, rgba(42,27,74,0.75) 50%, rgba(92,44,24,0.7) 100%)'
            }} />
        </div>

        {/* 3D dumbbell canvas */}
        <DumbbellsCanvas />

        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 70% 30%, rgba(159,122,234,0.35) 0%, transparent 55%), radial-gradient(ellipse at 20% 70%, rgba(212,168,83,0.2) 0%, transparent 55%)'
          }} />

        <div className="relative max-w-7xl mx-auto px-10 py-24 grid grid-cols-2 gap-16 items-center w-full z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8
              bg-[#D4A853]/15 border border-[#D4A853]/40 backdrop-blur-sm"
              style={{ animation: 'fadeInUp 0.8s ease-out both' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853]" />
              <span className="text-[#D4A853] text-xs font-black tracking-[0.25em]">
                TCW STUDIO · V1.0
              </span>
            </div>

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

            <div className="flex gap-4"
              style={{ animation: 'fadeInUp 0.8s 0.6s ease-out both' }}>
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

          <div className="relative hidden lg:block"
            style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
            <div className="absolute -inset-8 rounded-3xl opacity-50 blur-3xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #D4A853)' }} />
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/[0.15]"
              style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
              <img src={IMG.hero} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-xs text-[#D4A853] font-black tracking-[0.25em] mb-2">
                  TODAY'S SESSION
                </p>
                <p className="text-white text-xl font-black">Push Day · 4 exercises</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <FeatureSection
        id="feat-training"
        number="01"
        kicker="TRAINING"
        kickerColor="#a78bfa"
        title="Every rep. Every set. Every PR."
        description="Live volume tracking, automatic PR detection, rest timers that actually work, and a library of every exercise you have ever done. Cardio, strength, and duration all in one place."
        pills={['Live volume', 'PR detection', 'Rest timer', 'Cardio + strength', 'Exercise library']}
        image={IMG.training}
        imageLeft={false}
      />

      <FeatureSection
        id="feat-nutrition"
        number="02"
        kicker="NUTRITION"
        kickerColor="#D4A853"
        title="Know what you eat. Hit your numbers."
        description="Barcode scan, photo capture, custom recipes, and daily macro goals that adjust to your training. Intermittent fasting built in, no separate app needed."
        pills={['Barcode scan', 'Macro goals', 'Custom recipes', 'Fasting tracker', 'Photo capture']}
        image={IMG.nutrition}
        imageLeft={true}
      />

      <FeatureSection
        id="feat-transformation"
        number="03"
        kicker="TRANSFORMATION"
        kickerColor="#a78bfa"
        title="See the change. Own the progress."
        description="Weekly recaps, progress photos with privacy lock, streak tracking, and transformations you can actually share. Your story, told in data."
        pills={['Progress photos', 'Weekly recap', 'Streaks', 'Achievements', 'Measurements']}
        image={IMG.transformation}
        imageLeft={false}
      />

      {/* FINAL CTA */}
      <section ref={loginRef} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.3) 0%, transparent 65%)'
          }} />

        <div className="relative max-w-md mx-auto px-6 text-center">
          <h2 className="text-white text-5xl font-black mb-4 tracking-tight">
            Ready to forge?
          </h2>
          <p className="text-white/70 text-base mb-10">
            Create your account. First workout in 90 seconds.
          </p>
          <LoginCard onLogin={onLogin} />
        </div>
      </section>

      {/* FOOTER no bg, bigger */}
      <footer className="py-16 px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.05] border border-white/[0.1]">
              <img src="/logo-removebg-preview.png" alt=""
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════
// 3D DUMBBELLS
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

    // Build a dumbbell mesh — two spheres + handle
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

      // Random: either purple or gold plates
      const plateMat = Math.random() > 0.5 ? goldMat : purpleMat

      // Left plate
      const left = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.35, 24),
        plateMat
      )
      left.rotation.z = Math.PI / 2
      left.position.x = -0.9
      group.add(left)

      // Right plate
      const right = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.35, 24),
        plateMat
      )
      right.rotation.z = Math.PI / 2
      right.position.x = 0.9
      group.add(right)

      // Inner left plate (smaller)
      const innerLeft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.2, 24),
        metalMat
      )
      innerLeft.rotation.z = Math.PI / 2
      innerLeft.position.x = -0.65
      group.add(innerLeft)

      // Inner right plate
      const innerRight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.2, 24),
        metalMat
      )
      innerRight.rotation.z = Math.PI / 2
      innerRight.position.x = 0.65
      group.add(innerRight)

      // Handle
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 1.3, 16),
        metalMat
      )
      handle.rotation.z = Math.PI / 2
      group.add(handle)

      // Handle ends (caps)
      for (const sign of [-1, 1]) {
        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 12),
          metalMat
        )
        cap.position.x = sign * 1.1
        group.add(cap)
      }

      return group
    }

    // Create 6 dumbbells scattered in 3D space
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

    positions.forEach((pos) => {
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

    // Lighting
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
// FEATURE SECTION
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
            <ImageCard image={image} />
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
              <span key={p}
                className={`px-4 py-2 rounded-lg text-xs font-black tracking-[0.1em] ${pillClass}`}>
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

function ImageCard({ image }: { image: string }) {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-3xl opacity-40 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #D4A853)' }} />
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/[0.15]"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
        <img src={image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
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
    <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-10"
      style={{ boxShadow: '0 0 100px rgba(124,58,237,0.2), 0 25px 70px rgba(0,0,0,0.5)' }}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-3 py-2.5 text-xs text-red-200 text-left">
            {error}
          </div>
        )}

        <InputField label="EMAIL" type="email" value={email} onChange={setEmail}
          placeholder="you@email.com"
          focused={focused === 'email'}
          onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />

        <InputField label="PASSWORD" type="password" value={password} onChange={setPassword}
          placeholder="••••••••"
          focused={focused === 'password'}
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
      <label className="block text-xs font-black text-white/70 tracking-[0.18em] mb-2">
        {label}
      </label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus} onBlur={onBlur}
        placeholder={placeholder}
        required
        className={`w-full px-4 py-3.5 bg-white/[0.06] text-white text-base placeholder:text-white/30
          border rounded-xl outline-none transition-all
          ${focused
            ? 'border-[#7c3aed]/70 shadow-[0_0_0_3px_rgba(124,58,237,0.15)]'
            : 'border-white/[0.15] hover:border-white/[0.25]'}`}
      />
    </div>
  )
}