import { useQuery } from '@tanstack/react-query'
import { fetchRun } from '../lib/api.js'

export function useRun(runId: string) {
  return useQuery({
    queryKey: ['run', runId],
    queryFn: () => fetchRun(runId),
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ? 5000 : false,
  })
}
