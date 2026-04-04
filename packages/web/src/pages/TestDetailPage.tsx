import { Link, useParams } from 'react-router-dom'
import AttachmentList from '../components/AttachmentList.js'
import ErrorBlock from '../components/ErrorBlock.js'
import TestHeader from '../components/TestHeader.js'
import { useTest } from '../hooks/useTest.js'

export default function TestDetailPage() {
  const { runId, testId } = useParams<{ runId: string; testId: string }>()
  const { data: test, isLoading, error } = useTest(runId ?? '', testId ?? '')

  if (isLoading) return <Skeleton />

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 font-mono text-sm text-tn-muted">
          {error.name === 'NotFoundError' ? 'Test not found.' : error.message}
        </p>
        <Link
          to={`/runs/${runId}`}
          className="font-display text-xs font-semibold uppercase tracking-widest text-tn-blue transition-colors hover:text-tn-purple"
        >
          ← Back to run
        </Link>
      </div>
    )
  }

  if (!test) return null

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-2 font-mono text-xs text-tn-muted">
        <Link to="/" className="transition-colors hover:text-tn-blue">
          Runs
        </Link>
        <span>/</span>
        <Link to={`/runs/${runId}`} className="transition-colors hover:text-tn-blue">
          {test.titlePath[0] ?? runId}
        </Link>
        <span>/</span>
        <span className="truncate text-tn-fg">{test.title}</span>
      </nav>

      {/* Two-panel layout on desktop */}
      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8">
        {/* Left: header + errors + annotations */}
        <div>
          <TestHeader test={test} />

          {test.errors.length > 0 && (
            <div className="mb-6 space-y-3">
              <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-tn-muted">
                Errors
              </h3>
              {test.errors.map((err, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: errors have no stable unique id
                <ErrorBlock key={i} error={err} />
              ))}
            </div>
          )}

          {test.annotations.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-tn-muted">
                Annotations
              </h3>
              <div className="space-y-1.5">
                {test.annotations.map((ann, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: annotations have no stable unique id
                  <div key={i} className="font-mono text-sm text-tn-fg">
                    <span className="text-tn-blue">[{ann.type}]</span>
                    {ann.description && (
                      <span className="ml-2 text-tn-muted">{ann.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments on mobile (shows below errors) */}
          <div className="lg:hidden">
            <AttachmentList
              runId={runId ?? ''}
              testId={testId ?? ''}
              attachments={test.attachments}
            />
          </div>
        </div>

        {/* Right: attachments sticky panel (desktop only) */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <AttachmentList
              runId={runId ?? ''}
              testId={testId ?? ''}
              attachments={test.attachments}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-4 w-16 rounded bg-tn-panel" />
        ))}
      </div>
      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8">
        <div className="space-y-4">
          <div className="h-24 rounded-xl bg-tn-panel" />
          <div className="h-32 rounded-xl bg-tn-panel" />
        </div>
        <div className="mt-4 lg:mt-0">
          <div className="h-24 rounded-xl bg-tn-panel" />
        </div>
      </div>
    </div>
  )
}
