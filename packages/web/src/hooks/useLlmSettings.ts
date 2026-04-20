import { useQuery } from '@tanstack/react-query'
import { fetchLlmSettings } from '../lib/api.js'

export function useLlmSettings() {
  return useQuery({
    queryKey: ['llm-settings'],
    queryFn: fetchLlmSettings,
    staleTime: 60_000,
  })
}
