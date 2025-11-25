#!/usr/bin/env node
const fs = require('node:fs/promises')
const path = require('node:path')

const resourcesDir = path.join(__dirname, '..', 'i18n', 'resources')
const SOURCE_LOCALE = 'en'

async function flattenKeys(object, prefix = '') {
  return Object.entries(object).reduce(async (accPromise, [key, value]) => {
    const acc = await accPromise
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = await flattenKeys(value, nextKey)
      for (const nestedKey of nested) {
        acc.add(nestedKey)
      }
    } else {
      acc.add(nextKey)
    }
    return acc
  }, Promise.resolve(new Set()))
}

async function readJson(filePath) {
  const contents = await fs.readFile(filePath, 'utf8')
  return JSON.parse(contents)
}

async function ensureResourcesDir() {
  try {
    await fs.access(resourcesDir)
    return true
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      console.warn(`[i18n] No resources found at ${resourcesDir}. Nothing to sync.`)
      return false
    }
    throw error
  }
}

async function validateLocale(namespace, locale, baseKeys, issues) {
  const resourcePath = path.join(resourcesDir, namespace, `${locale}.json`)
  try {
    const localeJson = await readJson(resourcePath)
    const localeKeys = await flattenKeys(localeJson)
    for (const key of baseKeys) {
      if (!localeKeys.has(key)) {
        issues.push(`${namespace}:${locale} missing key \`${key}\``)
      }
    }
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      issues.push(`${namespace}:${locale} missing file ${resourcePath}`)
      return
    }
    throw error
  }
}

async function main() {
  const args = process.argv.slice(2)
  const checkOnly = args.includes('--check')
  const resourcesAvailable = await ensureResourcesDir()
  if (!resourcesAvailable) {
    process.exit(checkOnly ? 1 : 0)
  }

  const namespaces = await fs.readdir(resourcesDir)
  const issues = []

  for (const namespace of namespaces) {
    const namespaceDir = path.join(resourcesDir, namespace)
    const stats = await fs.stat(namespaceDir)
    if (!stats.isDirectory()) continue

    const sourcePath = path.join(namespaceDir, `${SOURCE_LOCALE}.json`)
    let sourceJson
    try {
      sourceJson = await readJson(sourcePath)
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        issues.push(`${namespace}:${SOURCE_LOCALE} missing file ${sourcePath}`)
        continue
      }
      throw error
    }

    const baseKeys = await flattenKeys(sourceJson)

    const files = await fs.readdir(namespaceDir)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const locale = path.basename(file, '.json')
      if (locale === SOURCE_LOCALE) continue
      await validateLocale(namespace, locale, baseKeys, issues)
    }
  }

  if (issues.length > 0) {
    console.error('[i18n] Issues detected:')
    for (const issue of issues) {
      console.error(`  - ${issue}`)
    }
    process.exit(1)
  }

  if (!checkOnly) {
    console.log(`[i18n] Checked ${namespaces.length} namespaces. No updates required.`)
  }
}

main().catch((error) => {
  console.error('[i18n] sync failed:', error)
  process.exit(1)
})
