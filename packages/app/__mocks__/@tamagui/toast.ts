import { jest } from '@jest/globals'

const mockToast = {
  useToastController: jest.fn(() => ({
    show: jest.fn(),
  })),
}

export const useToastController = mockToast.useToastController

export default mockToast
