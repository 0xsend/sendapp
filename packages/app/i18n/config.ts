import type { InitOptions, i18n } from 'i18next'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Locale } from 'expo-localization'

import { getStoredLocale, setStoredLocale } from '../utils/i18n/localeStorage'
import commonEn from './resources/common/en.json'
import commonEs from './resources/common/es.json'
import commonZh from './resources/common/zh.json'
import commonDe from './resources/common/de.json'
import commonFr from './resources/common/fr.json'
import accountEn from './resources/account/en.json'
import accountEs from './resources/account/es.json'
import accountZh from './resources/account/zh.json'
import accountDe from './resources/account/de.json'
import accountFr from './resources/account/fr.json'
import affiliateEn from './resources/affiliate/en.json'
import affiliateEs from './resources/affiliate/es.json'
import affiliateZh from './resources/affiliate/zh.json'
import affiliateDe from './resources/affiliate/de.json'
import affiliateFr from './resources/affiliate/fr.json'
import activityEn from './resources/activity/en.json'
import activityEs from './resources/activity/es.json'
import activityZh from './resources/activity/zh.json'
import activityDe from './resources/activity/de.json'
import activityFr from './resources/activity/fr.json'
import exploreEn from './resources/explore/en.json'
import exploreEs from './resources/explore/es.json'
import exploreZh from './resources/explore/zh.json'
import exploreDe from './resources/explore/de.json'
import exploreFr from './resources/explore/fr.json'
import investEn from './resources/invest/en.json'
import investEs from './resources/invest/es.json'
import investZh from './resources/invest/zh.json'
import investDe from './resources/invest/de.json'
import investFr from './resources/invest/fr.json'
import depositEn from './resources/deposit/en.json'
import depositEs from './resources/deposit/es.json'
import depositZh from './resources/deposit/zh.json'
import depositDe from './resources/deposit/de.json'
import depositFr from './resources/deposit/fr.json'
import leaderboardEn from './resources/leaderboard/en.json'
import leaderboardEs from './resources/leaderboard/es.json'
import leaderboardZh from './resources/leaderboard/zh.json'
import leaderboardDe from './resources/leaderboard/de.json'
import leaderboardFr from './resources/leaderboard/fr.json'
import earnEn from './resources/earn/en.json'
import earnEs from './resources/earn/es.json'
import earnZh from './resources/earn/zh.json'
import earnDe from './resources/earn/de.json'
import earnFr from './resources/earn/fr.json'
import cantonWalletEn from './resources/canton-wallet/en.json'
import cantonWalletEs from './resources/canton-wallet/es.json'
import cantonWalletZh from './resources/canton-wallet/zh.json'
import cantonWalletDe from './resources/canton-wallet/de.json'
import cantonWalletFr from './resources/canton-wallet/fr.json'
import rewardsEn from './resources/rewards/en.json'
import rewardsEs from './resources/rewards/es.json'
import rewardsZh from './resources/rewards/zh.json'
import rewardsDe from './resources/rewards/de.json'
import rewardsFr from './resources/rewards/fr.json'
import sendpotEn from './resources/sendpot/en.json'
import sendpotEs from './resources/sendpot/es.json'
import sendpotZh from './resources/sendpot/zh.json'
import sendpotDe from './resources/sendpot/de.json'
import sendpotFr from './resources/sendpot/fr.json'
import sendEn from './resources/send/en.json'
import sendEs from './resources/send/es.json'
import sendZh from './resources/send/zh.json'
import sendDe from './resources/send/de.json'
import sendFr from './resources/send/fr.json'
import secretShopEn from './resources/secret-shop/en.json'
import secretShopEs from './resources/secret-shop/es.json'
import secretShopZh from './resources/secret-shop/zh.json'
import secretShopDe from './resources/secret-shop/de.json'
import secretShopFr from './resources/secret-shop/fr.json'
import sendTokenUpgradeEn from './resources/send-token-upgrade/en.json'
import sendTokenUpgradeEs from './resources/send-token-upgrade/es.json'
import sendTokenUpgradeZh from './resources/send-token-upgrade/zh.json'
import sendTokenUpgradeDe from './resources/send-token-upgrade/de.json'
import sendTokenUpgradeFr from './resources/send-token-upgrade/fr.json'
import paymasterAllowanceEn from './resources/paymaster-allowance/en.json'
import paymasterAllowanceEs from './resources/paymaster-allowance/es.json'
import paymasterAllowanceZh from './resources/paymaster-allowance/zh.json'
import paymasterAllowanceDe from './resources/paymaster-allowance/de.json'
import paymasterAllowanceFr from './resources/paymaster-allowance/fr.json'
import tradeEn from './resources/trade/en.json'
import tradeEs from './resources/trade/es.json'
import tradeZh from './resources/trade/zh.json'
import tradeDe from './resources/trade/de.json'
import tradeFr from './resources/trade/fr.json'
import homeEn from './resources/home/en.json'
import homeEs from './resources/home/es.json'
import homeZh from './resources/home/zh.json'
import homeDe from './resources/home/de.json'
import homeFr from './resources/home/fr.json'
import navigationEn from './resources/navigation/en.json'
import navigationEs from './resources/navigation/es.json'
import navigationZh from './resources/navigation/zh.json'
import navigationDe from './resources/navigation/de.json'
import navigationFr from './resources/navigation/fr.json'
import maintenanceEn from './resources/maintenance/en.json'
import maintenanceEs from './resources/maintenance/es.json'
import maintenanceZh from './resources/maintenance/zh.json'
import maintenanceDe from './resources/maintenance/de.json'
import maintenanceFr from './resources/maintenance/fr.json'
import onboardingEn from './resources/onboarding/en.json'
import onboardingEs from './resources/onboarding/es.json'
import onboardingZh from './resources/onboarding/zh.json'
import onboardingDe from './resources/onboarding/de.json'
import onboardingFr from './resources/onboarding/fr.json'
import settingsEn from './resources/settings/en.json'
import settingsEs from './resources/settings/es.json'
import settingsZh from './resources/settings/zh.json'
import settingsDe from './resources/settings/de.json'
import settingsFr from './resources/settings/fr.json'
import splashEn from './resources/splash/en.json'
import splashEs from './resources/splash/es.json'
import splashZh from './resources/splash/zh.json'
import splashDe from './resources/splash/de.json'
import splashFr from './resources/splash/fr.json'
import unknownEn from './resources/unknown/en.json'
import unknownEs from './resources/unknown/es.json'
import unknownZh from './resources/unknown/zh.json'
import unknownDe from './resources/unknown/de.json'
import unknownFr from './resources/unknown/fr.json'

