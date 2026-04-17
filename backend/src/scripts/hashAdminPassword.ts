import 'dotenv/config'

import bcrypt from 'bcryptjs'

async function main() {
  const password = process.argv[2] || process.env.ADMIN_PASSWORD || ''

  if (!password) {
    console.error('Provide a password as an argument or ADMIN_PASSWORD env var.')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 12)
  console.log(hash)
}

main().catch((error) => {
  console.error('Unable to hash the admin password.')
  console.error(error)
  process.exit(1)
})
