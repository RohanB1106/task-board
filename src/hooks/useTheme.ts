import { useCallback, useEffect, useState } from 'react'

export type ThemeChoice = 'system' | 'light' | 'dark'

function readChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage blocked (private mode etc.) — fall back to system
  }
  return 'system'
}

/** Light / dark / follow-the-system, remembered per browser. */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(readChoice)

  useEffect(() => {
    const root = document.documentElement
    if (choice === 'system') delete root.dataset.theme
    else root.dataset.theme = choice
    try {
      if (choice === 'system') localStorage.removeItem('theme')
      else localStorage.setItem('theme', choice)
    } catch {
      // ignore
    }
  }, [choice])

  const cycle = useCallback(() => {
    setChoice((c) => (c === 'system' ? 'light' : c === 'light' ? 'dark' : 'system'))
  }, [])

  return { choice, cycle }
}
