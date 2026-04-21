import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Lottie from 'lottie-react'
import * as THREE from 'three'
import { api } from '../hooks/api'

interface Props {
  onLogin: (token: string) => void
}

const LOTTIE = {
  fitness: '/animations/fitness.json',
  loading: '/animations/loading.json',
}

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

export default function Register({ onLogin }: Props) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile ? <MobileRegister onLogin={onLogin} /> : <WebRegister onLogin={onLogin} />
}

// ══════════════════════════════════════════════════════════════════════
// MOBILE REGISTER — matches MobileLogin
// ══════════════════════════════════════════════════════════════════════
function MobileRegister({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.register({ email, username, password, displayName })
      localStorage.setItem('forged_user', JSON.stringify(result.user))
      onLogin(result.token)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0f0a1f] flex flex-col items-center justify-center px-6 overflow-hidden overflow-y-auto py-8">
      {/* Dumbbells background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-35">
        <DumbbellsCanvas />
      </div>

      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(159,122,234,0.25) 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, rgba(212,168,83,0.12) 0%, transparent 60%)'
        }} />

      <div className="relative w-full max-w-sm flex flex-col items-center z-10">
        <div className="flex flex-col items-center mb-8" style={{ animation: 'fadeInUp 0.8s ease-out both' }}>
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(159,122,234,0.5), transparent 70%)' }} />
            <div className="relative w-28 h-28 rounded-2xl bg-white flex items-center justify-center shadow-2xl overflow-hidden">
              <img src="/forgedlogo.png" alt="FORGED" className="w-full h-full object-contain scale-150" />
            </div>
            <div className="absolute -top-8 -right-10 w-20 h-20 z-20 pointer-events-none">
              <LottiePlayer src={LOTTIE.fitness} className="w-full h-full" />
            </div>
          </div>
          <p className="text-white text-4xl font-black tracking-[0.3em] mt-2">FORGED</p>
          <p className="text-white/60 text-xs tracking-[0.18em] font-bold mt-3">
            CREATE YOUR ACCOUNT
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3"
          style={{ animation: 'fadeInUp 0.8s 0.2s ease-out both' }}>
          {error && (
            <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-3 py-2.5 text-xs text-red-200">
              {error}
            </div>
          )}
          <InputField label="DISPLAY NAME" type="text" value={displayName} onChange={setDisplayName}
            placeholder="Evan" focused={focused === 'displayName'}
            onFocus={() => setFocused('displayName')} onBlur={() => setFocused(null)} required={false} />
          <InputField label="USERNAME" type="text" value={username} onChange={setUsername}
            placeholder="evan" focused={focused === 'username'}
            onFocus={() => setFocused('username')} onBlur={() => setFocused(null)} />
          <InputField label="EMAIL" type="email" value={email} onChange={setEmail}
            placeholder="you@email.com" focused={focused === 'email'}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
          <InputField label="PASSWORD" type="password" value={password} onChange={setPassword}
            placeholder="••••••••" focused={focused === 'password'}
            onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
            minLength={8} />
          <button type="submit" disabled={loading}
            className="mt-3 py-4 rounded-xl text-white font-black text-sm tracking-[0.2em]
              transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: '#7c3aed',
              boxShadow: '0 10px 40px rgba(124,58,237,0.5)',
            }}>
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-sm text-white/60 mt-8" style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-[#D4A853] font-black hover:brightness-125 transition-all">
            Sign in
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
// WEB REGISTER — focused split screen (branding left, form right)
// ══════════════════════════════════════════════════════════════════════
function WebRegister({ onLogin }: Props) {
  return (
    <div className="bg-[#0f0a1f] min-h-screen text-white relative overflow-hidden">
      {/* 3D DUMBBELLS — background only */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
        <DumbbellsCanvas />
      </div>

      {/* Purple gradient glow */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.25) 0%, transparent 65%)' }} />

      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(15,10,31,0.85)' }}>
        <div className="max-w-7xl mx-auto px-10 py-6 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/forgedlogo.png" alt="" className="w-full h-full object-contain scale-150" />
            </div>
            <span className="text-white text-2xl font-black tracking-[0.25em]">FORGED</span>
          </Link>

          <Link to="/login"
            className="text-white/80 text-sm font-black hover:text-white transition-colors tracking-wider">
            BACK TO SIGN IN
          </Link>
        </div>
      </nav>

      {/* Content */}
      <section className="relative min-h-[calc(100vh-100px)] flex items-center px-10 py-16 z-10">
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left — brand copy */}
          <div className="hidden lg:block">
            <p className="text-[#D4A853] text-sm font-black tracking-[0.3em] mb-6"
              style={{ animation: 'fadeInUp 0.8s 0.2s ease-out both' }}>
              START YOUR TRANSFORMATION
            </p>
            <h1 className="text-white text-7xl xl:text-8xl font-black tracking-tight mb-8 leading-[0.95]"
              style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
              Get<br />forged.
            </h1>
            <p className="text-white/75 text-xl leading-relaxed mb-8 max-w-md"
              style={{ animation: 'fadeInUp 0.8s 0.6s ease-out both' }}>
              Create your account and log your first workout in under two minutes.
            </p>
            <div className="flex items-center gap-3"
              style={{ animation: 'fadeInUp 0.8s 0.8s ease-out both' }}>
              <div className="w-14 h-14 flex-shrink-0">
                <LottiePlayer src={LOTTIE.loading} className="w-full h-full" />
              </div>
              <div className="text-white/60 text-sm">
                <p className="font-black tracking-wide">Free plan available</p>
                <p className="text-white/40 text-xs">All features. No credit card required.</p>
              </div>
            </div>
          </div>

          {/* Right — register card */}
          <div style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
            <RegisterCard onLogin={onLogin} />
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

