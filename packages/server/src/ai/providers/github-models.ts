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

// Model IDs use the openai/ prefix (GitHub Models inference endpoint; azure-openai/ endpoint deprecated Jul 2025).
// Update this list when GitHub Models adds or retires models.
const MODELS = [
  { id: 'openai/gpt-5', label: 'GPT-5' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano' },
  { id: 'openai/gpt-4.1', label: 'GPT-4.1' },
  { id: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { id: 'openai/gpt-4.1-nano', label: 'GPT-4.1 Nano' },
  { id: 'openai/gpt-4o', label: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'openai/o3', label: 'OpenAI o3' },
  { id: 'openai/o4-mini', label: 'OpenAI o4-mini' },
] as const satisfies ReadonlyArray<{ id: string; label: string }>

export class GitHubModelsProvider implements LLMProvider {
  readonly name = 'github-models'
  readonly displayName = 'GitHub Models'
  readonly availableModels = MODELS

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
