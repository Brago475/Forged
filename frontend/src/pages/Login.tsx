import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../hooks/api'

interface Props {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen bg-forged-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white text-center mb-2">FORGED</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Track. Build. Transform.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-forged-surface border border-forged-border rounded-lg text-white text-sm focus:border-forged-gold transition"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-forged-surface border border-forged-border rounded-lg text-white text-sm focus:border-forged-gold transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-forged-gold text-black font-semibold rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          No account?{' '}
          <Link to="/register" className="text-forged-gold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}