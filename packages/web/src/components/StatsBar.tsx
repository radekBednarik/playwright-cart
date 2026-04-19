import { useId } from 'react'

interface Props {
  total: number
  totalPassed: number
  totalFailed: number
  totalCompleted: number
}

export default function StatsBar({ total, totalPassed, totalFailed, totalCompleted }: Props) {
  const passRate = totalCompleted > 0 ? `${Math.round((totalPassed / totalCompleted) * 100)}%` : '—'

  return (
    <div className="mb-6 flex items-baseline gap-0 divide-x divide-tn-border">
      <Stat
        value={total}
        label="runs"
        containerClassName="pr-6"
        className="text-tn-fg"
        tooltip="Total number of test suite runs recorded. Each run is one full execution of your automated tests."
      />
      <Stat
        value={passRate}
        label="pass rate"
        containerClassName="px-6"
        className="text-tn-green"
        tooltip="How often complete test suites pass. For example, 80% means 4 out of every 5 test runs had all their tests passing. Applies to the current filters."
      />
      <Stat
        value={totalFailed}
        label="failed"
        containerClassName="pl-6"
        className={totalFailed > 0 ? 'text-tn-red' : 'text-tn-muted'}
        tooltip="Number of test runs where at least one test did not pass or the run did not finish."
      />
    </div>
  )
}

function Stat({
  value,
  label,
  className,
  containerClassName,
  tooltip,
}: {
  value: string | number
  label: string
  className?: string
  containerClassName?: string
  tooltip?: string
}) {
  const tooltipId = useId()
  return (
    <div
      tabIndex={tooltip ? 0 : undefined}
      className={`group/stat relative flex items-baseline gap-2 ${containerClassName ?? ''}`}
    >
      <span
        aria-describedby={tooltip ? tooltipId : undefined}
        className={`font-display text-3xl font-bold tabular-nums leading-none ${className}`}
      >
        {value}
      </span>
      <span className="text-xs text-tn-muted">{label}</span>
      {tooltip && (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 whitespace-normal rounded border border-tn-border bg-tn-panel px-2.5 py-1.5 font-mono text-xs text-tn-fg opacity-0 shadow-xl transition-opacity duration-150 group-hover/stat:visible group-hover/stat:opacity-100 group-focus-within/stat:visible group-focus-within/stat:opacity-100"
        >
          {tooltip}
        </span>
      )}
    </div>
  )
}
