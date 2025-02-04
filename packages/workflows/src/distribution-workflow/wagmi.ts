import {
  config,
  readSendTokenBalanceOf,
  type sendTokenAddress,
  readSendMerkleDropTrancheActive,
  type sendMerkleDropAddress,
} from '@my/wagmi'
import type { Tables } from '@my/supabase/database.types'

/**
 * Fetches the balances of all hodler addresses in qualification period
 *
 * @returns An array of promises that resolve to the balances of each address
 */
export function fetchAllBalances({
  addresses,
  distribution,
}: {
  addresses: Array<{ user_id: string; address: `0x${string}` }>
  distribution: Tables<'distributions'>
}) {
  return addresses.map(async ({ user_id, address }) => {
    const balance = await readSendTokenBalanceOf(config, {
      args: [address],
      chainId: distribution.chain_id as keyof typeof sendTokenAddress,
      blockNumber: distribution.snapshot_block_num
        ? BigInt(distribution.snapshot_block_num)
        : undefined,
    })
    return {
      user_id,
      address,
      balance: balance.toString(),
    }
  })
}

export async function isMerkleDropActive(distribution: Tables<'distributions'>) {
  return readSendMerkleDropTrancheActive(config, {
    chainId: distribution.chain_id as keyof typeof sendMerkleDropAddress,
    args: [BigInt(distribution.tranche_id)], // number is 1-indexed
  })
}
