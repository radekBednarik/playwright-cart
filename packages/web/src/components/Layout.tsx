import { Outlet } from 'react-router-dom'
import { useServerEvents } from '../hooks/useServerEvents.js'
import TopNav from './TopNav.js'

export default function Layout() {
  useServerEvents()
  return (
    <div className="min-h-screen bg-tn-bg text-tn-fg">
      <TopNav />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