// ══════════════════════════════════
// REGISTER CARD — matches Login card style
// ══════════════════════════════════
function RegisterCard({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const result = await api.auth.register({ email, username, password, displayName })
      localStorage.setItem('forged_user', JSON.stringify(result.user))
      onLogin(result.token)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.15] rounded-3xl p-12"
      style={{ boxShadow: '0 0 120px rgba(124,58,237,0.25), 0 30px 80px rgba(0,0,0,0.6)' }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
          <img src="/forgedlogo.png" alt="" className="w-full h-full object-contain scale-150" />
        </div>
        <div>
          <h3 className="text-white text-2xl font-black tracking-tight">Create account.</h3>
          <p className="text-white/60 text-xs">Start tracking in under two minutes.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-200 text-left">{error}</div>
        )}
        <InputField label="DISPLAY NAME" type="text" value={displayName} onChange={setDisplayName}
          placeholder="Evan" focused={focused === 'displayName'}
          onFocus={() => setFocused('displayName')} onBlur={() => setFocused(null)} required={false} />
        <InputField label="USERNAME" type="text" value={username} onChange={setUsername}
          placeholder="evan" focused={focused === 'username'}
          onFocus={() => setFocused('username')} onBlur={() => setFocused(null)} />
        <InputField label="EMAIL" type="email" value={email} onChange={setEmail}
          placeholder="you@email.com" focused={focused === 'email'}
          onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
        <InputField label="PASSWORD" type="password" value={password} onChange={setPassword}
          placeholder="••••••••" focused={focused === 'password'}
          onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
          minLength={8} />
        <button type="submit" disabled={loading}
          className="mt-4 py-5 rounded-xl text-white font-black text-base tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: '#7c3aed', boxShadow: '0 12px 50px rgba(124,58,237,0.55)' }}>
          {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT →'}
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-white/40 text-xs font-black tracking-[0.2em]">OR</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Link to="/login"
        className="block w-full py-5 rounded-xl text-center text-white font-black text-base tracking-[0.2em]
          bg-white/[0.05] border border-white/[0.15] hover:bg-white/[0.1] hover:border-[#D4A853]/50
          transition-all active:scale-[0.98]">
        SIGN IN
      </Link>
    </div>
  )
}

// ══════════════════════════════════
// INPUT FIELD
// ══════════════════════════════════
function InputField({ label, type, value, onChange, placeholder, focused, onFocus, onBlur, required = true, minLength }: {
  label: string; type: string; value: string; onChange: (v: string) => void
  placeholder: string; focused: boolean; onFocus: () => void; onBlur: () => void
  required?: boolean; minLength?: number
}) {
  return (
    <div className="text-left">
      <label className="block text-xs font-black text-white/70 tracking-[0.18em] mb-2">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
        placeholder={placeholder} required={required} minLength={minLength}
        className={`w-full px-4 py-4 bg-white/[0.06] text-white text-base placeholder:text-white/30 border rounded-xl outline-none transition-all
          ${focused ? 'border-[#7c3aed]/70 shadow-[0_0_0_3px_rgba(124,58,237,0.15)]' : 'border-white/[0.15] hover:border-white/[0.25]'}`}
      />
    </div>
  )
}

// ══════════════════════════════════
// Three.js DUMBBELLS — background
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
    camera.position.z = 14

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x404080, 0.6))
    const l1 = new THREE.DirectionalLight(0xffffff, 0.8)
    l1.position.set(5, 5, 5)
    scene.add(l1)
    const l2 = new THREE.PointLight(0x7c3aed, 2, 30)
    l2.position.set(-5, 3, 5)
    scene.add(l2)
    const l3 = new THREE.PointLight(0xD4A853, 1.5, 30)
    l3.position.set(5, -3, 5)
    scene.add(l3)

    const dumbbells: { group: THREE.Group; speed: number; offset: number; floatSpeed: number }[] = []

    const makeDumbbell = (color: number) => {
      const group = new THREE.Group()
      const barMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 })
      const plateMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.4 })

      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 16), barMat)
      bar.rotation.z = Math.PI / 2
      group.add(bar)

      const plateGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 24)
      const p1 = new THREE.Mesh(plateGeom, plateMat); p1.rotation.z = Math.PI / 2; p1.position.x = 0.95; group.add(p1)
      const p2 = new THREE.Mesh(plateGeom, plateMat); p2.rotation.z = Math.PI / 2; p2.position.x = -0.95; group.add(p2)

      return group
    }

    const colors = [0x7c3aed, 0xD4A853, 0xa78bfa, 0x5b21b6, 0xD4A853, 0x7c3aed, 0xa78bfa, 0x7c3aed]
    for (let i = 0; i < 8; i++) {
      const d = makeDumbbell(colors[i])
      d.position.x = (Math.random() - 0.5) * 20
      d.position.y = (Math.random() - 0.5) * 14
      d.position.z = (Math.random() - 0.5) * 6
      d.rotation.x = Math.random() * Math.PI
      d.rotation.y = Math.random() * Math.PI
      scene.add(d)
      dumbbells.push({
        group: d,
        speed: 0.001 + Math.random() * 0.002,
        offset: Math.random() * Math.PI * 2,
        floatSpeed: 0.0008 + Math.random() * 0.0012,
      })
    }

    let frameId: number
    const clock = new THREE.Clock()
    const animate = () => {
      const t = clock.getElapsedTime()
      dumbbells.forEach((d) => {
        d.group.rotation.x += d.speed
        d.group.rotation.y += d.speed * 0.6
        d.group.position.y += Math.sin(t * d.floatSpeed * 10 + d.offset) * 0.003
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

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" />
}