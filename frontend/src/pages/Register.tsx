import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../hooks/api'

interface Props {
  onLogin: (token: string) => void
}

export default function Register({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen bg-forged-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white text-center mb-2">FORGED</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-forged-surface border border-forged-border rounded-lg text-white text-sm focus:border-forged-gold transition"
              placeholder="Evan"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-forged-surface border border-forged-border rounded-lg text-white text-sm focus:border-forged-gold transition"
              placeholder="evan"
            />
          </div>

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
              minLength={8}
              className="w-full px-4 py-3 bg-forged-surface border border-forged-border rounded-lg text-white text-sm focus:border-forged-gold transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-forged-gold text-black font-semibold rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-forged-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}