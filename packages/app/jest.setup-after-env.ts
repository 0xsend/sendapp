import { jest } from '@jest/globals'
import nock from 'nock'

nock.disableNetConnect()

jest.mock('@react-navigation/native')
jest.mock('react-native-passkeys')
jest.mock('app/utils/send-accounts')
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('app/utils/supabase/client')
jest.mock('app/utils/useAddressBook')

// Mock expo-constants to provide a fixed hostUri for tests
// This is needed for:
// 1. getRpcUrl.native.ts which uses Constants.expoConfig?.hostUri for localhost IP resolution
// 2. CustomToast.tsx which uses Constants.executionEnvironment
jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: 'localhost:8081',
  },
  executionEnvironment: 'storeClient',
  ExecutionEnvironment: {
    StoreClient: 'storeClient',
    Standalone: 'standalone',
    Browser: 'browser',
  },
}))
