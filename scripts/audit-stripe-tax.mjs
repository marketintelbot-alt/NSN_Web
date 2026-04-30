#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const repoRoot = process.cwd()
const ignoredDirectories = new Set([
  '.git',
  '.playwright-cli',
  'backend/dist',
  'backend/node_modules',
  'frontend/dist',
  'frontend/node_modules',
  'node_modules',
  'output',
])
const ignoredFiles = new Set(['scripts/audit-stripe-tax.mjs'])
const scannedExtensions = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
])

const checks = [
  {
    label: 'automatic_tax enabled',
    pattern: new RegExp(['automatic', '_', 'tax'].join('') + String.raw`\s*:\s*\{[\s\S]{0,120}?enabled\s*:\s*true`, 'm'),
  },
  {
    label: 'automaticTax true',
    pattern: new RegExp(['automatic', 'Tax'].join('') + String.raw`\s*:\s*true`, 'm'),
  },
  {
    label: 'default tax rates',
    pattern: new RegExp(['default', '_', 'tax', '_', 'rates'].join(''), 'm'),
  },
  {
    label: 'line item tax rates',
    pattern: new RegExp(String.raw`(^|[^A-Za-z0-9_])` + ['tax', '_', 'rates'].join('') + String.raw`\s*:`, 'm'),
  },
]

function shouldSkipDirectory(pathFromRoot) {
  return [...ignoredDirectories].some(
    (ignoredDirectory) =>
      pathFromRoot === ignoredDirectory || pathFromRoot.startsWith(`${ignoredDirectory}/`),
  )
}

function getExtension(filePath) {
  const match = filePath.match(/\.[^.]+$/)
  return match?.[0] || ''
}

function walk(directory) {
  const files = []

  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry)
    const pathFromRoot = relative(repoRoot, absolutePath)
    const stats = statSync(absolutePath)

    if (stats.isDirectory()) {
      if (!shouldSkipDirectory(pathFromRoot)) {
        files.push(...walk(absolutePath))
      }
      continue
    }

    if (ignoredFiles.has(pathFromRoot) || !scannedExtensions.has(getExtension(entry))) {
      continue
    }

    files.push(absolutePath)
  }

  return files
}

const findings = []

for (const filePath of walk(repoRoot)) {
  const source = readFileSync(filePath, 'utf8')

  for (const check of checks) {
    const match = check.pattern.exec(source)

    if (!match) {
      continue
    }

    const line = source.slice(0, match.index).split('\n').length
    findings.push(`${relative(repoRoot, filePath)}:${line} ${check.label}`)
  }
}

if (findings.length > 0) {
  console.error('Stripe tax audit failed. Review these possible tax-collection settings:')
  for (const finding of findings) {
    console.error(`- ${finding}`)
  }
  process.exit(1)
}

console.log('Stripe tax audit passed: no automatic tax enabled and no manual tax rates found.')
