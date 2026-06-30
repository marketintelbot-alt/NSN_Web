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
const ignoredFiles = new Set([
  'scripts/audit-public-business-info.mjs',
  'scripts/audit-service-copy.mjs',
])
const scannedExtensions = new Set([
  '.cjs',
  '.cts',
  '.html',
  '.js',
  '.jsx',
  '.md',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
])

const retiredDisplayNamePattern = new RegExp(['Quick', 'Reset'].join(String.raw`\s+`), 'i')
const stableSlugPattern = /\b(?:quick-reset|quick_reset|quickReset|QuickReset)\b/g
const allowedStableSlugReferences = new Map([
  ['backend/src/lib/serviceCatalog.ts', [/id:\s*'quick-reset'/]],
  [
    'backend/src/lib/clientAccounts.ts',
    [/const interiorRefreshServiceKey = 'quick-reset'/, /serviceKey === interiorRefreshServiceKey/],
  ],
])
const interiorRefreshPattern = /Interior Refresh/g
const disallowedInteriorContextPattern =
  /\b(?:exterior wash|wash and dry|foam cannon|hull|topsides|deck)\b/i

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

function getLineNumber(source, index) {
  return source.slice(0, index).split('\n').length
}

function isAllowedStableSlugReference(pathFromRoot, line) {
  return (allowedStableSlugReferences.get(pathFromRoot) || []).some((pattern) =>
    pattern.test(line),
  )
}

function collectInteriorRefreshContextFindings(pathFromRoot, source) {
  const findings = []
  const lines = source.split('\n')

  for (const [index, line] of lines.entries()) {
    if (!interiorRefreshPattern.test(line)) {
      continue
    }

    interiorRefreshPattern.lastIndex = 0
    const trimmedLine = line.trim()
    const standaloneLabel = /^['"`]Interior Refresh['"`],?$/.test(trimmedLine)
    const context = standaloneLabel ? line : lines.slice(index, index + 4).join(' ')

    if (disallowedInteriorContextPattern.test(context)) {
      findings.push(
        `${pathFromRoot}:${index + 1} Interior Refresh copy contains exterior-service language`,
      )
    }
  }

  return findings
}

function collectServiceCatalogFindings(repoRootPath) {
  const findings = []
  const pathFromRoot = 'backend/src/lib/serviceCatalog.ts'
  const source = readFileSync(join(repoRootPath, pathFromRoot), 'utf8')
  const blockMatch = /id:\s*'quick-reset'[\s\S]*?\n\s*\},/.exec(source)

  if (!blockMatch) {
    return [`${pathFromRoot}:1 Interior Refresh service must preserve the quick-reset id`]
  }

  const block = blockMatch[0]
  const blockStartLine = getLineNumber(source, blockMatch.index)

  if (!/name:\s*'Interior Refresh'/.test(block)) {
    findings.push(`${pathFromRoot}:${blockStartLine} quick-reset display name must be Interior Refresh`)
  }

  if (!/flatPriceCents:\s*8500/.test(block)) {
    findings.push(`${pathFromRoot}:${blockStartLine} Interior Refresh public package price must be 8500 cents`)
  }

  if (/flatPriceCents:\s*(?:7995|7999|6000)/.test(block)) {
    findings.push(`${pathFromRoot}:${blockStartLine} Interior Refresh public price is set to the wrong amount`)
  }

  if (!/contractValueCents:\s*8500/.test(block)) {
    findings.push(`${pathFromRoot}:${blockStartLine} Interior Refresh contract package value must be 8500 cents`)
  }

  if (!/scopeType:\s*'interior_only'/.test(block)) {
    findings.push(`${pathFromRoot}:${blockStartLine} Interior Refresh must be marked interior_only`)
  }

  return findings
}

const findings = []

for (const filePath of walk(repoRoot)) {
  const pathFromRoot = relative(repoRoot, filePath)
  const source = readFileSync(filePath, 'utf8')

  const retiredDisplayNameMatch = retiredDisplayNamePattern.exec(source)
  if (retiredDisplayNameMatch) {
    findings.push(
      `${pathFromRoot}:${getLineNumber(source, retiredDisplayNameMatch.index)} retired public service name is still visible`,
    )
  }

  for (const match of source.matchAll(stableSlugPattern)) {
    const lineNumber = getLineNumber(source, match.index)
    const line = source.split('\n')[lineNumber - 1] || ''

    if (!isAllowedStableSlugReference(pathFromRoot, line)) {
      findings.push(`${pathFromRoot}:${lineNumber} quick-reset slug reference needs review`)
    }
  }

  findings.push(...collectInteriorRefreshContextFindings(pathFromRoot, source))
}

findings.push(...collectServiceCatalogFindings(repoRoot))

if (findings.length > 0) {
  console.error('Service copy audit failed:')
  for (const finding of findings) {
    console.error(`- ${finding}`)
  }
  process.exit(1)
}

console.log('Service copy audit passed: Interior Refresh is interior-only, correctly priced, and no retired public service name was found.')
