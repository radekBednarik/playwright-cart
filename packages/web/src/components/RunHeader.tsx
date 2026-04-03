import type { RunWithTests } from '../lib/api.js'
import StatusBadge from './StatusBadge.js'

interface Props {
  run: RunWithTests
}

export default function RunHeader({ run }: Props) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-tn-fg">{run.project}</h1>
          <StatusBadge status={run.status} />
        </div>
        <div className="space-x-3 text-sm text-tn-muted">
          {run.branch && <span className="text-tn-blue">{run.branch}</span>}
          {run.commitSha && <code className="text-tn-muted">{run.commitSha.slice(0, 7)}</code>}
          <span>{new Date(run.startedAt).toLocaleString()}</span>
        </div>
      </div>
      {run.reportUrl && (
        <a
          href={run.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-tn-blue px-4 py-2 text-sm text-tn-blue transition-colors hover:bg-tn-blue/10"
        >
          Open Report ↗
        </a>
      )}
    </div>
  )
}
