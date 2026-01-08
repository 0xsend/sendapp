import { usePathname } from './usePathname'

/**
 * Returns a full URL for the current page, suitable for redirect_uri.
 * Web implementation uses NEXT_PUBLIC_URL + current pathname.
 */
export function useRedirectUri(): string {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://send.app'
  return `${baseUrl}${pathname}`
}
