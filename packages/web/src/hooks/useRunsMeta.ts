import { useQuery } from '@tanstack/react-query'
import { fetchRunsMeta } from '../lib/api.js'

export function useRunsMeta() {
  return useQuery({
    queryKey: ['runs-meta'],
    queryFn: fetchRunsMeta,
    staleTime: 5 * 60_000,
  })
}
