import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RunningState } from './AiSummaryTab.js'

describe('RunningState', () => {
  it('renders the running info message', () => {
    const html = renderToStaticMarkup(<RunningState />)
    expect(html).toContain('Tests are currently running')
    expect(html).toContain('Summary will be generated automatically')
    expect(html).toContain('if it is considered failed')
  })

  it('renders no buttons', () => {
    const html = renderToStaticMarkup(<RunningState />)
    expect(html).not.toContain('<button')
  })
})
