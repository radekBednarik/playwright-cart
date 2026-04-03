import type { TestRecord } from '../lib/api.js'

interface Props {
  tests: TestRecord[]
}

export default function RunStats({ tests }: Props) {
  const passed = tests.filter((t) => t.status === 'passed').length
  const failed = tests.filter((t) => t.status === 'failed').length
  const timedOut = tests.filter((t) => t.status === 'timedOut').length
  const skipped = tests.filter((t) => t.status === 'skipped').length

  return (
    <div className="mb-6 flex gap-4 text-sm">
      <span className="text-tn-green">{passed} passed</span>
      {failed > 0 && <span className="text-tn-red">{failed} failed</span>}
      {timedOut > 0 && <span className="text-tn-yellow">{timedOut} timed out</span>}
      {skipped > 0 && <span className="text-tn-muted">{skipped} skipped</span>}
      <span className="text-tn-muted">/ {tests.length} total</span>
    </div>
  )
}
