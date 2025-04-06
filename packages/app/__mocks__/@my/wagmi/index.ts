const mockMyWagmi = {
  __esModule: true,
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
    845337: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
  },
  sendTokenV0Address: {
    845337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  },
  spx6900Address: {
    845337: '0x50dA645f148798F68EF2d7dB7C1CB22A6819bb2C',
  },
  moonwellAddress: {
    845337: '0xbe08a91ade130ad61193be2321ea06c4c39e124a',
  },
  morphoAddress: {
    845337: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842',
  },
  aerodromeFinanceAddress: {
    845337: '0x940181a94a35a4569e4529a3cdfb74e38fd98631',
  },
  coinbaseWrappedBtcAddress: {
    845337: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  },
  eurcAddress: {
    845337: '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42',
  },
  tokenPaymasterAddress: {
    845337: '0x5e421172B27658f2bD83BCBD13738ADdE00E7CA9',
  },
  entryPointAddress: {
    845337: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  },
  sendtagCheckoutAddress: {
    845337: '0xfC1e51BBae1C1Ee9e6Cc629ea0023329EA5023a6',
  },
  sendVerifierAbi: [
    {
      type: 'function',
      inputs: [
        { name: 'message', internalType: 'bytes', type: 'bytes' },
        { name: 'signature', internalType: 'bytes', type: 'bytes' },
        { name: 'x', internalType: 'uint256', type: 'uint256' },
        { name: 'y', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'verifySignature',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
      stateMutability: 'view',
    },
  ],
  sendVerifierProxyAddress: {
    845337: '0x6c38612d3f645711dd080711021fC1bA998a5628',
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
export const sendTokenV0Address = mockMyWagmi.sendTokenV0Address
export const spx6900Address = mockMyWagmi.spx6900Address
export const moonwellAddress = mockMyWagmi.moonwellAddress
export const morphoAddress = mockMyWagmi.morphoAddress
export const aerodromeFinanceAddress = mockMyWagmi.aerodromeFinanceAddress
export const coinbaseWrappedBtcAddress = mockMyWagmi.coinbaseWrappedBtcAddress
export const eurcAddress = mockMyWagmi.eurcAddress
export const tokenPaymasterAddress = mockMyWagmi.tokenPaymasterAddress
export const entryPointAddress = mockMyWagmi.entryPointAddress
export const sendVerifierAbi = mockMyWagmi.sendVerifierAbi
export const sendtagCheckoutAddress = mockMyWagmi.sendtagCheckoutAddress
export const sendVerifierProxyAddress = mockMyWagmi.sendVerifierProxyAddress
export default mockMyWagmi
