import { useQuery } from '@tanstack/react-query'
import { fetchRuns, type RunsParams } from '../lib/api.js'

export function useRuns(params: RunsParams) {
  return useQuery({
    queryKey: ['runs', params],
    queryFn: () => fetchRuns(params),
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  })
}
