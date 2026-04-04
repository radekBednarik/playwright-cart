import type { TestRecord } from '../lib/api.js'

interface Props {
  tests: TestRecord[]
}

// RunStats is now rendered inside RunHeader's PassRateBar.
// This component is kept for backwards compatibility but renders nothing
// when used alongside the new RunHeader.
export default function RunStats({ tests: _tests }: Props) {
  return null
}
