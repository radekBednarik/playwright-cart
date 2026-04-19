import type { TestHistoryResult } from '../lib/api.js'
import DotTimeline from './charts/DotTimeline.js'
import DurationChart from './charts/DurationChart.js'

export function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
}

function StatPill({ label, value, color = '' }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-tn-border bg-tn-panel px-4 py-2 text-center">
      <p className={`font-display text-xl font-bold ${color || 'text-tn-fg'}`}>{value}</p>
      <p className="font-mono text-xs uppercase tracking-widest text-tn-muted">{label}</p>
    </div>
  )
}

interface Props {
  data: TestHistoryResult | undefined
  isLoading: boolean
  error: Error | null
  limit: number
  onLimitChange: (l: number) => void
}

export default function TestStatsPanel({ data, isLoading, error, limit, onLimitChange }: Props) {
  if (isLoading) return <Skeleton />

  if (error) {
    return <p className="font-mono text-sm text-tn-muted">{error.message}</p>
  }

  if (!data) return null

  const history = data.history

  const passRate =
    history.length > 0
      ? Math.round((history.filter((h) => h.status === 'passed').length / history.length) * 100)
      : null
  const flakyCount = history.filter((h) => h.retry > 0 && h.status === 'passed').length
  const failCount = history.filter((h) =>
    ['failed', 'timedOut', 'interrupted'].includes(h.status),
  ).length
  const avgDuration =
    history.length > 0
      ? Math.round(history.reduce((s, h) => s + h.durationMs, 0) / history.length)
      : null

  const durationBuckets = history.map((h) => ({
    key: h.runId,
    startedAt: h.startedAt,
    runCount: 1,
    total: 1,
    passed: h.status === 'passed' ? 1 : 0,
    failed: h.status !== 'passed' ? 1 : 0,
    flaky: h.retry > 0 && h.status === 'passed' ? 1 : 0,
    avgDurationMs: h.durationMs,
    p95DurationMs: h.durationMs,
  }))

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-tn-fg">{data.test.titlePath.join(' › ')}</p>
          <p className="font-mono text-xs text-tn-muted">{data.test.locationFile}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {passRate !== null && (
            <StatPill label="Pass rate" value={`${passRate}%`} color="text-tn-green" />
          )}
          <StatPill label="Flaky runs" value={String(flakyCount)} color="text-tn-yellow" />
          <StatPill label="Failures" value={String(failCount)} color="text-tn-red" />
          {avgDuration !== null && <StatPill label="Avg duration" value={fmtMs(avgDuration)} />}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded border border-tn-border font-mono text-xs">
          {[25, 50, 0].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLimitChange(l || 200)}
              className={`border-none px-3 py-1.5 transition-colors ${
                (l === 0 ? limit === 200 : limit === l)
                  ? 'bg-tn-blue/20 text-tn-blue'
                  : 'bg-tn-highlight text-tn-muted hover:text-tn-fg'
              }`}
            >
              {l === 0 ? 'All' : `Last ${l}`}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-tn-muted">
          Run history (oldest → newest)
        </p>
        <DotTimeline history={history} />
      </div>

      {history.length > 0 && (
        <div className="rounded-xl border border-tn-border bg-tn-panel p-4">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-tn-muted">
            Duration per run
          </p>
          <DurationChart data={durationBuckets} height={140} />
        </div>
      )}
    </>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-64 rounded bg-tn-panel" />
          <div className="h-3 w-48 rounded bg-tn-panel" />
        </div>
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-20 rounded-lg bg-tn-panel" />
          ))}
        </div>
      </div>
      <div className="h-16 rounded-lg border border-tn-border bg-tn-panel" />
      <div className="h-36 rounded-xl border border-tn-border bg-tn-panel" />
    </div>
  )
}
