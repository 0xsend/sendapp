import AsyncStorage from '@react-native-async-storage/async-storage'

const LOCALE_STORAGE_KEY = 'i18n.locale'

export async function getStoredLocale(): Promise<string | undefined> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY)
    return stored ?? undefined
  } catch (error) {
    return undefined
  }
}

export async function setStoredLocale(locale: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch (error) {
    // deliberate no-op; locale persistence is best-effort
  }
}

export async function clearStoredLocale(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCALE_STORAGE_KEY)
  } catch (error) {
    // ignore
  }
}
