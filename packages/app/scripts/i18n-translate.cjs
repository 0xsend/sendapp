#!/usr/bin/env node
const fs = require('node:fs/promises')
const path = require('node:path')

const resourcesDir = path.join(__dirname, '..', 'i18n', 'resources')
const envCandidates = [
  path.join(__dirname, '..', '..', '..', '.env.local'),
  path.join(__dirname, '..', '..', '..', '.env'),
]

let verboseMode = false

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
    verbose: false,
    backup: false,
    model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
    maxRetries: 3,
    delayMs: 1500,
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
    } else if (token === '--verbose' || token === '-v') {
      args.verbose = true
    } else if (token === '--backup') {
      args.backup = true
    } else if (token === '--model') {
      args.model = argv[i + 1]
      i += 1
    } else if (token === '--max-retries') {
      args.maxRetries = Number.parseInt(argv[i + 1], 10)
      i += 1
    } else if (token === '--delay') {
      args.delayMs = Number.parseInt(argv[i + 1], 10)
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

function extractPlaceholders(text) {
  // Match {{variable}}, {variable}, %s, %d, etc.
  const patterns = [
    /\{\{[^}]+\}\}/g, // {{count}}
    /\{[^}]+\}/g, // {value}
    /%[sd]/g, // %s, %d
  ]

  const found = new Set()
  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches) {
      for (const match of matches) {
        found.add(match)
      }
    }
  }
  return Array.from(found)
}

function validatePlaceholders(source, translation) {
  const sourcePlaceholders = extractPlaceholders(source)
  const translationPlaceholders = extractPlaceholders(translation)

  for (const placeholder of sourcePlaceholders) {
    if (!translationPlaceholders.includes(placeholder)) {
      return {
        valid: false,
        error: `Missing placeholder: ${placeholder}`,
      }
    }
  }

  return { valid: true }
}

function extractJSON(content) {
  // Try markdown code block first
  const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Fallback to regex
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }

  return content
}

function estimateTokens(text) {
  // Rough estimate: 1 token ≈ 4 characters for English, 2 for Chinese
  return Math.ceil(text.length / 3)
}

function calculateMaxTokens(entries) {
  const inputText = JSON.stringify(entries)
  const inputTokens = estimateTokens(inputText)
  // Output could be 1.5x input for Chinese, add buffer
  const estimatedOutputTokens = Math.ceil(inputTokens * 2)
  // Minimum 2000, maximum 16000
  return Math.max(2000, Math.min(16000, estimatedOutputTokens))
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestTranslations({ apiKey, model, locale, namespace, entries, maxRetries }) {
  const systemPrompt =
    'You are translating UI copy for the Send app. Output valid JSON with the same keys. Maintain placeholders and keep sentences concise.'
  const userPayload = {
    locale,
    namespace,
    instructions:
      'Translate each entry value from English into the target locale. Preserve placeholders like {value} or {{count}}. Return JSON only.',
    entries,
  }

  const maxTokens = calculateMaxTokens(entries)

  if (verboseMode) {
    console.log(`[i18n] Using max_tokens: ${maxTokens} for ${entries.length} entries`)
  }

  let lastError
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
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
          max_tokens: maxTokens,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`OpenRouter responded with ${response.status}: ${text}`)
      }

      const data = await response.json()
      if (verboseMode) {
        console.log('[i18n] Raw OpenRouter payload:', JSON.stringify(data, null, 2))
      }

      const content = data.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('OpenRouter returned an empty response')
      }

      const jsonText = extractJSON(content)

      try {
        return JSON.parse(jsonText)
      } catch (error) {
        throw new Error(`Failed to parse translation JSON: ${jsonText}`)
      }
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        const backoffMs = 1000 * 2 ** (attempt - 1)
        console.warn(
          `[i18n] Attempt ${attempt}/${maxRetries} failed for ${namespace}, retrying in ${backoffMs}ms...`
        )
        await sleep(backoffMs)
      }
    }
  }

  throw lastError
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

