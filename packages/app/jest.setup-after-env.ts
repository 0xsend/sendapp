import { jest } from '@jest/globals'
import nock from 'nock'

nock.disableNetConnect()

jest.mock('@react-navigation/native')
jest.mock('react-native-passkeys')
jest.mock('app/utils/send-accounts')
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('app/utils/supabase/client')
jest.mock('app/utils/useAddressBook')
