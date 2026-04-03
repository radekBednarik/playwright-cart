import type { RunRecord } from '../lib/api.js'

interface Props {
  runs: RunRecord[]
}

export default function StatsBar({ runs }: Props) {
  const completed = runs.filter((r) => r.status !== 'running')
  const passed = runs.filter((r) => r.status === 'passed').length
  const failed = runs.filter((r) => r.status === 'failed').length
  const passRate = completed.length > 0 ? Math.round((passed / completed.length) * 100) : 0

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      <StatCard label="Total runs" value={runs.length} />
      <StatCard label="Pass rate" value={`${passRate}%`} valueClass="text-tn-green" />
      <StatCard
        label="Failed"
        value={failed}
        valueClass={failed > 0 ? 'text-tn-red' : 'text-tn-fg'}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClass = 'text-tn-fg',
}: {
  label: string
  value: string | number
  valueClass?: string
}) {
  return (
    <div className="rounded-lg border border-tn-border bg-tn-panel p-4 text-center">
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className="mt-1 text-sm text-tn-muted">{label}</div>
    </div>
  )
}
