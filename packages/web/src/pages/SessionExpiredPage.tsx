import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const REDIRECT_SECONDS = 15

export default function SessionExpiredPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    queryClient.setQueryData(['me'], null)
  }, [queryClient])

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/login', { replace: true })
      return
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-tn-bg px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 h-0.5 w-12 rounded-full bg-gradient-to-r from-tn-red to-tn-purple" />

        <h1 className="mb-8 font-display text-2xl font-bold uppercase tracking-[0.15em] text-tn-fg">
          Playwright Cart
        </h1>

        <div className="rounded-2xl border border-tn-border bg-tn-panel p-8 shadow-2xl shadow-black/30">
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 font-display text-xs font-semibold uppercase tracking-widest text-tn-red">
                Session Expired
              </h2>
              <p className="text-sm text-tn-muted">
                Your session has expired. You will be automatically redirected to the login page.
              </p>
            </div>

            <div
              role="timer"
              aria-live="polite"
              aria-label={`Redirecting in ${countdown} seconds`}
              className="flex items-center gap-4"
            >
              <div className="flex size-14 items-center justify-center rounded-full border-2 border-tn-red bg-tn-bg font-display text-2xl font-bold text-tn-red">
                {countdown}
              </div>
              <p className="font-mono text-xs text-tn-muted">Redirecting in {countdown}s</p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="mt-2 w-full rounded-lg bg-tn-purple py-2.5 font-display text-sm font-semibold tracking-wide text-white transition-colors hover:bg-tn-blue"
            >
              Login now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
