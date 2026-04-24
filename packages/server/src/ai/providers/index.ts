import { AnthropicProvider } from './anthropic.js'
import { GitHubModelsProvider } from './github-models.js'
import type { LLMProvider } from './types.js'

const providers: Record<string, LLMProvider> = {
  anthropic: new AnthropicProvider(),
  'github-models': new GitHubModelsProvider(),
}

export function getProvider(name: string): LLMProvider {
  const p = providers[name]
  if (!p) throw new Error(`Unknown LLM provider: ${name}`)
  return p
}

export function listProviders(): {
  name: string
  displayName: string
  models: ReadonlyArray<{ id: string; label: string }>
}[] {
  return Object.values(providers).map((p) => ({
    name: p.name,
    displayName: p.displayName,
    models: p.availableModels,
  }))
}
