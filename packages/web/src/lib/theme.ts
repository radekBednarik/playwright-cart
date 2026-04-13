export type Theme = 'dark' | 'light' | 'system'

const CYCLE_ORDER: Theme[] = ['system', 'dark', 'light']
const THEME_STORAGE_KEY = 'playwright-cart.theme'
const LEGACY_THEME_STORAGE_KEY = 'theme'

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function isExplicitTheme(value: string | null): value is Exclude<Theme, 'system'> {
  return value === 'dark' || value === 'light'
}

export function readStoredTheme(storage: ThemeStorage): Theme {
  const stored = storage.getItem(THEME_STORAGE_KEY)
  if (isExplicitTheme(stored)) return stored

  const legacy = storage.getItem(LEGACY_THEME_STORAGE_KEY)
  if (isExplicitTheme(legacy)) {
    storage.setItem(THEME_STORAGE_KEY, legacy)
    storage.removeItem(LEGACY_THEME_STORAGE_KEY)
    return legacy
  }

  return 'system'
}

export function getStoredTheme(): Theme {
  return readStoredTheme(localStorage)
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    localStorage.removeItem(THEME_STORAGE_KEY)
  } else {
    root.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }))
}

export function cycleTheme(current: Theme): Theme {
  return CYCLE_ORDER[(CYCLE_ORDER.indexOf(current) + 1) % CYCLE_ORDER.length]
}
