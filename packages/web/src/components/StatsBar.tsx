interface Props {
  total: number
  totalPassed: number
  totalFailed: number
}

export default function StatsBar({ total, totalPassed, totalFailed }: Props) {
  const passRate = total > 0 ? Math.round((totalPassed / total) * 100) : 0

  return (
    <div className="mb-6 flex items-baseline gap-0 divide-x divide-tn-border">
      <Stat value={total} label="runs" containerClassName="pr-6" className="text-tn-fg" />
      <Stat
        value={`${passRate}%`}
        label="pass rate"
        containerClassName="px-6"
        className="text-tn-green"
      />
      <Stat
        value={totalFailed}
        label="failed"
        containerClassName="pl-6"
        className={totalFailed > 0 ? 'text-tn-red' : 'text-tn-muted'}
      />
    </div>
  )
}

function Stat({
  value,
  label,
  className,
  containerClassName,
}: {
  value: string | number
  label: string
  className?: string
  containerClassName?: string
}) {
  return (
    <div className={`flex items-baseline gap-2 ${containerClassName ?? ''}`}>
      <span className={`font-display text-3xl font-bold tabular-nums leading-none ${className}`}>
        {value}
      </span>
      <span className="text-xs text-tn-muted">{label}</span>
    </div>
  )
}
