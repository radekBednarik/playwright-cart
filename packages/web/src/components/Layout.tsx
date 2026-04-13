import { Outlet } from 'react-router-dom'
import { useServerEvents } from '../hooks/useServerEvents.js'
import ExternalLink from './ExternalLink.js'
import TopNav from './TopNav.js'

export default function Layout() {
  useServerEvents()
  return (
    <div className="flex min-h-screen flex-col bg-tn-bg text-tn-fg">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-tn-border">
        <div className="mx-auto flex w-full max-w-7xl justify-end px-6 py-4 text-sm text-tn-muted">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <ExternalLink
              href="https://github.com/radekBednarik/playwright-cart"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-tn-fg"
            >
              GitHub Repository
            </ExternalLink>
            <ExternalLink
              href="https://radekbednarik.github.io/playwright-cart/"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-tn-fg"
            >
              Project Page
            </ExternalLink>
          </div>
        </div>
      </footer>
    </div>
  )
}
