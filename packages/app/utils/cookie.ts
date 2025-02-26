import { isWeb } from '@my/ui'
import { Platform } from 'react-native'
// TODO: do a native compatible solution
export function getCookie(name: string): string | undefined {
  if (!isWeb) {
    console.warn(`getCookie is not supported on ${Platform.OS}`)
    return undefined
  }
  if (typeof document === 'undefined') return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
}

export function setCookie(name: string, value: string, maxAge: number): void {
  if (!isWeb) {
    console.warn(`setCookie is not supported on ${Platform.OS}`)
    return
  }
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/;`
}
