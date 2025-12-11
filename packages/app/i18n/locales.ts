import { resources, DEFAULT_LOCALE, type AppLocale } from './config'

const FALLBACK_LABELS: Partial<Record<AppLocale, string>> = {
  en: 'English',
  es: 'Español',
  zh: '中文',
  de: 'Deutsch',
  fr: 'Français',
}

export const SUPPORTED_LOCALES = Object.keys(resources) as AppLocale[]

function normalizeLocaleCode(locale?: string): string | undefined {
  if (!locale) return undefined
  return locale.toLowerCase()
}

export function getLocaleDisplayName(locale: string, displayLocale?: string): string {
  const normalizedTarget = normalizeLocaleCode(locale)
  if (!normalizedTarget) return DEFAULT_LOCALE

  const languagePart = normalizedTarget.split('-')[0] ?? normalizedTarget

  if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
    try {
      const displayNames = new Intl.DisplayNames([displayLocale ?? normalizedTarget], {
        type: 'language',
      })
      const label = displayNames.of(normalizedTarget) ?? displayNames.of(languagePart)
      if (label) {
        // Capitalize first letter for consistency
        return label.charAt(0).toUpperCase() + label.slice(1)
      }
    } catch (error) {
      // Ignore display failures and fall back to static labels.
    }
  }

  const fallbackKey = languagePart as AppLocale
  return FALLBACK_LABELS[fallbackKey] ?? FALLBACK_LABELS[DEFAULT_LOCALE] ?? locale
}

export function getSupportedLocaleOptions() {
  return SUPPORTED_LOCALES.map((locale) => ({
    value: locale,
    autonym: getLocaleDisplayName(locale, locale),
  }))
}
