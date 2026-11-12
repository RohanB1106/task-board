import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; userId: string }
  | { status: 'error'; message: string }

// Shared across renders so React StrictMode's double effect run
// can't create two anonymous users on first launch.
let pending: Promise<string> | null = null

async function ensureGuest(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (data.session) return data.session.user.id

  const { data: signIn, error: signInError } = await supabase.auth.signInAnonymously()
  if (signInError) {
    if (/anonymous/i.test(signInError.message)) {
      throw new Error(
        'Anonymous sign-ins are turned off. Enable them in Supabase → Authentication → Sign In / Providers.',
      )
    }
    throw signInError
  }
  if (!signIn.user) throw new Error('Supabase did not return a guest user.')
  return signIn.user.id
}

/** Signs in as an anonymous guest on first launch and reuses that session afterwards. */
export function useGuestSession() {
  const [state, setState] = useState<SessionState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    pending ??= ensureGuest()
    pending
      .then((userId) => !cancelled && setState({ status: 'ready', userId }))
      .catch((err: unknown) => {
        pending = null // allow a retry
        if (!cancelled) {
          setState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
        }
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { ...state, retry }
}
