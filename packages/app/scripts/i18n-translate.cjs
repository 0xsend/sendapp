#!/usr/bin/env node
const fs = require('node:fs/promises')
const path = require('node:path')

const resourcesDir = path.join(__dirname, '..', 'i18n', 'resources')
const envCandidates = [
  path.join(__dirname, '..', '..', '..', '.env.local'),
  path.join(__dirname, '..', '..', '..', '.env'),
]

let debugMode = false

async function hydrateEnvFromFiles() {
  for (const envPath of envCandidates) {
    try {
      const contents = await fs.readFile(envPath, 'utf8')
      const lines = contents.split(/\r?\n/)
      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const [rawKey, ...rest] = line.split('=')
        const key = rawKey?.trim()
        if (!key || process.env[key]) continue
        const value = rest
          .join('=')
          .trim()
          .replace(/^['"]|['"]$/g, '')
        if (value) {
          process.env[key] = value
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`[i18n] Failed to read ${envPath}:`, error.message)
      }
    }
  }
}

function parseArgs(argv) {
  const args = {
    locale: undefined,
    namespace: undefined,
    dryRun: false,
    force: false,
    model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
  }

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--locale' || token === '-l') {
      args.locale = argv[i + 1]
      i += 1
    } else if (token === '--namespace' || token === '-n') {
      args.namespace = argv[i + 1]
      i += 1
    } else if (token === '--dry-run') {
      args.dryRun = true
    } else if (token === '--force') {
      args.force = true
    } else if (token === '--model') {
      args.model = argv[i + 1]
      i += 1
    }
  }

  return args
}

function flattenEntries(object, prefix = []) {
  return Object.entries(object).flatMap(([key, value]) => {
    const nextPath = [...prefix, key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenEntries(value, nextPath)
    }
    return [{ path: nextPath, value }]
  })
}

function getValueAt(object, pathKeys) {
  return pathKeys.reduce((acc, key) => {
    if (acc && typeof acc === 'object') {
      return acc[key]
    }
    return undefined
  }, object)
}

function setValueAt(object, pathKeys, value) {
  let cursor = object
  for (let index = 0; index < pathKeys.length; index += 1) {
    const key = pathKeys[index]
    if (index === pathKeys.length - 1) {
      cursor[key] = value
      return
    }
    if (!cursor[key] || typeof cursor[key] !== 'object') {
      cursor[key] = {}
    }
    cursor = cursor[key]
  }
}

function sortObject(value) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return value
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObject(value[key])
      return acc
    }, {})
}

