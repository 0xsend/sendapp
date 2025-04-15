import { jest } from '@jest/globals'

const mockExpoPasskeys = {
  createPasskey: jest.fn(),
  signWithPasskey: jest.fn(),
}

export default mockExpoPasskeys
