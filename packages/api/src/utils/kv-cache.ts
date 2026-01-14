import { kv } from '@vercel/kv'
import debug from 'debug'

const log = debug('api:kv-cache')

type CacheOptions = {
  /** TTL in seconds */
  ttl: number
  /** Key prefix for namespacing */
  prefix?: string
}

type CacheResult<T> = { hit: true; data: T } | { hit: false; data: null }

/**
 * Get a cached value by key.
 * Returns { hit: true, data } on cache hit, { hit: false, data: null } on miss or error.
 * Errors are logged but swallowed (fail-open strategy).
 */
export async function cacheGet<T>(key: string, prefix?: string): Promise<CacheResult<T>> {
  const fullKey = prefix ? `${prefix}:${key}` : key
  try {
    const data = await kv.get<T>(fullKey)
    if (data !== null && data !== undefined) {
      log('cache hit: %s', fullKey)
      return { hit: true, data }
    }
    log('cache miss: %s', fullKey)
    return { hit: false, data: null }
  } catch (error) {
    log('cache get error for %s: %O', fullKey, error)
    return { hit: false, data: null }
  }
}

/**
 * Set a value in cache with TTL.
 * Errors are logged but swallowed (fail-open strategy).
 */
export async function cacheSet<T>(key: string, value: T, options: CacheOptions): Promise<void> {
  const fullKey = options.prefix ? `${options.prefix}:${key}` : key
  try {
    await kv.set(fullKey, value, { ex: options.ttl })
    log('cache set: %s (ttl=%ds)', fullKey, options.ttl)
  } catch (error) {
    log('cache set error for %s: %O', fullKey, error)
  }
}

/**
 * Fetch data with cache-aside pattern.
 * Attempts cache first, falls back to fetcher on miss, then caches result.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const cached = await cacheGet<T>(key, options.prefix)
  if (cached.hit) {
    return cached.data
  }

  const data = await fetcher()
  await cacheSet(key, data, options)
  return data
}
