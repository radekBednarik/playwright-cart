import { useCallback, useState } from 'react'
import { type Theme, applyTheme, cycleTheme, getStoredTheme } from '../lib/theme.js'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  const toggle = useCallback(() => {
    const next = cycleTheme(theme)
    applyTheme(next)
    setTheme(next)
  }, [theme])

  return { theme, toggle }
}
