import { describe, expect, it } from 'vitest'
import { cycleTheme, readStoredTheme } from './theme.js'

function createStorage(initial: Record<string, string> = {}) {
  const state = new Map(Object.entries(initial))

  return {
    getItem(key: string) {
      return state.get(key) ?? null
    },
    setItem(key: string, value: string) {
      state.set(key, value)
    },
    removeItem(key: string) {
      state.delete(key)
    },
  }
}

describe('cycleTheme', () => {
  it('cycles system → dark → light → system', () => {
    expect(cycleTheme('system')).toBe('dark')
    expect(cycleTheme('dark')).toBe('light')
    expect(cycleTheme('light')).toBe('system')
  })
})

describe('readStoredTheme', () => {
  it('reads namespaced app theme', () => {
    const storage = createStorage({ 'playwright-cart.theme': 'light' })

    expect(readStoredTheme(storage)).toBe('light')
  })

  it('migrates legacy app theme values without touching report values', () => {
    const storage = createStorage({ theme: 'dark' })

    expect(readStoredTheme(storage)).toBe('dark')
    expect(storage.getItem('playwright-cart.theme')).toBe('dark')
    expect(storage.getItem('theme')).toBeNull()
  })

  it('ignores playwright report theme values in legacy key', () => {
    const storage = createStorage({ theme: 'light-mode' })

    expect(readStoredTheme(storage)).toBe('system')
    expect(storage.getItem('playwright-cart.theme')).toBeNull()
    expect(storage.getItem('theme')).toBe('light-mode')
  })
})
