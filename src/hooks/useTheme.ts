import { useSyncExternalStore } from 'react'

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

// One shared store so every theme switch on screen stays in sync
let current: ThemeChoice = readChoice()
const listeners = new Set<() => void>()

function apply(choice: ThemeChoice) {
  const root = document.documentElement
  if (choice === 'system') delete root.dataset.theme
  else root.dataset.theme = choice
  try {
    if (choice === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', choice)
  } catch {
    // ignore
  }
}

function setChoice(choice: ThemeChoice) {
  current = choice
  apply(choice)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Light / dark / follow-the-system, remembered per browser. */
export function useTheme() {
  const choice = useSyncExternalStore(subscribe, () => current)
  return { choice, setChoice }
}
