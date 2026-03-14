import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const accountsEnabled = Boolean(supabaseUrl && supabaseAnonKey)
export const selfSignupEnabled = import.meta.env.VITE_ALLOW_SELF_SIGNUP === 'true'

export const supabase =
  accountsEnabled && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'north-shore-nautical-auth',
        },
      })
    : null
