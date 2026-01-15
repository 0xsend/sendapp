import { Platform } from 'react-native'
import { usePathname } from './usePathname'

/**
 * Returns a web URL for the current page.
 * Use this for redirect URIs when the service doesn't support custom URL schemes.
 */
export function useRedirectUri(): string {
  const pathname = usePathname()
  const baseUrl = 'https://send.app'
  return `${baseUrl}${pathname}`
}

/**
 * Returns a deep link URL for the current page on native, web URL on web.
 * Use this when you want the native app to handle the redirect via deep link.
 */
export function useDeepLink(): string {
  const pathname = usePathname()
  const webUrl = useRedirectUri()

  if (Platform.OS !== 'web') {
    // The app scheme is configured in apps/expo/app.config.ts
    return `send://${pathname}`
  }

  return webUrl
}
