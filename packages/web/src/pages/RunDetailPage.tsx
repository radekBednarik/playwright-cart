import { Link, useParams } from 'react-router-dom'
import RunHeader from '../components/RunHeader.js'
import RunStats from '../components/RunStats.js'
import SuiteGroup from '../components/SuiteGroup.js'
import { useRun } from '../hooks/useRun.js'
import type { TestRecord } from '../lib/api.js'

export default function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>()
  const { data: run, isLoading, error } = useRun(runId ?? '')

  if (isLoading) return <Skeleton />

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 font-mono text-sm text-tn-muted">
          {error.name === 'NotFoundError' ? 'Run not found.' : error.message}
        </p>
        <Link
          to="/"
          className="font-display text-xs font-semibold uppercase tracking-widest text-tn-blue transition-colors hover:text-tn-purple"
        >
          ← All runs
        </Link>
      </div>
    )
  }

  if (!run) return null

  const suites = groupBySuite(run.tests)

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-2 font-mono text-xs text-tn-muted">
        <Link to="/" className="transition-colors hover:text-tn-blue">
          Runs
        </Link>
        <span>/</span>
        <span className="text-tn-fg">{run.project}</span>
      </nav>

      {/* Run card with progress bar */}
      <RunHeader run={run} />
      <RunStats tests={run.tests} />

      {/* Suite groups */}
      {run.tests.length === 0 ? (
        <p className="py-8 text-center font-mono text-sm text-tn-muted">
          No test results uploaded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {[...suites.entries()].map(([suite, tests]) => (
            <SuiteGroup key={suite} runId={run.runId} suite={suite} tests={tests} />
          ))}
        </div>
      )}
    </div>
  )
}

function groupBySuite(tests: TestRecord[]): Map<string, TestRecord[]> {
  const map = new Map<string, TestRecord[]>()
  for (const test of tests) {
    const suite = test.titlePath[0] ?? 'Uncategorized'
    if (!map.has(suite)) map.set(suite, [])
    map.get(suite)?.push(test)
  }
  return map
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-2">
        <div className="h-4 w-10 rounded bg-tn-panel" />
        <div className="h-4 w-4 rounded bg-tn-panel" />
        <div className="h-4 w-24 rounded bg-tn-panel" />
      </div>
      <div className="h-28 rounded-xl border border-tn-border bg-tn-panel" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 rounded-xl border border-tn-border bg-tn-panel" />
      ))}
    </div>
  )
}
