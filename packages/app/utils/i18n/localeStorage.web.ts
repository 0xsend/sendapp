const LOCALE_STORAGE_KEY = 'i18n.locale'

export async function getStoredLocale(): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY) ?? undefined
  } catch (error) {
    return undefined
  }
}

export async function setStoredLocale(locale: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch (error) {
    // ignore storage errors (private mode, quota, etc.)
  }
}

export async function clearStoredLocale(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY)
  } catch (error) {
    // ignore storage errors
  }
}
