import { useSearchParams } from 'react-router-dom'
import type { RunRecord, RunStatus } from '../lib/api.js'

const ALL_STATUSES: RunStatus[] = ['running', 'passed', 'failed', 'interrupted', 'timedOut']

interface Props {
  runs: RunRecord[]
}

export function FilterBar({ runs }: Props) {
  const [params, setParams] = useSearchParams()

  const projects = [...new Set(runs.map((r) => r.project))].sort()
  const branches = [
    ...new Set(runs.map((r) => r.branch).filter((b): b is string => Boolean(b))),
  ].sort()

  const project = params.get('project') ?? ''
  const branch = params.get('branch') ?? ''
  const status = params.get('status') ?? ''

  function setParam(key: string, value: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  return (
    <div className="flex items-center gap-1">
      <FilterSelect label="Project" value={project} onChange={(v) => setParam('project', v)}>
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </FilterSelect>
      <span className="text-tn-border select-none">|</span>
      <FilterSelect label="Branch" value={branch} onChange={(v) => setParam('branch', v)}>
        <option value="">All branches</option>
        {branches.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </FilterSelect>
      <span className="text-tn-border select-none">|</span>
      <FilterSelect label="Status" value={status} onChange={(v) => setParam('status', v)}>
        <option value="">All statuses</option>
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </FilterSelect>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer bg-transparent px-2 py-1 font-display text-xs text-tn-muted outline-none transition-colors hover:text-tn-fg focus:text-tn-fg"
    >
      {children}
    </select>
  )
}

export function applyFilters(runs: RunRecord[], params: URLSearchParams): RunRecord[] {
  const project = params.get('project')
  const branch = params.get('branch')
  const status = params.get('status') as RunStatus | null
  return runs.filter((r) => {
    if (project && r.project !== project) return false
    if (branch && r.branch !== branch) return false
    if (status && r.status !== status) return false
    return true
  })
}
