import type { RunStatus, TestStatus } from '../lib/api.js'

type Status = RunStatus | TestStatus

const STYLES: Record<Status, string> = {
  passed: 'bg-tn-green/15 text-tn-green',
  failed: 'bg-tn-red/15 text-tn-red',
  running: 'bg-tn-yellow/15 text-tn-yellow',
  timedOut: 'bg-tn-yellow/15 text-tn-yellow',
  interrupted: 'bg-tn-muted/15 text-tn-muted',
  skipped: 'bg-tn-muted/15 text-tn-muted',
}

const DOT_STYLES: Record<Status, string> = {
  passed: 'bg-tn-green',
  failed: 'bg-tn-red',
  running: 'bg-tn-yellow animate-pulse-slow',
  timedOut: 'bg-tn-yellow',
  interrupted: 'bg-tn-muted',
  skipped: 'bg-tn-muted opacity-50',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-display text-xs font-semibold ${STYLES[status]}`}
    >
      <span className={`size-1.5 rounded-full inline-block flex-shrink-0 ${DOT_STYLES[status]}`} />
      {status}
    </span>
  )
}
