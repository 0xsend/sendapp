const mockWagmi = {
  useChainId: jest.fn().mockReturnValue(845337),
  createConfig: jest.fn().mockReturnValue({}),
  useBalance: jest.fn().mockReturnValue({
    data: {
      decimals: 6,
      formatted: '0',
      symbol: 'USDC',
      value: 0n,
      refetch: jest.fn(),
    },
  }),
  useBytecode: jest.fn().mockReturnValue({
    data: '0x123',
    isLoading: false,
    isSuccess: true,
    isFetched: true,
    error: null,
  }),
  useTransactionCount: jest.fn().mockReturnValue({
    data: 0n,
    isSuccess: true,
    error: null,
  }),
}

export const useChainId = mockWagmi.useChainId
export const createConfig = mockWagmi.createConfig
export const useBalance = mockWagmi.useBalance
export const useBytecode = mockWagmi.useBytecode
export const useTransactionCount = mockWagmi.useTransactionCount

export default mockWagmi
