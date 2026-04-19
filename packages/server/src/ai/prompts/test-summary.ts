import type { TestRecord } from '../../runs/storage.js'

export interface TestArtifacts {
  errorContextMarkdown: string | null
}

export function buildTestSummaryPrompt(test: TestRecord, artifacts: TestArtifacts): string {
  const lines: string[] = [
    `You are a test failure analyst. Summarise this Playwright test failure in 3-5 sentences.`,
    `Focus on: what failed, the likely root cause, and what a developer should investigate.`,
    `Be concise and technical. Do not suggest fixes unless obvious from the data.`,
    ``,
    `## Test`,
    `Title: ${test.title}`,
    `Path: ${test.titlePath.join(' > ')}`,
    `File: ${test.location.file}:${test.location.line}`,
    `Status: ${test.status}`,
    `Duration: ${test.duration}ms`,
    `Retries: ${test.retry}`,
  ]

  if (test.errors.length > 0) {
    lines.push(``, `## Errors`)
    for (const err of test.errors) {
      lines.push(`### Message`, err.message)
      if (err.stack) lines.push(`### Stack Trace`, '```', err.stack, '```')
    }
  }

  if (test.annotations.length > 0) {
    lines.push(``, `## Annotations`)
    for (const ann of test.annotations) {
      lines.push(`- [${ann.type}] ${ann.description ?? ''}`)
    }
  }

  if (artifacts.errorContextMarkdown) {
    lines.push(``, `## Error Context (Playwright)`, artifacts.errorContextMarkdown)
  }

  return lines.join('\n')
}
