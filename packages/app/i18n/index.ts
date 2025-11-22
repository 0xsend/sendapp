export {
  createI18nClient,
  getDirection,
  getI18n,
  initSharedI18n,
  DEFAULT_LOCALE,
  DEFAULT_NAMESPACE,
  resolvePreferredLocale,
} from './config'

export type { AppResources, AppLocale, AppNamespaces } from './config'

export {
  SUPPORTED_LOCALES,
  getLocaleDisplayName,
  getSupportedLocaleOptions,
} from './locales'
