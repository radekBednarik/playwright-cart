import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { TestHistoryEntry, TestHistoryResult } from '../lib/api.js'
import TestStatsPanel, { fmtMs } from './TestStatsPanel.js'

const makeEntry = (overrides: Partial<TestHistoryEntry> = {}): TestHistoryEntry => ({
  runId: overrides.runId ?? 'run-1',
  startedAt: overrides.startedAt ?? '2026-04-01T10:00:00.000Z',
  status: overrides.status ?? 'passed',
  durationMs: overrides.durationMs ?? 1000,
  retry: overrides.retry ?? 0,
  branch: overrides.branch ?? 'main',
})

const makeData = (entries: TestHistoryEntry[]): TestHistoryResult => ({
  test: {
    testId: 'test-abc',
    title: 'should work',
    titlePath: ['suite', 'nested', 'should work'],
    locationFile: 'src/tests/foo.spec.ts',
  },
  history: entries,
})

describe('fmtMs', () => {
  it('shows ms for values under 1 second', () => {
    expect(fmtMs(500)).toBe('500ms')
  })

  it('shows seconds for values under 1 minute', () => {
    expect(fmtMs(2500)).toBe('2.5s')
  })

  it('shows minutes and seconds for values over 1 minute', () => {
    expect(fmtMs(90_000)).toBe('1m 30s')
  })
})

describe('TestStatsPanel', () => {
  it('renders nothing when data is undefined and not loading', () => {
    const html = renderToStaticMarkup(
      <TestStatsPanel
        data={undefined}
        isLoading={false}
        error={null}
        limit={25}
        onLimitChange={vi.fn()}
      />,
    )
    expect(html).toBe('')
  })

  it('renders skeleton when loading', () => {
    const html = renderToStaticMarkup(
      <TestStatsPanel
        data={undefined}
        isLoading={true}
        error={null}
        limit={25}
        onLimitChange={vi.fn()}
      />,
    )
    expect(html).toContain('animate-pulse')
  })

  it('shows error message when error provided', () => {
    const html = renderToStaticMarkup(
      <TestStatsPanel
        data={undefined}
        isLoading={false}
        error={new Error('something went wrong')}
        limit={25}
        onLimitChange={vi.fn()}
      />,
    )
    expect(html).toContain('something went wrong')
  })

  it('shows pass rate when all tests pass', () => {
    const data = makeData([makeEntry({ status: 'passed' }), makeEntry({ status: 'passed' })])
    const html = renderToStaticMarkup(
      <TestStatsPanel
        data={data}
        isLoading={false}
        error={null}
        limit={25}
        onLimitChange={vi.fn()}
      />,
    )
    expect(html).toContain('100%')
  })

  it('shows pass rate as 50% when half pass', () => {
    const data = makeData([makeEntry({ status: 'passed' }), makeEntry({ status: 'failed' })])
    const html = renderToStaticMarkup(
      <TestStatsPanel
        data={data}
        isLoading={false}
        error={null}
        limit={25}
        onLimitChange={vi.fn()}
      />,
    )
    expect(html).toContain('50%')
  })

  it('counts flaky runs (retry > 0 and passed) correctly', () => {
    const data = makeData([
      makeEntry({ status: 'passed', retry: 1 }),
      makeEntry({ status: 'passed', retry: 0 }),
    ])
    const html = renderToStaticMarkup(
      <TestStatsPanel
        data={data}
        isLoading={false}
        error={null}
        limit={25}
        onLimitChange={vi.fn()}
      />,
    )
    // 1 flaky (retry=1 + passed), not 2
    const flakyPillMatch = html.match(/(\d+)<\/p><p[^>]*>Flaky runs/)
    expect(flakyPillMatch?.[1]).toBe('1')
  })

  it('counts failures (failed/timedOut/interrupted) correctly', () => {
    const data = makeData([
      makeEntry({ status: 'failed' }),
      makeEntry({ status: 'timedOut' }),
      makeEntry({ status: 'passed' }),
    ])
    const html = renderToStaticMarkup(
      <TestStatsPanel
        data={data}
        isLoading={false}
        error={null}
        limit={25}
        onLimitChange={vi.fn()}
      />,
    )
    // 2 failures (failed + timedOut), not 3
    const failPillMatch = html.match(/(\d+)<\/p><p[^>]*>Failures/)
    expect(failPillMatch?.[1]).toBe('2')
  })

  it('hides pass rate and avg duration pills when history is empty', () => {
    const data = makeData([])
    const html = renderToStaticMarkup(
      <TestStatsPanel
        data={data}
        isLoading={false}
        error={null}
        limit={25}
        onLimitChange={vi.fn()}
      />,
    )
    expect(html).not.toContain('Pass rate')
    expect(html).not.toContain('Avg duration')
  })

  it('shows test title path', () => {
    const data = makeData([makeEntry()])
    const html = renderToStaticMarkup(
      <TestStatsPanel
        data={data}
        isLoading={false}
        error={null}
        limit={25}
        onLimitChange={vi.fn()}
      />,
    )
    expect(html).toContain('suite')
    expect(html).toContain('should work')
  })

  it('shows location file', () => {
    const data = makeData([makeEntry()])
    const html = renderToStaticMarkup(
      <TestStatsPanel
        data={data}
        isLoading={false}
        error={null}
        limit={25}
        onLimitChange={vi.fn()}
      />,
    )
    expect(html).toContain('src/tests/foo.spec.ts')
  })
})
