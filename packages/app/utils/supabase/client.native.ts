import type { Database } from '@my/supabase/database.types'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { gcm } from '@noble/ciphers/aes'
import { utf8ToBytes, bytesToUtf8, bytesToHex, hexToBytes } from '@noble/ciphers/utils'
import { replaceLocalhost } from '../getLocalhost.native'
import { assert } from '../assert'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is not set. Please update the root .env.local and restart the server.'
  )
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please update the root .env.local and restart the server.'
  )
}

const supabaseUrl = replaceLocalhost(process.env.NEXT_PUBLIC_SUPABASE_URL)

// LargeSecureStore handles storing an encryption key in SecureStore
// while storing the encrypted data in AsyncStorage to avoid SecureStore's size limitations
class LargeSecureStore {
  // Key prefix to avoid collisions between encryption keys and data
  private KEY_PREFIX = 'encryption_key_'

  private async _getEncryptionKey(key: string): Promise<Uint8Array> {
    const secureStoreKey = this.KEY_PREFIX + key

    // Try to get existing encryption key
    const existingKeyHex = await SecureStore.getItemAsync(secureStoreKey)
    if (existingKeyHex) {
      return hexToBytes(existingKeyHex)
    }

    // Generate new encryption key if none exists
    const newKey = await Crypto.getRandomBytesAsync(32) // 256 bits
    const newKeyHex = Buffer.from(newKey).toString('hex')

    // Store the encryption key securely
    await SecureStore.setItemAsync(secureStoreKey, newKeyHex)
    return hexToBytes(newKeyHex)
  }

  private async _encrypt(key: string, value: string): Promise<string> {
    // Get or create encryption key
    const encryptionKey = await this._getEncryptionKey(key)

    // Generate nonce (12 bytes for GCM)
    const nonce = await Crypto.getRandomBytesAsync(12)

    // Create the AES-GCM cipher
    const cipher = gcm(encryptionKey, nonce)

    // Encrypt the value
    const valueBytes = utf8ToBytes(value)
    const encrypted = cipher.encrypt(valueBytes)

    // Convert binary data to hex strings for storage
    const nonceHex = bytesToHex(nonce)
    const encryptedHex = bytesToHex(encrypted)

    // Return nonce and encrypted data
    return `${nonceHex}:${encryptedHex}`
  }

  private async _decrypt(key: string, encodedValue: string): Promise<string | null> {
    const secureStoreKey = this.KEY_PREFIX + key

    // Get encryption key
    const encryptionKeyHex = await SecureStore.getItemAsync(secureStoreKey)
    if (!encryptionKeyHex) return null

    // Extract nonce and encrypted data
    const [nonceHex, encryptedHex] = encodedValue.split(':')

    assert(nonceHex !== undefined && encryptedHex !== undefined, 'Invalid encoded value')

    // Convert hex strings back to binary data
    const encryptionKey = hexToBytes(encryptionKeyHex)
    const nonce = hexToBytes(nonceHex)
    const encrypted = hexToBytes(encryptedHex)

    // Create the AES-GCM cipher with the same key and nonce
    const cipher = gcm(encryptionKey, nonce)

    // Decrypt the data
    const decrypted = cipher.decrypt(encrypted)

    // Convert back to string
    return bytesToUtf8(decrypted)
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key)
    if (!encrypted) return null

    return this._decrypt(key, encrypted)
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this._encrypt(key, value)
    await AsyncStorage.setItem(key, encrypted)
  }

  async removeItem(key: string): Promise<void> {
    const secureStoreKey = this.KEY_PREFIX + key
    await AsyncStorage.removeItem(key)
    await SecureStore.deleteItemAsync(secureStoreKey)
  }
}

// Create an instance of LargeSecureStore
const largeSecureStore = new LargeSecureStore()

export const supabase = createClient<Database>(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: largeSecureStore,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
