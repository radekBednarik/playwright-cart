import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import { login } from '../lib/api.js'

export default function LoginPage() {
  const { user, isLoading } = useCurrentUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isLoading && user) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username, password)
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tn-bg px-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Accent line */}
        <div className="mb-8 h-0.5 w-12 rounded-full bg-gradient-to-r from-tn-blue to-tn-purple" />

        {/* Title */}
        <h1 className="mb-8 font-display text-2xl font-bold uppercase tracking-[0.15em] text-tn-fg">
          Playwright Cart
        </h1>

        <div className="rounded-2xl border border-tn-border bg-tn-panel p-8 shadow-2xl shadow-black/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block font-display text-xs font-semibold uppercase tracking-widest text-tn-muted"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-tn-border/60 bg-tn-bg/60 px-4 py-2.5 text-sm text-tn-fg outline-none transition-colors placeholder:text-tn-muted/50 focus:border-tn-blue"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block font-display text-xs font-semibold uppercase tracking-widest text-tn-muted"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-tn-border/60 bg-tn-bg/60 px-4 py-2.5 text-sm text-tn-fg outline-none transition-colors placeholder:text-tn-muted/50 focus:border-tn-blue"
              />
            </div>
            {error && <p className="font-mono text-xs text-tn-red">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-tn-purple py-2.5 font-display text-sm font-semibold tracking-wide text-white transition-colors hover:bg-tn-blue disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
