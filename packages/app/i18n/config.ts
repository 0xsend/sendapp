import type { InitOptions, i18n } from 'i18next'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Locale } from 'expo-localization'

import { getStoredLocale, setStoredLocale } from '../utils/i18n/localeStorage'
import commonEn from './resources/common/en.json'
import commonEs from './resources/common/es.json'
import onboardingEn from './resources/onboarding/en.json'
import onboardingEs from './resources/onboarding/es.json'
import settingsEn from './resources/settings/en.json'
import settingsEs from './resources/settings/es.json'

export const DEFAULT_NAMESPACE = 'common'
export const DEFAULT_LOCALE = 'en'

export const resources = {
  en: {
    [DEFAULT_NAMESPACE]: commonEn,
    onboarding: onboardingEn,
    settings: settingsEn,
  },
  es: {
    [DEFAULT_NAMESPACE]: commonEs,
    onboarding: onboardingEs,
    settings: settingsEs,
  },
} as const

const namespaces = Array.from(
  new Set(Object.values(resources).flatMap((locale) => Object.keys(locale)))
)

export type AppResources = typeof resources
export type AppLocale = keyof AppResources
export type AppNamespaces = keyof AppResources[AppLocale]

let sharedInstance: i18n | null = null
let sharedInitPromise: Promise<i18n> | null = null

const RTL_LANGS = new Set(['ar', 'fa', 'he', 'ku', 'ur'])

type LocalizationModule = typeof import('expo-localization')

let localizationModule: LocalizationModule | null | undefined

async function loadLocalization(): Promise<LocalizationModule | null> {
  if (localizationModule !== undefined) {
    return localizationModule
  }

  try {
    localizationModule = await import('expo-localization')
  } catch (error) {
    localizationModule = null
  }

  return localizationModule
}

async function detectSystemLocale(): Promise<string | undefined> {
  try {
    const localization = await loadLocalization()
    const locales = (localization?.getLocales?.() ?? []) as Locale[]
    if (Array.isArray(locales) && locales.length > 0) {
      const locale = locales.find((entry) => entry.languageTag)
      if (locale?.languageTag) {
        return locale.languageTag
      }
    }
  } catch (error) {
    // expo-localization might not be available in SSR/test environments.
  }

  if (typeof navigator !== 'undefined') {
    const browserLocale =
      navigator.language ||
      (Array.isArray(navigator.languages) ? navigator.languages[0] : undefined)
    if (browserLocale) return browserLocale
  }

  return undefined
}

function buildInitOptions(language: string, overrides?: InitOptions): InitOptions {
  return {
    lng: language,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: DEFAULT_NAMESPACE,
    ns: namespaces,
    resources,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    ...overrides,
  }
}

export async function resolvePreferredLocale(explicit?: string): Promise<string> {
  if (explicit) return explicit

  const stored = await getStoredLocale()
  if (stored) return stored

  const detected = await detectSystemLocale()
  if (detected) return detected

  return DEFAULT_LOCALE
}

async function initInstance(instance: i18n, language: string, options?: InitOptions) {
  await instance.use(initReactI18next).init(buildInitOptions(language, options))

  instance.on('languageChanged', (nextLanguage) => {
    void setStoredLocale(nextLanguage)
  })

  return instance
}

interface CreateI18nOptions {
  initialLanguage?: string
  useGlobal?: boolean
  initOptions?: InitOptions
}

export async function createI18nClient({
  initialLanguage,
  useGlobal = false,
  initOptions,
}: CreateI18nOptions = {}): Promise<i18n> {
  if (useGlobal) {
    if (sharedInstance && sharedInitPromise) {
      return sharedInitPromise
    }
  }

  const instance = i18next.createInstance()
  const language = await resolvePreferredLocale(initialLanguage)
  const initPromise = initInstance(instance, language, initOptions)

  if (useGlobal) {
    sharedInstance = instance
    sharedInitPromise = initPromise.then(() => instance)
    return sharedInitPromise
  }

  return initPromise
}

export function getI18n(): i18n | null {
  return sharedInstance
}

export async function initSharedI18n(
  options?: Omit<CreateI18nOptions, 'useGlobal'>
): Promise<i18n> {
  return createI18nClient({ ...options, useGlobal: true })
}

export function getDirection(locale?: string): 'ltr' | 'rtl' {
  const targetLocale = locale ?? sharedInstance?.language ?? DEFAULT_LOCALE
  const base = targetLocale.split('-')[0]?.toLowerCase()
  if (base && RTL_LANGS.has(base)) {
    return 'rtl'
  }
  return 'ltr'
}
