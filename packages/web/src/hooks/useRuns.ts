import { useQuery } from '@tanstack/react-query'
import { fetchRuns } from '../lib/api.js'

export function useRuns() {
  return useQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
    staleTime: 30_000,
  })
}
