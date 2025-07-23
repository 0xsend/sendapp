import { jest } from '@jest/globals'

const mockToast = {
  useAppToast: jest.fn(() => ({
    show: jest.fn(),
  })),
}

export const useAppToast = mockToast.useAppToast

export default mockToast
