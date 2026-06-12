#!/usr/bin/env node

import { readFileSync } from 'node:fs'

const checks = [
  {
    file: 'frontend/src/lib/adminSession.ts',
    forbidden: /localStorage|credentials:\s*['"]include['"]/,
    message: 'Account sessions must remain bearer-only and tab-scoped.',
  },
  {
    file: 'backend/src/lib/adminSession.ts',
    forbidden: /cookie|readAdminSessionCookie/i,
    message: 'Backend account authentication must not fall back to cookies.',
  },
  {
    file: 'backend/src/lib/serviceRequests.ts',
    required: /checkoutKind:\s*'service_request_quote'[\s\S]*?capture_method:\s*'manual'/,
    message: 'Quoted service requests must authorize payment instead of capturing immediately.',
  },
  {
    file: 'render.yaml',
    required: /healthCheckPath:\s*\/api\/health\/ready/,
    message: 'Render must use the dependency-aware readiness check.',
  },
  {
    file: 'render.yaml',
    required: /Content-Security-Policy/,
    message: 'The public site must ship a Content Security Policy.',
  },
  {
    file: 'frontend/src/content/site.ts',
    required: /siteUrl:\s*'https:\/\/nsnautical\.com'/,
    message: 'SEO metadata must use the canonical apex domain.',
  },
]

const failures = []

for (const check of checks) {
  const source = readFileSync(check.file, 'utf8')

  if (check.required && !check.required.test(source)) {
    failures.push(`${check.file}: ${check.message}`)
  }

  if (check.forbidden && check.forbidden.test(source)) {
    failures.push(`${check.file}: ${check.message}`)
  }
}

if (failures.length > 0) {
  console.error('Security guardrail audit failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Security guardrail audit passed.')
