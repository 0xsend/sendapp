const mockRainbowKit = {
  useChainModal: jest.fn().mockReturnValue({
    openChainModal: jest.fn(),
  }),
  useConnectModal: jest.fn().mockReturnValue({
    openConnectModal: jest.fn(),
  }),
}

export const useChainModal = mockRainbowKit.useChainModal
export const useConnectModal = mockRainbowKit.useConnectModal
export default mockRainbowKit
