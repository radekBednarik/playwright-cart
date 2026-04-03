import { Link, useParams } from 'react-router-dom'
import RunHeader from '../components/RunHeader.js'
import RunStats from '../components/RunStats.js'
import SuiteGroup from '../components/SuiteGroup.js'
import { useRun } from '../hooks/useRun.js'
import type { TestRecord } from '../lib/api.js'

export default function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>()
  const { data: run, isLoading, error } = useRun(runId!)

  if (isLoading) return <Skeleton />

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-tn-muted">
          {error.name === 'NotFoundError' ? 'Run not found.' : error.message}
        </p>
        <Link to="/" className="text-tn-blue hover:text-tn-purple">
          ← All runs
        </Link>
      </div>
    )
  }

  if (!run) return null

  const suites = groupBySuite(run.tests)

  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-block text-sm text-tn-blue hover:text-tn-purple"
      >
        ← All runs
      </Link>
      <RunHeader run={run} />
      <RunStats tests={run.tests} />
      {run.tests.length === 0 ? (
        <p className="py-8 text-center text-tn-muted">
          No test results uploaded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {[...suites.entries()].map(([suite, tests]) => (
            <SuiteGroup
              key={suite}
              runId={run.runId}
              suite={suite}
              tests={tests}
            />
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
    map.get(suite)!.push(test)
  }
  return map
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-24 rounded bg-tn-highlight" />
      <div className="h-16 rounded-lg bg-tn-highlight" />
      <div className="h-6 w-48 rounded bg-tn-highlight" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 rounded-lg bg-tn-highlight" />
      ))}
    </div>
  )
}
