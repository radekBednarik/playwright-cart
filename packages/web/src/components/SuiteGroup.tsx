import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TestRecord, TestStatus } from '../lib/api.js'
import { formatDuration } from '../lib/format.js'

interface Props {
  runId: string
  suite: string
  tests: TestRecord[]
}

export default function SuiteGroup({ runId, suite, tests }: Props) {
  const [open, setOpen] = useState(true)
  const failed = tests.filter((t) => t.status === 'failed' || t.status === 'timedOut').length

  return (
    <div className="overflow-hidden rounded-lg border border-tn-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 bg-tn-highlight px-4 py-3 text-left transition-colors hover:bg-tn-border/50"
      >
        <span className="text-sm text-tn-purple">{open ? '▾' : '▸'}</span>
        <span className="font-medium text-tn-fg">{suite}</span>
        <span className="ml-auto text-xs">
          {failed > 0 ? (
            <span className="text-tn-red">{failed} failed</span>
          ) : (
            <span className="text-tn-green">{tests.length} passed</span>
          )}
        </span>
      </button>
      {open && (
        <div className="divide-y divide-tn-border bg-tn-panel">
          {tests.map((test) => (
            <Link
              key={test.testId}
              to={`/runs/${runId}/tests/${test.testId}`}
              className="flex items-center gap-3 px-4 py-2.5 pl-8 transition-colors hover:bg-tn-highlight"
            >
              <TestStatusIcon status={test.status} />
              <span className="flex-1 text-sm text-tn-fg">{test.title}</span>
              <span className="text-xs text-tn-muted">{formatDuration(test.duration)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const STATUS_ICON: Record<TestStatus, { icon: string; className: string }> = {
  passed: { icon: '✓', className: 'text-tn-green' },
  failed: { icon: '✗', className: 'text-tn-red' },
  timedOut: { icon: '⏱', className: 'text-tn-yellow' },
  skipped: { icon: '○', className: 'text-tn-muted' },
  interrupted: { icon: '!', className: 'text-tn-muted' },
}

function TestStatusIcon({ status }: { status: TestStatus }) {
  const { icon, className } = STATUS_ICON[status]
  return <span className={`font-mono text-sm ${className}`}>{icon}</span>
}
