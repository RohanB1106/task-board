import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** False when the .env file hasn't been filled in yet. */
export const isConfigured = Boolean(url && anonKey)

// Placeholders keep createClient from throwing; the app shows a setup screen
// instead of making requests when isConfigured is false.
export const supabase = createClient(url || 'http://localhost.invalid', anonKey || 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true },
})
