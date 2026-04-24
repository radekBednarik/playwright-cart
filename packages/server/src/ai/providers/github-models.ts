import OpenAI, {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  PermissionDeniedError,
  RateLimitError,
} from 'openai'
import { ProviderError } from '../errors.js'
import type { LLMProvider } from './types.js'

const FALLBACK_MODELS = [
  { id: 'openai/gpt-4.1', label: 'GPT-4.1' },
  { id: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { id: 'openai/gpt-4.1-nano', label: 'GPT-4.1 Nano' },
  { id: 'openai/gpt-4o', label: 'GPT-4o' },
]

export class GitHubModelsProvider implements LLMProvider {
  readonly name = 'github-models'
  readonly displayName = 'GitHub Models'
  availableModels = FALLBACK_MODELS

  constructor() {
    // Fire-and-forget catalog fetch in background; errors swallowed, fallback used
    this.#refreshCatalog()
  }

  async #refreshCatalog() {
    try {
      const res = await fetch('https://models.github.ai/catalog/models', {
        headers: { Accept: 'application/vnd.github+json' },
      })
      if (!res.ok) return
      const data = await res.json()
      // GitHub catalog response is an array at the top level.
      // Each item has: id (string), task (string), friendly_name (string)
      // Filter for chat-completion capable models only.
      const raw: unknown[] = Array.isArray(data) ? data : []
      const models = raw
        .filter(
          (m): m is { id: string; task: string; friendly_name?: string; name?: string } =>
            typeof m === 'object' &&
            m !== null &&
            typeof (m as { id?: unknown }).id === 'string' &&
            (m as { task?: unknown }).task === 'chat-completion',
        )
        .map((m) => ({ id: m.id, label: m.friendly_name ?? m.name ?? m.id }))
      if (models.length > 0) this.availableModels = models
    } catch {
      // silently fall back to FALLBACK_MODELS
    }
  }

  async generateSummary(opts: {
    prompt: string
    images: { data: string; mediaType: string }[]
    model: string
    apiKey: string
  }): Promise<string> {
    const client = new OpenAI({
      apiKey: opts.apiKey,
      baseURL: 'https://models.github.ai/inference',
    })

    // OpenAI vision format: image_url with data URI
    const imageContent = opts.images.map((img) => ({
      type: 'image_url' as const,
      image_url: { url: `data:${img.mediaType};base64,${img.data}` },
    }))

    const content = [...imageContent, { type: 'text' as const, text: opts.prompt }]

    try {
      const response = await client.chat.completions.create({
        model: opts.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content }],
      })

      const text = response.choices[0]?.message.content
      if (!text) throw new ProviderError('unknown')
      return text
    } catch (err) {
      if (err instanceof ProviderError) throw err
      if (err instanceof AuthenticationError) throw new ProviderError('auth')
      if (err instanceof PermissionDeniedError) throw new ProviderError('permission')
      if (err instanceof RateLimitError) throw new ProviderError('rate_limit')
      if (err instanceof InternalServerError) throw new ProviderError('server_error')
      if (err instanceof APIConnectionTimeoutError) throw new ProviderError('connection_timeout')
      if (err instanceof APIConnectionError) throw new ProviderError('connection')
      if (err instanceof BadRequestError) throw new ProviderError('bad_request')
      if (err instanceof APIError) throw new ProviderError('unknown')
      throw new ProviderError('unknown')
    }
  }
}
