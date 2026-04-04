import type { TestRecord } from '../lib/api.js'

interface Props {
  runId: string
  testId: string
  attachments: TestRecord['attachments']
}

export default function AttachmentList({ runId, testId, attachments }: Props) {
  const items = attachments.filter((a) => a.filename)

  if (items.length === 0) return null

  return (
    <div>
      <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-tn-muted">
        Attachments
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((att) => {
          const url = `/reports/${runId}/attachments/${testId}/${att.filename ?? ''}`
          const isTrace = att.name === 'trace' || att.filename?.endsWith('.zip')

          if (isTrace) {
            const traceUrl = `https://trace.playwright.dev/?trace=${encodeURIComponent(
              window.location.origin + url,
            )}`
            return (
              <a
                key={att.filename ?? att.name}
                href={traceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-tn-blue px-4 py-1.5 font-display text-xs font-semibold text-tn-blue transition-colors hover:bg-tn-blue/10"
              >
                ⎘ Open Trace ↗
              </a>
            )
          }

          return (
            <a
              key={att.filename ?? att.name}
              href={url}
              download={att.filename}
              className="inline-flex items-center gap-2 rounded-full border border-tn-border px-4 py-1.5 font-display text-xs text-tn-fg transition-colors hover:bg-tn-highlight"
            >
              {attachmentGlyph(att.contentType)} {att.name}
            </a>
          )
        })}
      </div>
    </div>
  )
}

function attachmentGlyph(contentType: string): string {
  if (contentType.startsWith('image/')) return '▣'
  if (contentType.startsWith('video/')) return '▶'
  if (contentType === 'application/zip') return '↓'
  return '→'
}