export const DEFAULT_NAMESPACE = 'common'
export const DEFAULT_LOCALE = 'en'

export const resources = {
  en: {
    [DEFAULT_NAMESPACE]: commonEn,
    account: accountEn,
    affiliate: affiliateEn,
    activity: activityEn,
    explore: exploreEn,
    earn: earnEn,
    invest: investEn,
    deposit: depositEn,
    leaderboard: leaderboardEn,
    cantonWallet: cantonWalletEn,
    rewards: rewardsEn,
    sendpot: sendpotEn,
    send: sendEn,
    secretShop: secretShopEn,
    sendTokenUpgrade: sendTokenUpgradeEn,
    paymasterAllowance: paymasterAllowanceEn,
    trade: tradeEn,
    home: homeEn,
    navigation: navigationEn,
    maintenance: maintenanceEn,
    onboarding: onboardingEn,
    settings: settingsEn,
    splash: splashEn,
    unknown: unknownEn,
  },
  es: {
    [DEFAULT_NAMESPACE]: commonEs,
    account: accountEs,
    affiliate: affiliateEs,
    activity: activityEs,
    explore: exploreEs,
    earn: earnEs,
    invest: investEs,
    deposit: depositEs,
    leaderboard: leaderboardEs,
    cantonWallet: cantonWalletEs,
    rewards: rewardsEs,
    sendpot: sendpotEs,
    send: sendEs,
    secretShop: secretShopEs,
    sendTokenUpgrade: sendTokenUpgradeEs,
    paymasterAllowance: paymasterAllowanceEs,
    trade: tradeEs,
    home: homeEs,
    navigation: navigationEs,
    maintenance: maintenanceEs,
    onboarding: onboardingEs,
    settings: settingsEs,
    splash: splashEs,
    unknown: unknownEs,
  },
  zh: {
    [DEFAULT_NAMESPACE]: commonZh,
    account: accountZh,
    activity: activityZh,
    affiliate: affiliateZh,
    cantonWallet: cantonWalletZh,
    deposit: depositZh,
    earn: earnZh,
    explore: exploreZh,
    home: homeZh,
    invest: investZh,
    leaderboard: leaderboardZh,
    maintenance: maintenanceZh,
    navigation: navigationZh,
    onboarding: onboardingZh,
    paymasterAllowance: paymasterAllowanceZh,
    rewards: rewardsZh,
    secretShop: secretShopZh,
    send: sendZh,
    sendTokenUpgrade: sendTokenUpgradeZh,
    sendpot: sendpotZh,
    settings: settingsZh,
    splash: splashZh,
    trade: tradeZh,
    unknown: unknownZh,
  },
  de: {
    [DEFAULT_NAMESPACE]: commonDe,
    account: accountDe,
    activity: activityDe,
    affiliate: affiliateDe,
    cantonWallet: cantonWalletDe,
    deposit: depositDe,
    earn: earnDe,
    explore: exploreDe,
    home: homeDe,
    invest: investDe,
    leaderboard: leaderboardDe,
    maintenance: maintenanceDe,
    navigation: navigationDe,
    onboarding: onboardingDe,
    paymasterAllowance: paymasterAllowanceDe,
    rewards: rewardsDe,
    secretShop: secretShopDe,
    send: sendDe,
    sendTokenUpgrade: sendTokenUpgradeDe,
    sendpot: sendpotDe,
    settings: settingsDe,
    splash: splashDe,
    trade: tradeDe,
    unknown: unknownDe,
  },
  fr: {
    [DEFAULT_NAMESPACE]: commonFr,
    account: accountFr,
    activity: activityFr,
    affiliate: affiliateFr,
    cantonWallet: cantonWalletFr,
    deposit: depositFr,
    earn: earnFr,
    explore: exploreFr,
    home: homeFr,
    invest: investFr,
    leaderboard: leaderboardFr,
    maintenance: maintenanceFr,
    navigation: navigationFr,
    onboarding: onboardingFr,
    paymasterAllowance: paymasterAllowanceFr,
    rewards: rewardsFr,
    secretShop: secretShopFr,
    send: sendFr,
    sendTokenUpgrade: sendTokenUpgradeFr,
    sendpot: sendpotFr,
    settings: settingsFr,
    splash: splashFr,
    trade: tradeFr,
    unknown: unknownFr,
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

  // Auto-detection disabled - users must explicitly choose language in settings
  // This ensures all new users default to English
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
