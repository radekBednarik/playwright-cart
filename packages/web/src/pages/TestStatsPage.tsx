import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import TestStatsPanel from '../components/TestStatsPanel.js'
import { useTestHistory } from '../hooks/useTestHistory.js'

export default function TestStatsPage() {
  const { testId } = useParams<{ testId: string }>()
  const location = useLocation()
  const [limit, setLimit] = useState(25)

  const backTo = (location.state as { from?: string } | null)?.from ?? '/charts/test-reliability'

  const { data, isLoading, error } = useTestHistory(testId ?? null, limit, undefined)

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <p className="mb-4 font-mono text-xs text-tn-muted">
        <Link to={backTo} className="text-tn-blue hover:underline">
          ← Back
        </Link>
      </p>

      <h1 className="mb-6 font-display text-2xl font-bold">Test Reliability</h1>

      <TestStatsPanel
        data={data}
        isLoading={isLoading}
        error={error as Error | null}
        limit={limit}
        onLimitChange={setLimit}
      />
    </div>
  )
}
