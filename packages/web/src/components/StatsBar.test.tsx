import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StatsBar from './StatsBar.js'

describe('StatsBar', () => {
  it('uses completed runs as pass rate denominator', () => {
    const html = renderToStaticMarkup(
      <StatsBar total={13} totalPassed={12} totalFailed={0} totalCompleted={12} />,
    )

    expect(html).toContain('100%')
  })

  it('shows dash when no completed runs exist', () => {
    const html = renderToStaticMarkup(
      <StatsBar total={3} totalPassed={0} totalFailed={0} totalCompleted={0} />,
    )

    expect(html).toContain('—')
  })
})
