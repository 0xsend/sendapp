/**
 * This is mostly copied from packages/app/utils/getLocalhost.native.ts
 */
import Constants from 'expo-constants'

// Cache the localhost value
let localhost: string | undefined

/**
 * Gets the device's IP address for simulator/device connection
 */
function getLocalhost() {
  if (localhost) return localhost
  const debuggerHost = Constants.expoConfig?.hostUri
  localhost = debuggerHost?.split(':')[0]
  if (!localhost) {
    throw new Error('Failed to get localhost. Please point to your production server.')
  }
  return localhost
}

/**
 * Replaces localhost with the device IP in URLs
 */
function replaceLocalhost(address: string) {
  return address.replace('://localhost:', `://${getLocalhost()}:`)
}

/**
 * Processes an RPC URL for native environments (iOS/Android)
 * - Replaces localhost with the actual device IP for the simulator/device connection
 * - Handles both localhost and 127.0.0.1 formats
 *
 * @param url The RPC URL to process
 * @returns The processed URL
 */
export function getRpcUrl(url: string): string {
  // Handle 127.0.0.1 format - convert to localhost format first
  const localhostUrl = url.replace('://127.0.0.1:', '://localhost:')

  // Replace localhost with device IP
  return replaceLocalhost(localhostUrl)
}

/**
 * Processes an array of RPC URLs for native environments
 *
 * @param urls Array of RPC URLs to process
 * @returns Array of processed URLs
 */
export function getRpcUrls(urls: string[]): string[] {
  return urls.map((url) => getRpcUrl(url))
}
