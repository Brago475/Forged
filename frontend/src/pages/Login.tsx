import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { api } from '../hooks/api'

interface Props {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  // ── Three.js scene ──
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    camera.position.z = 6

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    // ── Logo plane ──
    const textureLoader = new THREE.TextureLoader()
    const logoTexture = textureLoader.load('/logo-removebg-preview.png')
    logoTexture.colorSpace = THREE.SRGBColorSpace
    logoTexture.anisotropy = 16
    logoTexture.minFilter = THREE.LinearMipmapLinearFilter
    logoTexture.magFilter = THREE.LinearFilter

    const logoGeometry = new THREE.PlaneGeometry(3, 3)
    const logoMaterial = new THREE.MeshStandardMaterial({
      map: logoTexture,
      transparent: true,
      metalness: 0.9,
      roughness: 0.15,
      emissive: new THREE.Color(0x6d28d9),
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide,
    })
    const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial)
    scene.add(logoMesh)

    // ── Glow plane behind logo ──
    const glowGeometry = new THREE.PlaneGeometry(8, 8)
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = glowCanvas.height = 512
    const ctx = glowCanvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256)
    gradient.addColorStop(0, 'rgba(109, 40, 217, 0.9)')
    gradient.addColorStop(0.35, 'rgba(109, 40, 217, 0.3)')
    gradient.addColorStop(0.7, 'rgba(212, 168, 83, 0.08)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    const glowTexture = new THREE.CanvasTexture(glowCanvas)
    const glowMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    glowMesh.position.z = -1
    scene.add(glowMesh)

    // ── Orbital particles ──
    const PARTICLE_COUNT = 300
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const speeds = new Float32Array(PARTICLE_COUNT)
    const radii = new Float32Array(PARTICLE_COUNT)
    const phases = new Float32Array(PARTICLE_COUNT)

    const purpleColor = new THREE.Color(0x9f7aea)
    const goldColor = new THREE.Color(0xd4a853)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 2 + Math.random() * 3
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 4

      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.5

      const useGold = Math.random() > 0.5
      const c = useGold ? goldColor : purpleColor
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b

      sizes[i] = Math.random() * 0.04 + 0.01
      speeds[i] = (Math.random() * 0.5 + 0.5) * (Math.random() > 0.5 ? 1 : -1) * 0.002
      radii[i] = radius
      phases[i] = angle
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // Soft circular particle shape
    const particleCanvas = document.createElement('canvas')
    particleCanvas.width = particleCanvas.height = 64
    const pctx = particleCanvas.getContext('2d')!
    const pGradient = pctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    pGradient.addColorStop(0, 'rgba(255,255,255,1)')
    pGradient.addColorStop(0.4, 'rgba(255,255,255,0.5)')
    pGradient.addColorStop(1, 'rgba(255,255,255,0)')
    pctx.fillStyle = pGradient
    pctx.fillRect(0, 0, 64, 64)
    const particleTexture = new THREE.CanvasTexture(particleCanvas)

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    // ── Lights ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)
    const purpleLight = new THREE.PointLight(0x6d28d9, 3, 15)
    purpleLight.position.set(-3, 2, 3)
    scene.add(purpleLight)
    const goldLight = new THREE.PointLight(0xd4a853, 2.5, 12)
    goldLight.position.set(3, -2, 3)
    scene.add(goldLight)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5)
    rimLight.position.set(0, 0, 5)
    scene.add(rimLight)

    // ── Resize ──
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

    // ── Mouse parallax ──
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Animation loop ──
    const clock = new THREE.Clock()
    let frameId: number

    const animate = () => {
      const t = clock.getElapsedTime()

      // Logo: slow rotation + float
      logoMesh.rotation.y = Math.sin(t * 0.3) * 0.25
      logoMesh.rotation.x = Math.sin(t * 0.2) * 0.08
      logoMesh.position.y = Math.sin(t * 0.6) * 0.12

      // Glow: subtle breathing
      const breathe = 1 + Math.sin(t * 0.8) * 0.05
      glowMesh.scale.set(breathe, breathe, 1)
      glowMesh.rotation.z = t * 0.05

      // Particles orbit
      const posAttr = particles.geometry.attributes.position as THREE.BufferAttribute
      const posArr = posAttr.array as Float32Array
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3
        const angle = phases[i] + t * speeds[i] * 60
        posArr[idx] = Math.cos(angle) * radii[i]
        posArr[idx + 2] = Math.sin(angle) * radii[i] * 0.5
        posArr[idx + 1] += Math.sin(t * 0.5 + i) * 0.002
      }
      posAttr.needsUpdate = true

      // Parallax
      const targetX = mouseRef.current.x * 0.3
      const targetY = -mouseRef.current.y * 0.2
      camera.position.x += (targetX - camera.position.x) * 0.03
      camera.position.y += (targetY - camera.position.y) * 0.03
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      logoGeometry.dispose()
      logoMaterial.dispose()
      logoTexture.dispose()
      glowGeometry.dispose()
      glowMaterial.dispose()
      glowTexture.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
      particleTexture.dispose()
      renderer.dispose()
    }
  }, [])

  // ── Form submit ──
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
    <div className="fixed inset-0 bg-[#050507] overflow-hidden">
      {/* ─── Left side: 3D scene + marketing content ─── */}
      <div className="absolute inset-0 lg:right-[480px]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Radial gradient vignette overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, transparent 0%, transparent 40%, rgba(5,5,7,0.6) 100%)'
          }} />

        {/* Marketing content - only shown on desktop */}
        <div className="absolute inset-0 hidden lg:flex flex-col justify-end p-16 pointer-events-none">
          <div className="max-w-lg">
            <p className="text-[10px] font-black text-[#D4A853] uppercase tracking-[0.25em] mb-4"
              style={{ animation: 'fadeInUp 0.8s 0.2s ease-out both' }}>
              TCW Studio
            </p>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] mb-5"
              style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
              Track. Build.
              <br />
              <span className="bg-gradient-to-r from-[#9F7AEA] via-[#D4A853] to-[#9F7AEA] bg-clip-text text-transparent">
                Transform.
              </span>
            </h1>
            <p className="text-base text-white/60 leading-relaxed mb-8 max-w-md"
              style={{ animation: 'fadeInUp 0.8s 0.6s ease-out both' }}>
              Your complete fitness companion. From heavy compound lifts to precise macros,
              forge the body you're working toward.
            </p>

            <div className="flex flex-wrap gap-2"
              style={{ animation: 'fadeInUp 0.8s 0.8s ease-out both' }}>
              <FeaturePill label="Training" />
              <FeaturePill label="Nutrition" />
              <FeaturePill label="Transformation" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right side: login card ─── */}
      <div className="absolute inset-0 lg:inset-auto lg:top-0 lg:right-0 lg:bottom-0 lg:w-[480px] flex items-center justify-center px-4 lg:px-0 pointer-events-none">

        {/* Mobile marketing (over 3D scene) */}
        <div className="absolute inset-0 lg:hidden flex flex-col justify-start items-center pt-16 pointer-events-none">
          <p className="text-[10px] font-black text-[#D4A853] uppercase tracking-[0.25em] mb-3"
            style={{ animation: 'fadeInUp 0.8s 0.2s ease-out both' }}>
            TCW Studio
          </p>
          <h1 className="text-3xl font-black text-white leading-[1.1] text-center px-8"
            style={{ animation: 'fadeInUp 0.8s 0.4s ease-out both' }}>
            Track. Build.{' '}
            <span className="bg-gradient-to-r from-[#9F7AEA] via-[#D4A853] to-[#9F7AEA] bg-clip-text text-transparent">
              Transform.
            </span>
          </h1>
        </div>

        {/* Card backdrop for desktop - separator from 3D */}
        <div className="hidden lg:block absolute inset-0"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(5,5,7,0.8) 20%, rgba(5,5,7,0.95))',
            backdropFilter: 'blur(4px)',
          }} />

        {/* Login card */}
        <div className="relative w-full max-w-sm px-8 py-10 lg:px-10 lg:py-12
          lg:bg-white/[0.03] lg:border lg:border-white/[0.08]
          rounded-3xl pointer-events-auto"
          style={{
            animation: 'fadeInUp 0.8s 0.3s ease-out both',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 0 80px rgba(109,40,217,0.12), 0 20px 60px rgba(0,0,0,0.4)',
          }}>

          {/* Logo + wordmark */}
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6D28D9, #D4A853)',
                boxShadow: '0 6px 20px rgba(109,40,217,0.4)',
              }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 6.5L17.5 17.5"/>
                <path d="M2 12l2-2 2 2"/>
                <path d="M18 12l2-2 2 2"/>
              </svg>
            </div>
            <p className="text-2xl font-black text-white tracking-[0.2em]">FORGED</p>
          </div>
          <p className="text-center text-[11px] text-white/40 tracking-[0.15em] font-bold mb-10">
            Welcome back
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 text-xs text-red-300"
                style={{ animation: 'shake 0.4s ease-out' }}>
                {error}
              </div>
            )}

            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              focused={focused === 'email'}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              icon={
                <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/></>
              }
            />

            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              focused={focused === 'password'}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              icon={
                <><rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/></>
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="relative mt-2 py-3.5 rounded-xl text-white font-black text-sm
                tracking-[0.15em] uppercase overflow-hidden
                transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
              style={{
                background: 'linear-gradient(135deg, #6D28D9, #4c1d95)',
                boxShadow: '0 10px 30px rgba(109,40,217,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}>
              <span className="relative z-10">
                {loading ? 'Signing in...' : 'Sign in'}
              </span>
              {/* Shine sweep on hover */}
              <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-1000"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[0.5px] bg-white/10" />
            <span className="text-[10px] text-white/30 font-black tracking-[0.2em]">OR</span>
            <div className="flex-1 h-[0.5px] bg-white/10" />
          </div>

          <p className="text-center text-xs text-white/50">
            New to FORGED?{' '}
            <Link to="/register" className="text-[#D4A853] font-black hover:brightness-125 transition-all">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Keyframes */}
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

// ══════════════════════════════════
// INPUT FIELD
// ══════════════════════════════════
function InputField({
  label, type, value, onChange, placeholder, icon, focused, onFocus, onBlur,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon: React.ReactNode
  focused: boolean
  onFocus: () => void
  onBlur: () => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.15em] mb-2">
        {label}
      </label>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04]
        border transition-all
        ${focused
          ? 'border-[#6D28D9]/60 shadow-[0_0_0_3px_rgba(109,40,217,0.1)]'
          : 'border-white/[0.08] hover:border-white/[0.15]'}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke={focused ? '#D4A853' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="transition-colors flex-shrink-0">
          {icon}
        </svg>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          required
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 outline-none"
        />
      </div>
    </div>
  )
}

// ══════════════════════════════════
// FEATURE PILL
// ══════════════════════════════════
function FeaturePill({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full
      bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A853]" />
      <span className="text-xs font-black text-white/80 tracking-[0.1em] uppercase">
        {label}
      </span>
    </div>
  )
}