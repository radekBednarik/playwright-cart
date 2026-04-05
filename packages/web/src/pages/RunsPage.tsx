import { useSearchParams } from 'react-router-dom'
import { FilterBar, applyFilters } from '../components/FilterBar.js'
import RunsTable from '../components/RunsTable.js'
import StatsBar from '../components/StatsBar.js'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import { useRuns } from '../hooks/useRuns.js'

export default function RunsPage() {
  const [params] = useSearchParams()
  const { data: runs, isLoading, error, refetch } = useRuns()
  const { isAdmin } = useCurrentUser()

  if (isLoading) return <Skeleton />

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="mb-2 font-mono text-sm text-tn-red">Failed to load runs.</p>
        <p className="mb-4 font-mono text-xs text-tn-muted">{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border border-tn-border px-4 py-2 font-display text-sm text-tn-fg transition-colors hover:bg-tn-highlight"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!runs || runs.length === 0) return <EmptyState />

  const filtered = applyFilters(runs, params)

  return (
    <div>
      {/* Page header: title left, filters right */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-lg font-bold uppercase tracking-[0.15em] text-tn-fg">
          Runs
        </h1>
        <FilterBar runs={runs} />
      </div>

      {/* Stats strip */}
      <StatsBar runs={runs} />

      {/* Table */}
      <RunsTable runs={filtered} isAdmin={isAdmin} onDeleteSuccess={() => refetch()} />
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-5 w-16 rounded bg-tn-panel" />
        <div className="h-5 w-48 rounded bg-tn-panel" />
      </div>
      <div className="flex gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 w-24 rounded bg-tn-panel" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-tn-border bg-tn-panel">
        <div className="h-10 border-b-2 border-tn-border" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 border-b border-tn-border last:border-0" />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="mb-6 font-display text-7xl font-bold leading-none text-tn-border">PW</div>
      <h2 className="mb-2 font-display text-lg font-bold text-tn-fg">No test runs yet</h2>
      <p className="mb-8 text-sm text-tn-muted">
        Add the reporter to your Playwright config to get started:
      </p>
      <pre className="mx-auto max-w-xl overflow-x-auto rounded-xl border border-tn-border bg-tn-panel p-5 text-left font-mono text-xs text-tn-fg">
        {`// playwright.config.ts
reporter: [
  ['html'],
  ['@playwright-cart/reporter', {
    serverUrl: 'http://localhost:3001',
    project: 'my-app',
    apiKey: 'your api-key',
    uploadConcurrency: 'optional: default is 3',
    retries: 'optional: default is 3',
    retryDelay: 'optional: default is 500ms, doubles each attempt',
    branch: 'optional: git branch name',
    commitSha: 'optional: git commit SHA',
  }],
]`}
      </pre>
    </div>
  )
}
