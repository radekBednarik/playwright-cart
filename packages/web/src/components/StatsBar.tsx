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
    <div className="mb-6 flex items-baseline gap-0 divide-x divide-tn-border">
      <Stat value={runs.length} label="runs" className="pr-6 text-tn-fg" />
      <Stat value={`${passRate}%`} label="pass rate" className="px-6 text-tn-green" />
      <Stat
        value={failed}
        label="failed"
        className={`pl-6 ${failed > 0 ? 'text-tn-red' : 'text-tn-muted'}`}
      />
    </div>
  )
}

function Stat({
  value,
  label,
  className,
}: {
  value: string | number
  label: string
  className?: string
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-display text-3xl font-bold tabular-nums leading-none ${className}`}>
        {value}
      </span>
      <span className="text-xs text-tn-muted">{label}</span>
    </div>
  )
}
