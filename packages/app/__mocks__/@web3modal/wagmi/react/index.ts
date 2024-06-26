const mockAppKit = {
  useWeb3Modal: jest.fn().mockReturnValue({
    open: jest.fn(),
    close: jest.fn(),
  }),
}

export const useWeb3Modal = mockAppKit.useWeb3Modal

export default mockAppKit
