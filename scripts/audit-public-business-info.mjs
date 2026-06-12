#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const repoRoot = process.cwd()
const requiredPublicStrings = [
  'North Shore Nautical',
  '314-606-2112',
  'carter@ellismarinegroup.com',
  'nsnautical.com',
]

const publicFiles = [
  'frontend/index.html',
  'frontend/public/manifest.webmanifest',
  'frontend/public/robots.txt',
  'frontend/public/sitemap.xml',
  'frontend/src/components/layout/Footer.tsx',
  'frontend/src/components/layout/Header.tsx',
  'frontend/src/components/service-request/MarineServiceRequestForm.tsx',
  'frontend/src/content/site.ts',
  'frontend/src/pages/AboutPage.tsx',
  'frontend/src/pages/AdvisoryPage.tsx',
  'frontend/src/pages/BookingPage.tsx',
  'frontend/src/pages/ContactPage.tsx',
  'frontend/src/pages/GalleryPage.tsx',
  'frontend/src/pages/HomePage.tsx',
  'frontend/src/pages/NotFoundPage.tsx',
  'frontend/src/pages/PricingPage.tsx',
  'frontend/src/pages/PrivacyPolicyPage.tsx',
  'frontend/src/pages/ServiceAgreementPage.tsx',
  'frontend/src/pages/ServicesPage.tsx',
]

const privateReviewFiles = [
  'frontend/src/pages/AdminPage.tsx',
  'frontend/src/pages/ConfirmationPage.tsx',
  'frontend/src/pages/PortalPage.tsx',
  'frontend/src/components/account',
  'frontend/src/components/admin',
  'frontend/src/components/reservation',
  'frontend/src/content/legacyPortal.ts',
]

const blockedPublicPatterns = [
  {
    label: 'Render URL shown publicly',
    pattern: /https?:\/\/[^\s"'<>]*onrender\.com/gi,
  },
  {
    label: 'localhost URL shown publicly',
    pattern: /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/gi,
  },
  {
    label: 'retired Quick Reset service name',
    pattern: /Quick\s+Reset|quick\s+reset|QuickReset|quickReset|quick_reset/gi,
  },
  {
    label: 'transport or vessel-moving public reference',
    pattern: /\b(?:transport|towing|launching|operating boats)\b/gi,
  },
  {
    label: 'placeholder TODO',
    pattern: /\bTODO\b/gi,
  },
  {
    label: 'placeholder coming soon',
    pattern: /coming soon/gi,
  },
  {
    label: 'placeholder example.com',
    pattern: /example\.com/gi,
  },
  {
    label: 'wrong public phone number',
    pattern: /\(?847\)?[\s.-]*331[\s.-]*0927|\+1?8473310927/gi,
  },
  {
    label: 'public canonical or sitemap uses Render',
    pattern: /(?:canonical|sitemap|<loc>)[\s\S]{0,160}onrender\.com/gi,
  },
]

const allowedNoIndexFiles = new Set([
  'frontend/dist/404.html',
  'frontend/dist/admin/index.html',
  'frontend/dist/booking/confirmation/index.html',
  'frontend/dist/portal/index.html',
  'frontend/src/pages/AdminPage.tsx',
  'frontend/src/pages/ConfirmationPage.tsx',
  'frontend/src/pages/NotFoundPage.tsx',
  'frontend/src/pages/PortalPage.tsx',
])

function getLineNumber(source, index) {
  return source.slice(0, index).split('\n').length
}

function walk(directory) {
  const files = []

  if (!existsSync(directory)) {
    return files
  }

  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry)
    const stats = statSync(absolutePath)

    if (stats.isDirectory()) {
      files.push(...walk(absolutePath))
      continue
    }

    files.push(absolutePath)
  }

  return files
}

function resolveExistingFiles(entries) {
  return entries.flatMap((entry) => {
    const absolutePath = join(repoRoot, entry)

    if (!existsSync(absolutePath)) {
      return []
    }

    if (statSync(absolutePath).isDirectory()) {
      return walk(absolutePath)
    }

    return [absolutePath]
  })
}

function collectPatternFindings(files, patterns, labelPrefix = '') {
  const findings = []

  for (const filePath of files) {
    const pathFromRoot = relative(repoRoot, filePath)
    const source = readFileSync(filePath, 'utf8')

    for (const check of patterns) {
      for (const match of source.matchAll(check.pattern)) {
        findings.push(
          `${pathFromRoot}:${getLineNumber(source, match.index)} ${labelPrefix}${check.label}`,
        )
      }
    }

    if (!allowedNoIndexFiles.has(pathFromRoot) && /\bnoindex\b/i.test(source)) {
      findings.push(`${pathFromRoot}:1 ${labelPrefix}noindex found outside allowed private routes`)
    }
  }

  return findings
}

function collectBuiltOutputWarnings() {
  const distRoot = join(repoRoot, 'frontend/dist')
  const scannedExtensions = new Set(['.html', '.xml', '.txt', '.webmanifest'])
  const files = walk(distRoot).filter((filePath) => {
    const extension = filePath.match(/\.[^.]+$/)?.[0] || ''
    return scannedExtensions.has(extension)
  })

  return collectPatternFindings(files, blockedPublicPatterns, 'built output review: ')
}

const publicSourceFiles = resolveExistingFiles(publicFiles)
const privateSourceFiles = resolveExistingFiles(privateReviewFiles)
const publicSource = publicSourceFiles
  .map((filePath) => readFileSync(filePath, 'utf8'))
  .join('\n')
const publicFindings = collectPatternFindings(publicSourceFiles, blockedPublicPatterns)
const privateWarnings = collectPatternFindings(privateSourceFiles, blockedPublicPatterns, 'private route review: ')
const builtWarnings = collectBuiltOutputWarnings()

for (const requiredString of requiredPublicStrings) {
  if (!publicSource.includes(requiredString)) {
    publicFindings.push(`public source missing required string: ${requiredString}`)
  }
}

if (!/Sitemap:\s*https:\/\/nsnautical\.com\/sitemap\.xml/.test(publicSource)) {
  publicFindings.push('robots.txt must reference https://nsnautical.com/sitemap.xml')
}

if (/<loc>https:\/\/www\.nsnautical\.com/i.test(publicSource)) {
  publicFindings.push('sitemap contains a redirecting www.nsnautical.com URL')
}

if (publicFindings.length > 0) {
  console.error('Public business info audit failed:')
  for (const finding of publicFindings) {
    console.error(`- ${finding}`)
  }
  process.exit(1)
}

const warnings = [...privateWarnings, ...builtWarnings]

if (warnings.length > 0) {
  console.warn('Public business info audit passed with manual-review notes:')
  for (const warning of warnings) {
    console.warn(`- ${warning}`)
  }
} else {
  console.log('Public business info audit passed with no manual-review notes.')
}
