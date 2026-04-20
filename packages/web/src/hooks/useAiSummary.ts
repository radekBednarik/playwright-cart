import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRunSummary, fetchTestSummary } from '../lib/api.js'

export function useRunSummary(runId: string) {
  return useQuery({
    queryKey: ['run-summary', runId],
    queryFn: () => fetchRunSummary(runId),
    refetchInterval: (query) => (query.state.data?.status === 'generating' ? 3000 : false),
  })
}

export function useTestSummary(runId: string, testId: string) {
  return useQuery({
    queryKey: ['test-summary', runId, testId],
    queryFn: () => fetchTestSummary(runId, testId),
    refetchInterval: (query) => (query.state.data?.status === 'generating' ? 3000 : false),
  })
}

export function useInvalidateRunSummary() {
  const qc = useQueryClient()
  return (runId: string) => qc.invalidateQueries({ queryKey: ['run-summary', runId] })
}

export function useInvalidateTestSummary() {
  const qc = useQueryClient()
  return (runId: string, testId: string) =>
    qc.invalidateQueries({ queryKey: ['test-summary', runId, testId] })
}
