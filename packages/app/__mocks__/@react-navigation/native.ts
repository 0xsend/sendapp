import { jest } from '@jest/globals'

const mockNative = {
  useNavigation: () => ({ navigate: jest.fn() }),
}

export default mockNative
