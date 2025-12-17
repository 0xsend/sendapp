import type { WrappedData } from '../types'

const STORAGE_PREFIX = 'send-wrapped-2025'

/**
 * Generates the storage key for a specific user
 */
function getStorageKey(sendId: number): string {
  return `${STORAGE_PREFIX}:${sendId}`
}

/**
 * Saves wrapped data to localStorage (web)
 */
export async function saveWrappedData(sendId: number, data: WrappedData): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const key = getStorageKey(sendId)
    const serialized = JSON.stringify(data)
    window.localStorage.setItem(key, serialized)
  } catch (error) {
    console.error('Failed to save wrapped data to localStorage:', error)
  }
}

/**
 * Loads wrapped data from localStorage (web)
 */
export async function loadWrappedData(sendId: number): Promise<WrappedData | null> {
  if (typeof window === 'undefined') return null

  try {
    const key = getStorageKey(sendId)
    const serialized = window.localStorage.getItem(key)

    if (!serialized) {
      return null
    }

    return JSON.parse(serialized) as WrappedData
  } catch (error) {
    console.error('Failed to load wrapped data from localStorage:', error)
    return null
  }
}
