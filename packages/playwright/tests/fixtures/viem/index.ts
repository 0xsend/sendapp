export { testMainnetClient } from './mainnet'
export { testBaseClient } from './base'

import { testBaseClient } from './base'

// playwright is incompatible with esm modules only like wagmi, hardcode the USDC address
export const usdcAddress = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  1337: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  845337: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const

export const sendTokenAddresses = {
  1: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  1337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  8453: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  84532: '0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680',
  845337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
}

export const lookupBalance = async ({
  address,
  tokenAddress,
}: { address: `0x${string}`; tokenAddress: `0x${string}` }) => {
  return await testBaseClient.readContract({
    address: tokenAddress,
    abi: [
      {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ type: 'address' }],
        outputs: [{ type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: [address],
  })
}
