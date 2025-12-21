const STORAGE_KEY = 'afterLoginRedirectUri'

export function setAfterLoginRedirect(uri: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, uri)
  }
}

export function getAfterLoginRedirect(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY)
  }
  return null
}

export function clearAfterLoginRedirect(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function consumeAfterLoginRedirect(): string | null {
  const uri = getAfterLoginRedirect()
  if (uri) {
    clearAfterLoginRedirect()
  }
  return uri
}
