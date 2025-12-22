import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'afterLoginRedirectUri'

// In-memory cache for synchronous access
let cachedRedirect: string | null = null

export function setAfterLoginRedirect(uri: string): void {
  cachedRedirect = uri
  AsyncStorage.setItem(STORAGE_KEY, uri).catch((error) => {
    console.error('Error saving afterLoginRedirect:', error)
  })
}

export function getAfterLoginRedirect(): string | null {
  return cachedRedirect
}

export function clearAfterLoginRedirect(): void {
  cachedRedirect = null
  AsyncStorage.removeItem(STORAGE_KEY).catch((error) => {
    console.error('Error clearing afterLoginRedirect:', error)
  })
}

export function consumeAfterLoginRedirect(): string | null {
  const uri = getAfterLoginRedirect()
  if (uri) {
    clearAfterLoginRedirect()
  }
  return uri
}

// Initialize cache from AsyncStorage on module load
AsyncStorage.getItem(STORAGE_KEY)
  .then((value) => {
    if (value) {
      cachedRedirect = value
    }
  })
  .catch((error) => {
    console.error('Error loading afterLoginRedirect:', error)
  })
