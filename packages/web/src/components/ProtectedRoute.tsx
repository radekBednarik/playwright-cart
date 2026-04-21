import { useEffect } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import { useSessionTimer } from '../hooks/useSessionTimer.js'

export default function ProtectedRoute() {
  const { user, isLoading } = useCurrentUser()
  const sessionTimer = useSessionTimer(user?.expiresAt)
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionTimer && sessionTimer.secondsRemaining <= 0) {
      navigate('/session-expired', { replace: true })
    }
  }, [sessionTimer, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tn-bg text-tn-muted">
        Loading...
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
