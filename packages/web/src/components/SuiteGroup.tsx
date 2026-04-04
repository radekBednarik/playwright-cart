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
    <div className="overflow-hidden rounded-xl border border-tn-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 bg-tn-panel px-4 py-3 text-left transition-colors hover:bg-tn-highlight/60"
      >
        <span
          className={[
            'font-mono text-sm text-tn-muted transition-transform duration-200',
            open ? 'rotate-90' : 'rotate-0',
          ].join(' ')}
          style={{ display: 'inline-block' }}
        >
          ›
        </span>
        <span className="font-display font-semibold text-tn-fg">{suite}</span>
        <span className="ml-auto">
          {failed > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-tn-red/10 px-2 py-0.5 font-display text-xs font-semibold text-tn-red">
              {failed} failed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-tn-green/10 px-2 py-0.5 font-display text-xs font-semibold text-tn-green">
              {tests.length} passed
            </span>
          )}
        </span>
      </button>
      {open && (
        <div className="divide-y divide-tn-border bg-tn-bg/50">
          {tests.map((test) => (
            <Link
              key={test.testId}
              to={`/runs/${runId}/tests/${test.testId}`}
              className="flex items-center gap-3 py-2.5 pl-10 pr-4 transition-colors hover:bg-tn-highlight/40"
            >
              <TestStatusIcon status={test.status} />
              <span className="flex-1 text-sm text-tn-fg">{test.title}</span>
              <span className="font-mono text-xs text-tn-muted">
                {formatDuration(test.duration)}
              </span>
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
  timedOut: { icon: '◷', className: 'text-tn-yellow' },
  skipped: { icon: '○', className: 'text-tn-muted' },
  interrupted: { icon: '!', className: 'text-tn-muted' },
}

function TestStatusIcon({ status }: { status: TestStatus }) {
  const { icon, className } = STATUS_ICON[status]
  return <span className={`font-mono text-sm leading-none ${className}`}>{icon}</span>
}
