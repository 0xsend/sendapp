import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import { expect } from '@playwright/test'
export { testBaseClient } from './base'
export { testMainnetClient } from './mainnet'
import { isEthCoin, type coin } from 'app/data/coins'

import { testBaseClient } from './base'

export const lookupBalance = async ({
  address,
  token: tokenAddress,
}: {
  address: `0x${string}`
  token: `0x${string}`
}) => {
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

/**
 * Funds the given address with the given amount of the given token
 */
export async function fund({
  address,
  amount,
  coin,
}: {
  address: `0x${string}`
  amount: bigint
  coin: coin
}) {
  if (isEthCoin(coin)) {
    await testBaseClient.setBalance({
      address: address,
      value: amount,
    })
    expect(await testBaseClient.getBalance({ address })).toBe(amount)
  } else {
    await setERC20Balance({
      client: testBaseClient,
      address: address,
      tokenAddress: coin.token,
      value: amount,
    })
    expect(
      await lookupBalance({
        address: address,
        token: coin.token,
      })
    ).toBe(amount)
  }
}
