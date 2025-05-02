/**
 * Processes an RPC URL for web environments (pass-through)
 * This is a no-op for web - the native version does the actual work
 *
 * @param url The RPC URL to process
 * @returns The processed URL (unchanged for web)
 */
export function getRpcUrl(url: string): string {
  return url
}

/**
 * Processes an array of RPC URLs for web environments (pass-through)
 *
 * @param urls Array of RPC URLs to process
 * @returns Array of processed URLs (unchanged for web)
 */
export function getRpcUrls(urls: string[]): string[] {
  return urls
}
