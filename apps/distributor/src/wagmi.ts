import {
  sendTokenAddress,
  sendMerkleDropAbi,
  baseMainnet,
  baseMainnetClient,
  erc20Abi,
  multicall3Address,
} from '@my/wagmi'
import { byteaToHex } from 'app/utils/byteaToHex'
import { assert } from 'app/utils/assert'

/**
 * Fetches the balances of all hodler addresses in qualification period
 *
 * @returns An array of promises that resolve to the balances of each address
 */
export async function fetchAllBalances({
  addresses,
  distribution,
}: {
  addresses: Array<{ user_id: string; address: `0x${string}` }>
  distribution: { number: number; chain_id: number; snapshot_block_num: number | null }
}): Promise<
  {
    user_id: string
    address: `0x${string}`
    balance: string
  }[]
> {
  const results = await baseMainnetClient.multicall({
    multicallAddress: multicall3Address[baseMainnet.id],
    allowFailure: false,
    contracts: addresses.map(({ user_id, address }) => ({
      address: sendTokenAddress[baseMainnet.id],
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    })),
    blockNumber: distribution.snapshot_block_num
      ? BigInt(distribution.snapshot_block_num)
      : undefined,
  })
  assert(results.length === addresses.length, 'Invalid results length')
  return results.map((result, i) => {
    const { user_id, address } = addresses[i] ?? {}
    if (!user_id || !address) throw new Error('Invalid user_id or address')
    const balance = String(result)
    return {
      user_id,
      address,
      balance,
    }
  })
}

export async function isMerkleDropActive(distribution: {
  number: number
  chain_id: number
  merkle_drop_addr: string | null
}) {
  const address = byteaToHex(distribution.merkle_drop_addr as `\\x${string}`)
  return baseMainnetClient.readContract({
    abi: sendMerkleDropAbi,
    address,
    functionName: 'trancheActive',
    args: [BigInt(distribution.number - 1)], // tranche is 0-indexed
  })
}
