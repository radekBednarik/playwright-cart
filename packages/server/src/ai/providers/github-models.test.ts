import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('openai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openai')>()
  return {
    ...actual,
    // biome-ignore lint/complexity/useArrowFunction: must be constructor-compatible for `new OpenAI()`
    default: vi.fn().mockImplementation(function () {
      return {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'Test failed due to timeout in payment flow.' } }],
            }),
          },
        },
      }
    }),
  }
})

import { GitHubModelsProvider } from './github-models.js'

describe('GitHubModelsProvider', () => {
  let provider: GitHubModelsProvider

  beforeEach(() => {
    provider = new GitHubModelsProvider()
  })

  it('exposes correct name, displayName, and available models', () => {
    expect(provider.name).toBe('github-models')
    expect(provider.displayName).toBe('GitHub Models')
    expect(provider.availableModels.length).toBe(10)
    expect(provider.availableModels[0]).toHaveProperty('id')
    expect(provider.availableModels[0]).toHaveProperty('label')
  })

  it('returns generated text from the API', async () => {
    const result = await provider.generateSummary({
      prompt: 'Summarise this failure',
      images: [],
      model: 'openai/gpt-4o',
      apiKey: 'ghp_test',
    })
    expect(result).toBe('Test failed due to timeout in payment flow.')
  })

  it('includes images as data URIs in image_url content when provided', async () => {
    const OpenAI = (await import('openai')).default
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'summary' } }],
    })
    // biome-ignore lint/complexity/useArrowFunction: must be constructor-compatible for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await p.generateSummary({
      prompt: 'Summarise',
      images: [{ data: 'base64data', mediaType: 'image/png' }],
      model: 'openai/gpt-4o',
      apiKey: 'ghp_test',
    })

    const call = mockCreate.mock.calls[0][0]
    const imageBlock = call.messages[0].content.find(
      (b: { type: string }) => b.type === 'image_url',
    )
    expect(imageBlock).toBeDefined()
    expect(imageBlock.image_url.url).toMatch(/^data:image\/png;base64,/)
    expect(imageBlock.image_url.url).toBe('data:image/png;base64,base64data')
  })

  it('throws ProviderError with auth category when API returns 401', async () => {
    const OpenAI = (await import('openai')).default
    const { AuthenticationError } = await import('openai')
    const mockCreate = vi
      .fn()
      .mockRejectedValue(
        new AuthenticationError(
          401,
          { message: 'Unauthorized' },
          'Unauthorized',
          new Headers() as never,
        ),
      )
    // biome-ignore lint/complexity/useArrowFunction: must be constructor-compatible for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await expect(
      p.generateSummary({ prompt: 'test', images: [], model: 'openai/gpt-4o', apiKey: 'bad' }),
    ).rejects.toThrow('API key is invalid or has been revoked — check your AI settings.')
  })

  it('throws ProviderError with rate_limit category when API returns 429', async () => {
    const OpenAI = (await import('openai')).default
    const { RateLimitError } = await import('openai')
    const mockCreate = vi
      .fn()
      .mockRejectedValue(
        new RateLimitError(
          429,
          { message: 'Too Many Requests' },
          'Too Many Requests',
          new Headers() as never,
        ),
      )
    // biome-ignore lint/complexity/useArrowFunction: must be constructor-compatible for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await expect(
      p.generateSummary({ prompt: 'test', images: [], model: 'openai/gpt-4o', apiKey: 'ghp' }),
    ).rejects.toThrow('The AI provider rate limit was reached. Try again in a few minutes.')
  })

  it('throws ProviderError with unknown category for non-APIError exceptions', async () => {
    const OpenAI = (await import('openai')).default
    const mockCreate = vi.fn().mockRejectedValue(new Error('some internal error'))
    // biome-ignore lint/complexity/useArrowFunction: must be constructor-compatible for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await expect(
      p.generateSummary({ prompt: 'test', images: [], model: 'openai/gpt-4o', apiKey: 'ghp' }),
    ).rejects.toThrow('An unexpected error occurred while generating the summary.')
  })

  it('throws ProviderError with permission category when API returns 403', async () => {
    const OpenAI = (await import('openai')).default
    const { PermissionDeniedError } = await import('openai')
    const mockCreate = vi
      .fn()
      .mockRejectedValue(
        new PermissionDeniedError(
          403,
          { message: 'Forbidden' },
          'Forbidden',
          new Headers() as never,
        ),
      )
    // biome-ignore lint/complexity/useArrowFunction: must be constructor-compatible for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await expect(
      p.generateSummary({ prompt: 'test', images: [], model: 'openai/gpt-4o', apiKey: 'ghp' }),
    ).rejects.toThrow(
      'The API key does not have permission to use this model — check your AI settings.',
    )
  })

  it('throws ProviderError with server_error category when API returns 500', async () => {
    const OpenAI = (await import('openai')).default
    const { InternalServerError } = await import('openai')
    const mockCreate = vi
      .fn()
      .mockRejectedValue(
        new InternalServerError(
          500,
          { message: 'Internal Server Error' },
          'Internal Server Error',
          new Headers() as never,
        ),
      )
    // biome-ignore lint/complexity/useArrowFunction: must be constructor-compatible for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await expect(
      p.generateSummary({ prompt: 'test', images: [], model: 'openai/gpt-4o', apiKey: 'ghp' }),
    ).rejects.toThrow('The AI provider is experiencing issues. Try again later.')
  })

  it('throws ProviderError with connection_timeout category on timeout', async () => {
    const OpenAI = (await import('openai')).default
    const { APIConnectionTimeoutError } = await import('openai')
    const mockCreate = vi.fn().mockRejectedValue(new APIConnectionTimeoutError())
    // biome-ignore lint/complexity/useArrowFunction: must be constructor-compatible for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await expect(
      p.generateSummary({ prompt: 'test', images: [], model: 'openai/gpt-4o', apiKey: 'ghp' }),
    ).rejects.toThrow('The request to the AI provider timed out. Try again later.')
  })

  it('throws ProviderError with unknown category when response has no content', async () => {
    const OpenAI = (await import('openai')).default
    const mockCreate = vi.fn().mockResolvedValue({ choices: [{ message: { content: null } }] })
    // biome-ignore lint/complexity/useArrowFunction: must be constructor-compatible for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await expect(
      p.generateSummary({ prompt: 'test', images: [], model: 'openai/gpt-4o', apiKey: 'ghp' }),
    ).rejects.toThrow('An unexpected error occurred while generating the summary.')
  })

  it('throws ProviderError with connection category on connection error', async () => {
    const OpenAI = (await import('openai')).default
    const { APIConnectionError } = await import('openai')
    const mockCreate = vi
      .fn()
      .mockRejectedValue(new APIConnectionError({ message: 'Connection failed' }))
    // biome-ignore lint/complexity/useArrowFunction: must be a constructor-compatible function for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await expect(
      p.generateSummary({ prompt: 'test', images: [], model: 'openai/gpt-4o', apiKey: 'sk' }),
    ).rejects.toThrow(
      'Could not connect to the AI provider. Check your network or try again later.',
    )
  })

  it('throws ProviderError with bad_request category when provider rejects request', async () => {
    const OpenAI = (await import('openai')).default
    const { BadRequestError } = await import('openai')
    const mockCreate = vi
      .fn()
      .mockRejectedValue(
        new BadRequestError(400, { message: 'Bad Request' }, 'Bad Request', new Headers() as never),
      )
    // biome-ignore lint/complexity/useArrowFunction: must be a constructor-compatible function for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await expect(
      p.generateSummary({ prompt: 'test', images: [], model: 'openai/gpt-4o', apiKey: 'sk' }),
    ).rejects.toThrow(
      'The request was rejected by the AI provider. Check your model selection in Settings.',
    )
  })

  it('throws ProviderError with unknown category when response has empty choices', async () => {
    const OpenAI = (await import('openai')).default
    const mockCreate = vi.fn().mockResolvedValue({ choices: [] })
    // biome-ignore lint/complexity/useArrowFunction: must be a constructor-compatible function for `new OpenAI()`
    vi.mocked(OpenAI).mockImplementation(function () {
      return { chat: { completions: { create: mockCreate } } } as never
    })

    const p = new GitHubModelsProvider()
    await expect(
      p.generateSummary({ prompt: 'test', images: [], model: 'openai/gpt-4o', apiKey: 'sk' }),
    ).rejects.toThrow('An unexpected error occurred while generating the summary.')
  })
})
