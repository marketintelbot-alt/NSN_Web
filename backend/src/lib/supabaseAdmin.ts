import { createClient } from '@supabase/supabase-js'

let supabaseAdminClient: any = null

function getSupabaseAdminKey() {
  return process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
}

export function hasSupabaseAdminConfig() {
  return Boolean(process.env.SUPABASE_URL?.trim() && getSupabaseAdminKey())
}

export function getSupabaseAdminClient(): any {
  if (supabaseAdminClient) {
    return supabaseAdminClient
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim()
  const supabaseAdminKey = getSupabaseAdminKey()

  if (!supabaseUrl || !supabaseAdminKey) {
    throw new Error(
      'SUPABASE_URL and either SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY are required for booking operations.',
    )
  }

  supabaseAdminClient = createClient(supabaseUrl, supabaseAdminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdminClient
}
