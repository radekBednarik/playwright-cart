interface Props {
  error: { message: string; stack?: string }
}

export default function ErrorBlock({ error }: Props) {
  return (
    <div className="border-l-4 border-l-tn-red bg-tn-red/5 py-3 pl-4 pr-3">
      <p className="font-mono text-sm font-medium text-tn-red">{error.message}</p>
      {error.stack && (
        <div className="mt-3 rounded-lg bg-tn-bg/60 p-3">
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-tn-muted">
            {error.stack}
          </pre>
        </div>
      )}
    </div>
  )
}
