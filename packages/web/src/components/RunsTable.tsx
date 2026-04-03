import { Link } from 'react-router-dom'
import type { RunRecord } from '../lib/api.js'
import { formatRelativeTime } from '../lib/format.js'
import StatusBadge from './StatusBadge.js'

interface Props {
  runs: RunRecord[]
}

export default function RunsTable({ runs }: Props) {
  if (runs.length === 0) {
    return (
      <p className="py-8 text-center text-tn-muted">
        No runs match the current filters.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-tn-border bg-tn-panel">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-tn-border bg-tn-bg">
            {['Project / Branch', 'Commit', 'Status', 'When', ''].map((h) => (
              <th
                key={h}
                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-tn-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-tn-border">
          {runs.map((run) => (
            <tr key={run.runId} className="transition-colors hover:bg-tn-highlight">
              <td className="px-4 py-3">
                <div className="font-medium text-tn-fg">{run.project}</div>
                {run.branch && (
                  <div className="text-xs text-tn-blue">{run.branch}</div>
                )}
              </td>
              <td className="px-4 py-3">
                {run.commitSha ? (
                  <code className="text-xs text-tn-muted">
                    {run.commitSha.slice(0, 7)}
                  </code>
                ) : (
                  <span className="text-xs text-tn-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={run.status} />
              </td>
              <td className="px-4 py-3 text-xs text-tn-muted">
                {formatRelativeTime(run.startedAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/runs/${run.runId}`}
                  className="text-xs font-medium text-tn-blue transition-colors hover:text-tn-purple"
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
