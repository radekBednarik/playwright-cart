import { describe, expect, it } from 'vitest'
import { cycleTheme } from './theme.js'

describe('cycleTheme', () => {
  it('cycles system → dark → light → system', () => {
    expect(cycleTheme('system')).toBe('dark')
    expect(cycleTheme('dark')).toBe('light')
    expect(cycleTheme('light')).toBe('system')
  })
})
