export { testBaseClient } from './base'
export { testMainnetClient } from './mainnet'

import { testBaseClient } from './base'

export const lookupBalance = async ({
  address,
  token: tokenAddress,
}: { address: `0x${string}`; token: `0x${string}` }) => {
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
