import { useQuery } from '@tanstack/react-query'
import { fetchTest } from '../lib/api.js'

export function useTest(runId: string, testId: string) {
  return useQuery({
    queryKey: ['test', runId, testId],
    queryFn: () => fetchTest(runId, testId),
  })
}
