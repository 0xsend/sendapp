import AsyncStorage from '@react-native-async-storage/async-storage'
import type { WrappedData } from '../types'

const STORAGE_PREFIX = 'send-wrapped-2025'

/**
 * Generates the storage key for a specific user
 */
function getStorageKey(sendId: number): string {
  return `${STORAGE_PREFIX}:${sendId}`
}

/**
 * Saves wrapped data to AsyncStorage (native)
 */
export async function saveWrappedData(sendId: number, data: WrappedData): Promise<void> {
  try {
    const key = getStorageKey(sendId)
    const serialized = JSON.stringify(data)
    await AsyncStorage.setItem(key, serialized)
  } catch (error) {
    console.error('Failed to save wrapped data to AsyncStorage:', error)
  }
}

/**
 * Loads wrapped data from AsyncStorage (native)
 */
export async function loadWrappedData(sendId: number): Promise<WrappedData | null> {
  try {
    const key = getStorageKey(sendId)
    const serialized = await AsyncStorage.getItem(key)

    if (!serialized) {
      return null
    }

    return JSON.parse(serialized) as WrappedData
  } catch (error) {
    console.error('Failed to load wrapped data from AsyncStorage:', error)
    return null
  }
}
