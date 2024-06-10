const mockMyWagmi = {
  baseMainnetClient: {
    chain: {
      id: 845337,
      name: 'Ethereum',
      nativeCurrency: {
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
    },
    transport: {
      url: 'http://localhost:8546',
    },
  },
  baseMainnet: {
    id: 845337,
    name: 'Base',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    blockExplorers: {
      default: {
        name: 'Basescan',
        url: 'https://basescan.io',
      },
    },
  },
  usdcAddress: {
    845337: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  sendTokenAddress: {
    845337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  },
  useWriteErc20Transfer: jest.fn().mockReturnValue({
    data: '0x123',
    writeContract: jest.fn(),
    isPending: false,
    error: null,
  }),
}

export const useWriteErc20Transfer = mockMyWagmi.useWriteErc20Transfer
export const baseMainnetClient = mockMyWagmi.baseMainnetClient
export const baseMainnet = mockMyWagmi.baseMainnet
export const usdcAddress = mockMyWagmi.usdcAddress
export const sendTokenAddress = mockMyWagmi.sendTokenAddress
export default mockMyWagmi
