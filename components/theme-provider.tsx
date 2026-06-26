'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const pathname = usePathname()

  useEffect(() => {
    // If not in dashboard, force light theme
    if (!pathname?.startsWith('/dashboard')) {
      document.documentElement.classList.remove('dark')
      setThemeState('light')
      return
    }

    // Otherwise, check localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme === 'dark') {
      setThemeState('dark')
      document.documentElement.classList.add('dark')
    } else {
      setThemeState('light')
      document.documentElement.classList.remove('dark')
    }
  }, [pathname])

  const setTheme = (newTheme: Theme) => {
    // Only allow setting theme in dashboard
    if (!pathname?.startsWith('/dashboard')) return

    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

