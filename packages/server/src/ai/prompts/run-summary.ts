import type { RunRecord } from '../../runs/storage.js'

export function buildRunSummaryPrompt(
  run: RunRecord,
  testSummaries: { title: string; summary: string }[],
  failedTestErrors: { title: string; errors: { message: string }[] }[],
): string {
  const lines: string[] = [
    `You are a CI failure analyst. Summarise this Playwright test run failure in 4-6 sentences.`,
    `Identify patterns across failures, the likely root cause, and what the team should look at.`,
    `Be concise and technical.`,
    ``,
    `## Run`,
    `Project: ${run.project}`,
  ]

  if (run.branch) lines.push(`Branch: ${run.branch}`)
  if (run.commitSha) lines.push(`Commit: ${run.commitSha}`)
  if (run.tags.length > 0) lines.push(`Tags: ${run.tags.join(', ')}`)
  lines.push(`Status: ${run.status}`)

  if (testSummaries.length > 0) {
    lines.push(``, `## Failed Test Summaries`)
    for (const t of testSummaries) {
      lines.push(``, `### ${t.title}`, t.summary)
    }
  } else {
    lines.push(``, `## Failed Tests (raw errors)`)
    for (const t of failedTestErrors) {
      lines.push(``, `### ${t.title}`)
      for (const e of t.errors) lines.push(`- ${e.message}`)
    }
  }

  return lines.join('\n')
}
