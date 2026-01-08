import { usePathname } from './usePathname'

/**
 * Returns a deep link URL for the current screen, suitable for redirect_uri.
 * Native implementation uses the app scheme + current pathname.
 */
export function useRedirectUri(): string {
  const pathname = usePathname()
  // The app scheme is configured in apps/expo/app.config.ts
  return `send://${pathname}`
}
