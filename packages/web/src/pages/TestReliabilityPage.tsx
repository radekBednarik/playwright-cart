import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TestSearch from '../components/TestSearch.js'
import TestStatsPanel from '../components/TestStatsPanel.js'
import { useTestHistory } from '../hooks/useTestHistory.js'
import type { TestSearchResult } from '../lib/api.js'

export default function TestReliabilityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedTest, setSelectedTest] = useState<TestSearchResult | null>(null)
  const [limit, setLimit] = useState(25)
  const [branch] = useState<string | undefined>(undefined)

  const testIdParam = searchParams.get('testId')

  const { data, isLoading, error } = useTestHistory(
    selectedTest?.testId ?? testIdParam,
    limit,
    branch,
  )

  useEffect(() => {
    if (data?.test && !selectedTest) {
      setSelectedTest(data.test)
    }
  }, [data?.test, selectedTest])

  function handleSelect(test: TestSearchResult) {
    setSelectedTest(test)
    setSearchParams({ testId: test.testId })
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <p className="mb-4 font-mono text-xs text-tn-muted">
        <Link to="/charts" className="text-tn-blue hover:underline">
          Charts
        </Link>
        <span className="mx-2">›</span>
        <span>Test Reliability</span>
      </p>

      <h1 className="mb-6 font-display text-2xl font-bold">Test Reliability</h1>

      <div className="mb-6">
        <TestSearch onSelect={handleSelect} />
      </div>

      <TestStatsPanel
        data={data}
        isLoading={!!selectedTest && isLoading}
        error={error as Error | null}
        limit={limit}
        onLimitChange={setLimit}
      />

      <p className="mt-8 font-mono text-xs">
        <Link to="/charts" className="text-tn-blue hover:underline">
          ← Back to all charts
        </Link>
      </p>
    </div>
  )
}
