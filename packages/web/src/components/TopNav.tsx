import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import { useTheme } from '../hooks/useTheme.js'
import { logout, updateMe } from '../lib/api.js'
import { type Theme, applyTheme, cycleTheme, getStoredTheme } from '../lib/theme.js'

const THEME_ICONS: Record<Theme, string> = {
  system: '💻',
  dark: '🌙',
  light: '☀️',
}

const THEME_LABELS: Record<Theme, string> = {
  system: 'System',
  dark: 'Dark',
  light: 'Light',
}

export default function TopNav() {
  const { theme, toggle } = useTheme()
  const { user } = useCurrentUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // On mount: if server theme differs from localStorage, apply server theme
  useEffect(() => {
    if (!user) return
    const localTheme = getStoredTheme()
    if (user.theme !== localTheme) {
      applyTheme(user.theme)
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  function handleThemeToggle() {
    const nextTheme = cycleTheme(theme)
    applyTheme(nextTheme)
    toggle()
    if (user) {
      // fire and forget — don't await, don't show errors
      updateMe({ theme: nextTheme }).catch(() => {})
    }
  }

  async function handleLogout() {
    setIsOpen(false)
    await logout()
    queryClient.invalidateQueries({ queryKey: ['me'] })
    navigate('/login')
  }

  return (
    <nav className="border-b border-tn-border bg-tn-panel px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center">
        <a
          href="/"
          className="text-lg font-bold text-tn-purple hover:opacity-80 transition-opacity"
        >
          🎭 Playwright Cart
        </a>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleThemeToggle}
            title={`Theme: ${THEME_LABELS[theme]} — click to cycle`}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-tn-muted hover:bg-tn-highlight hover:text-tn-fg transition-colors"
          >
            <span>{THEME_ICONS[theme]}</span>
            <span>{THEME_LABELS[theme]}</span>
          </button>

          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-tn-muted hover:bg-tn-highlight hover:text-tn-fg transition-colors"
              >
                <span>{user.username}</span>
                <span className="text-xs opacity-60">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded border border-tn-border bg-tn-panel shadow-lg z-50">
                  <Link
                    to="/settings"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2 text-sm text-tn-fg hover:bg-tn-highlight transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-tn-fg hover:bg-tn-highlight transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
