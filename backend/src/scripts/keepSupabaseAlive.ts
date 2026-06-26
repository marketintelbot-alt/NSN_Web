import 'dotenv/config'

import { pingSupabaseKeepAlive } from '../lib/supabaseKeepAlive.js'

async function main() {
  const result = await pingSupabaseKeepAlive()

  console.log(
    `Supabase keep-alive query succeeded for ${result.tableName} in ${result.durationMs}ms.`,
  )
}

main().catch((error) => {
  console.error('Unable to complete the Supabase keep-alive query.', error)
  process.exitCode = 1
})