async function backupFile(filePath) {
  try {
    const backupPath = `${filePath}.backup-${Date.now()}`
    await fs.copyFile(filePath, backupPath)
    if (verboseMode) {
      console.log(`[i18n] Backed up to ${backupPath}`)
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

async function processNamespace({
  locale,
  namespace,
  dryRun,
  force,
  backup,
  model,
  apiKey,
  maxRetries,
}) {
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
    console.log(`[i18n] ${namespace}:${locale} ✓ up-to-date`)
    return { success: true, translated: 0 }
  }

  const requestEntries = missingEntries.map(({ path: pathKeys, value }) => ({
    key: pathKeys.join('.'),
    source: value,
    existing: force ? getValueAt(target, pathKeys) : undefined,
  }))

  if (dryRun) {
    console.log(
      `[i18n] ${namespace}:${locale} [DRY RUN] would translate ${missingEntries.length} entr${missingEntries.length === 1 ? 'y' : 'ies'}`
    )
    return { success: true, translated: 0 }
  }

  if (backup) {
    await backupFile(targetPath)
  }

  const translationsRaw = await requestTranslations({
    apiKey,
    model,
    locale,
    namespace,
    entries: requestEntries,
    maxRetries,
  })
  const translations = normalizeTranslations(translationsRaw)

  const validationErrors = []

  for (const { path: pathKeys, value: sourceValue } of missingEntries) {
    const key = pathKeys.join('.')
    const translated = (() => {
      const nested = getValueAt(translations, pathKeys)
      if (typeof nested === 'string' && nested.trim().length > 0) return nested
      const flat = translations[key]
      if (typeof flat === 'string' && flat.trim().length > 0) return flat
      return undefined
    })()

    if (typeof translated !== 'string') {
      if (verboseMode) {
        console.log('[i18n] Available translation keys:', Object.keys(translations || {}))
        console.log('[i18n] Translation object snapshot:', JSON.stringify(translations, null, 2))
      }
      throw new Error(`Translation missing for key ${key} in namespace ${namespace}`)
    }

    // Validate placeholders
    const validation = validatePlaceholders(sourceValue, translated)
    if (!validation.valid) {
      validationErrors.push(`${key}: ${validation.error}`)
      // Use source as fallback if placeholder validation fails
      if (verboseMode) {
        console.warn(`[i18n] Placeholder validation failed for ${key}: ${validation.error}`)
      }
      setValueAt(target, pathKeys, sourceValue)
    } else {
      setValueAt(target, pathKeys, translated)
    }
  }

  if (validationErrors.length > 0) {
    console.warn(
      `[i18n] ${namespace}:${locale} ⚠ ${validationErrors.length} placeholder validation error(s)`
    )
    if (verboseMode) {
      for (const error of validationErrors) {
        console.warn(`  - ${error}`)
      }
    }
  }

  await ensureDirectory(namespaceDir)
  await fs.writeFile(targetPath, `${JSON.stringify(sortObject(target), null, 2)}\n`, 'utf8')
  console.log(
    `[i18n] ${namespace}:${locale} ✓ updated (${missingEntries.length} entr${missingEntries.length === 1 ? 'y' : 'ies'})`
  )

  return { success: true, translated: missingEntries.length }
}

async function main() {
  await hydrateEnvFromFiles()
  const { locale, namespace, dryRun, force, verbose, backup, model, maxRetries, delayMs } =
    parseArgs(process.argv.slice(2))

  verboseMode = verbose || process.env.I18N_TRANSLATE_DEBUG === '1'

  if (!locale) {
    console.error(
      'Usage: yarn i18n:translate --locale <locale> [options]\n\n' +
        'Options:\n' +
        '  --locale, -l <locale>      Target locale (required, e.g., zh, es, fr)\n' +
        '  --namespace, -n <name>     Specific namespace(s) comma-separated\n' +
        '  --dry-run                  Preview without making changes\n' +
        '  --force                    Retranslate all entries (not just missing)\n' +
        '  --verbose, -v              Enable verbose logging\n' +
        '  --backup                   Backup existing files before overwriting\n' +
        '  --model <id>               OpenRouter model ID (default: gemini-2.0-flash-001)\n' +
        '  --max-retries <n>          Max retry attempts (default: 3)\n' +
        '  --delay <ms>               Delay between namespaces (default: 1500ms)'
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

  console.log(`[i18n] Translating ${namespaces.length} namespace(s) to ${locale}`)
  if (verboseMode) {
    console.log(`[i18n] Model: ${model}`)
    console.log(`[i18n] Max retries: ${maxRetries}`)
    console.log(`[i18n] Delay: ${delayMs}ms`)
  }

  const results = []
  const errors = []

  for (let i = 0; i < namespaces.length; i++) {
    const ns = namespaces[i]
    if (!ns) continue

    try {
      const result = await processNamespace({
        locale,
        namespace: ns,
        dryRun,
        force,
        backup,
        model,
        apiKey,
        maxRetries,
      })
      results.push({ namespace: ns, ...result })

      // Rate limiting: delay between requests (except for last one)
      if (i < namespaces.length - 1 && !dryRun && result.translated > 0) {
        if (verboseMode) {
          console.log(`[i18n] Waiting ${delayMs}ms before next namespace...`)
        }
        await sleep(delayMs)
      }
    } catch (error) {
      console.error(`[i18n] ${ns}:${locale} ✗ failed:`, error.message)
      errors.push({ namespace: ns, error: error.message })
      // Continue processing other namespaces instead of exiting
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  const successful = results.filter((r) => r.success).length
  const totalTranslated = results.reduce((sum, r) => sum + (r.translated || 0), 0)

  if (errors.length === 0) {
    console.log(`[i18n] ✓ Success: ${successful}/${namespaces.length} namespaces processed`)
    console.log(`[i18n] Total entries translated: ${totalTranslated}`)
  } else {
    console.log(`[i18n] ⚠ Partial success: ${successful}/${namespaces.length} namespaces processed`)
    console.log(`[i18n] Total entries translated: ${totalTranslated}`)
    console.log(`[i18n] ${errors.length} namespace(s) failed:`)
    for (const { namespace: ns, error } of errors) {
      console.log(`  - ${ns}: ${error}`)
    }
    process.exit(1)
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
