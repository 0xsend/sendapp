export const LOCALE_STORAGE_KEY = 'i18n.locale'

let inMemoryLocale: string | undefined

export async function getStoredLocale(): Promise<string | undefined> {
  return inMemoryLocale
}

export async function setStoredLocale(locale: string): Promise<void> {
  inMemoryLocale = locale
}

export async function clearStoredLocale(): Promise<void> {
  inMemoryLocale = undefined
}
