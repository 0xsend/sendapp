import { decodeFunctionData } from 'viem'
import { sendAccountAbi, erc20Abi } from '@my/wagmi'
import type { UserOperation } from 'permissionless'
import type { allCoinsDict } from 'app/data/coins'

export function decodeTransferUserOp({ userOp }: { userOp: UserOperation<'v0.7'> }) {
  const { args } = decodeFunctionData({ abi: sendAccountAbi, data: userOp.callData })

  const decodedTokenTransfer =
    args?.[0]?.[0].data !== '0x'
      ? decodeFunctionData({ abi: erc20Abi, data: args?.[0]?.[0].data })
      : undefined

  const amount = (
    decodedTokenTransfer ? decodedTokenTransfer.args[1] : args?.[0]?.[0].value
  ) as bigint

  const to = (
    decodedTokenTransfer ? decodedTokenTransfer.args[0] : args?.[0]?.[0].dest
  ) as `0x${string}`
  const token = (decodedTokenTransfer ? args?.[0]?.[0].dest : 'eth') as keyof allCoinsDict
  return { from: userOp.sender, to, token, amount }
}
