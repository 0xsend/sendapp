const mockWagmi = {
  __esModule: true,
  useChainId: jest.fn().mockReturnValue(845337),
  createConfig: jest.fn().mockReturnValue({
    chains: [845337],
  }),
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
  useAccount: jest.fn().mockReturnValue({
    isConnected: true,
    address: '0xa71ce00000000000000000000000000000000000',
    chainId: 845337,
    chain: {
      id: 845337,
      name: 'Base',
      nativeCurrency: {
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
    },
  }),
  useConnect: jest.fn().mockReturnValue({
    connect: jest.fn(),
    connectors: [],
    error: null,
  }),
  useSwitchChain: jest.fn().mockReturnValue({
    chains: [
      {
        id: 845337,
        name: 'Base',
      },
    ],
    switchChain: jest.fn(),
    error: null,
  }),
  useWriteContract: jest.fn().mockReturnValue({
    data: '0x123',
    writeContract: jest.fn(),
    isPending: false,
    error: null,
  }),
  useWaitForTransactionReceipt: jest.fn().mockReturnValue({
    data: {
      blockHash: '0x123',
      blockNumber: 123,
      contractAddress: '0x123',
      cumulativeGasUsed: 123,
      from: '0x123',
      gasUsed: 123,
      logs: [],
      logsBloom: '0x123',
      status: 1,
      to: '0x123',
      transactionHash: '0x123',
      transactionIndex: 123,
    },
    isSuccess: true,
    error: null,
  }),
  usePrepareTransactionRequest: jest.fn().mockReturnValue({
    data: {
      to: '0x123',
      value: 0n,
      data: '0x',
    },
    isLoading: false,
    error: null,
    isFetching: false,
    isFetched: true,
  }),
  useSendTransaction: jest.fn().mockReturnValue({
    hash: undefined,
    sendTransaction: jest.fn(),
    sendTransactionAsync: jest.fn(),
    isPending: false,
    error: null,
  }),
  useSwitchAccount: jest.fn().mockReturnValue({
    switchAccount: jest.fn(),
    connectos: [],
  }),
}

export const useChainId = mockWagmi.useChainId
export const createConfig = mockWagmi.createConfig
export const useBalance = mockWagmi.useBalance
export const useBytecode = mockWagmi.useBytecode
export const useTransactionCount = mockWagmi.useTransactionCount
export const useAccount = mockWagmi.useAccount
export const useConnect = mockWagmi.useConnect
export const useSwitchChain = mockWagmi.useSwitchChain
export const useWriteContract = mockWagmi.useWriteContract
export const useWaitForTransactionReceipt = mockWagmi.useWaitForTransactionReceipt
export const usePrepareTransactionRequest = mockWagmi.usePrepareTransactionRequest
export const useSendTransaction = mockWagmi.useSendTransaction
export const useSwitchAccount = mockWagmi.useSwitchAccount
export default mockWagmi