async function readJson(filePath) {
  const contents = await fs.readFile(filePath, 'utf8')
  return JSON.parse(contents)
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function listNamespaces() {
  const entries = await fs.readdir(resourcesDir, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
}

async function requestTranslations({ apiKey, model, locale, namespace, entries }) {
  const systemPrompt =
    'You are translating UI copy for the Send app. Output valid JSON with the same keys. Maintain placeholders and keep sentences concise.'
  const userPayload = {
    locale,
    namespace,
    instructions:
      'Translate each entry value from English into the target locale. Preserve placeholders like {value} or {{count}}. Return JSON only.',
    entries,
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
      temperature: 0.2,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenRouter responded with ${response.status}: ${text}`)
  }

  const data = await response.json()
  if (debugMode) {
    console.log('[i18n] Raw OpenRouter payload:', JSON.stringify(data, null, 2))
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenRouter returned an empty response')
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  const jsonText = jsonMatch ? jsonMatch[0] : content

  try {
    return JSON.parse(jsonText)
  } catch (error) {
    throw new Error(`Failed to parse translation JSON: ${jsonText}`)
  }
}

function normalizeTranslations(raw) {
  if (!raw || typeof raw !== 'object') return {}

  if (Array.isArray(raw.entries)) {
    return raw.entries.reduce((acc, entry) => {
      if (!entry || typeof entry !== 'object') return acc
      const key = entry.key || entry.id || entry.path
      const value = entry.translation || entry.value || entry.text || entry.target || entry.source
      if (key && typeof value === 'string') {
        acc[key] = value
      }
      return acc
    }, {})
  }

  if (typeof raw.translations === 'object' && raw.translations !== null) {
    return normalizeTranslations(raw.translations)
  }

  return raw
}

async function processNamespace({ locale, namespace, dryRun, force, model, apiKey }) {
  const namespaceDir = path.join(resourcesDir, namespace)
  const sourcePath = path.join(namespaceDir, 'en.json')
  const targetPath = path.join(namespaceDir, `${locale}.json`)

  let source
  try {
    source = await readJson(sourcePath)
  } catch (error) {
    throw new Error(`Missing English source for namespace ${namespace}: ${sourcePath}`)
  }

  let target = {}
  try {
    target = await readJson(targetPath)
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error
    }
  }

  const sourceEntries = flattenEntries(source)
  const missingEntries = sourceEntries.filter(({ path: pathKeys }) => {
    if (force) return true
    const existing = getValueAt(target, pathKeys)
    return typeof existing !== 'string' || existing.trim().length === 0
  })

  if (missingEntries.length === 0) {
    console.log(`[i18n] ${namespace}:${locale} up-to-date`)
    return
  }

  const requestEntries = missingEntries.map(({ path: pathKeys, value }) => ({
    key: pathKeys.join('.'),
    source: value,
    existing: force ? getValueAt(target, pathKeys) : undefined,
  }))

  if (dryRun) {
    console.log(
      `[i18n] DRY RUN - would translate ${missingEntries.length} entries for ${namespace}:${locale}`
    )
    return
  }

  const translationsRaw = await requestTranslations({
    apiKey,
    model,
    locale,
    namespace,
    entries: requestEntries,
  })
  const translations = normalizeTranslations(translationsRaw)

  for (const { path: pathKeys } of missingEntries) {
    const key = pathKeys.join('.')
    const translated = (() => {
      const nested = getValueAt(translations, pathKeys)
      if (typeof nested === 'string' && nested.trim().length > 0) return nested
      const flat = translations[key]
      if (typeof flat === 'string' && flat.trim().length > 0) return flat
      return undefined
    })()

    if (typeof translated !== 'string') {
      if (debugMode) {
        console.log('[i18n] Available translation keys:', Object.keys(translations || {}))
        console.log('[i18n] Translation object snapshot:', JSON.stringify(translations, null, 2))
      }
      throw new Error(`Translation missing for key ${key} in namespace ${namespace}`)
    }
    setValueAt(target, pathKeys, translated)
  }

  await ensureDirectory(namespaceDir)
  await fs.writeFile(targetPath, `${JSON.stringify(sortObject(target), null, 2)}\n`, 'utf8')
  console.log(
    `[i18n] Updated ${namespace}:${locale} (${missingEntries.length} entr${missingEntries.length === 1 ? 'y' : 'ies'})`
  )
}

async function main() {
  await hydrateEnvFromFiles()
  debugMode = process.env.I18N_TRANSLATE_DEBUG === '1'
  const { locale, namespace, dryRun, force, model } = parseArgs(process.argv.slice(2))

  if (!locale) {
    console.error(
      'Usage: yarn i18n:translate --locale <locale> [--namespace <name>] [--dry-run] [--force] [--model <id>]'
    )
    process.exit(1)
  }
  if (locale === 'en') {
    console.error('Target locale cannot be English (en).')
    process.exit(1)
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey && !dryRun) {
    console.error('OPENROUTER_API_KEY is not set. Use --dry-run to preview without translating.')
    process.exit(1)
  }

  const namespaces = namespace
    ? namespace.split(',').map((name) => name.trim())
    : await listNamespaces()

  for (const ns of namespaces) {
    if (!ns) continue
    try {
      await processNamespace({ locale, namespace: ns, dryRun, force, model, apiKey })
    } catch (error) {
      console.error(`[i18n] Failed to translate ${ns}:${locale}`, error)
      process.exit(1)
    }
  }
}

main()
  .then(() => {
    // noop
  })
  .catch((error) => {
    console.error('[i18n] Unexpected error', error)
    process.exit(1)
  })
