import { getSupabaseAdminClient, hasSupabaseAdminConfig } from './supabaseAdmin.js'

const defaultKeepAliveTable = 'service_requests'

export type SupabaseKeepAliveResult = {
  durationMs: number
  tableName: string
}

export async function pingSupabaseKeepAlive(
  tableName = process.env.SUPABASE_KEEPALIVE_TABLE?.trim() || defaultKeepAliveTable,
): Promise<SupabaseKeepAliveResult> {
  if (!hasSupabaseAdminConfig()) {
    throw new Error(
      'SUPABASE_URL and either SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY are required for the Supabase keep-alive worker.',
    )
  }

  const startedAt = Date.now()
  const { error } = await getSupabaseAdminClient()
    .from(tableName)
    .select('id', { count: 'exact', head: true })
    .limit(1)

  if (error) {
    throw new Error(`Supabase keep-alive query failed for ${tableName}: ${error.message}`)
  }

  return {
    durationMs: Date.now() - startedAt,
    tableName,
  }
}
