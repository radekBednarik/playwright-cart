// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RunAiSummaryTab, RunningState, TestAiSummaryTab } from './AiSummaryTab.js'

vi.mock('../hooks/useAiSummary.js', () => ({
  useRunSummary: vi.fn(),
  useTestSummary: vi.fn(),
  useInvalidateRunSummary: vi.fn(),
  useInvalidateTestSummary: vi.fn(),
}))

vi.mock('../lib/api.js', () => ({
  regenerateRunSummary: vi.fn(),
  regenerateTestSummary: vi.fn(),
}))

const {
  useRunSummary,
  useTestSummary,
  useInvalidateRunSummary,
  useInvalidateTestSummary,
} = await import('../hooks/useAiSummary.js')

class MockEventSource {
  static instances: MockEventSource[] = []

  private listeners = new Map<string, Set<(event: MessageEvent) => void>>()

  constructor(_url: string, _init?: EventSourceInit) {
    MockEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    const listeners = this.listeners.get(type) ?? new Set()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.listeners.get(type)?.delete(listener)
  }

  close() {}

  emit(type: string, data: unknown) {
    const event = { data: JSON.stringify(data) } as MessageEvent
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }
}

function renderWithClient(node: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>)
}

describe('RunningState', () => {
  it('renders the running info message', () => {
    renderWithClient(<RunningState />)

    expect(screen.getByText('Tests are currently running')).toBeTruthy()
    expect(screen.getByText(/Summary will be generated automatically/)).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('AiSummaryTab SSE refresh', () => {
  beforeEach(() => {
    MockEventSource.instances = []
    vi.stubGlobal('EventSource', MockEventSource)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('invalidates run summary when summary generation starts', async () => {
    const invalidate = vi.fn()
    vi.mocked(useRunSummary).mockReturnValue({ data: null, isLoading: false } as never)
    vi.mocked(useInvalidateRunSummary).mockReturnValue(invalidate)

    renderWithClient(<RunAiSummaryTab runId="run-1" runStatus="failed" />)

    expect(screen.getByText('No summary available')).toBeTruthy()

    MockEventSource.instances[0]?.emit('summary_run_start', { runId: 'run-1' })

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith('run-1'))
  })

  it('invalidates test summary when summary generation starts', async () => {
    const invalidate = vi.fn()
    vi.mocked(useTestSummary).mockReturnValue({ data: null, isLoading: false } as never)
    vi.mocked(useInvalidateTestSummary).mockReturnValue(invalidate)

    renderWithClient(<TestAiSummaryTab runId="run-1" testId="test-1" runStatus="failed" />)

    expect(screen.getByText('No summary available')).toBeTruthy()

    MockEventSource.instances[0]?.emit('summary_test_start', { runId: 'run-1', testId: 'test-1' })

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith('run-1', 'test-1'))
  })
})
