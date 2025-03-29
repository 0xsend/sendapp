import { decodeFunctionData, isAddress } from 'viem'
import { sendAccountAbi, erc20Abi } from '@my/wagmi'
import type { UserOperation } from 'permissionless'
import { allCoinsDict } from 'app/data/coins'

export function decodeTransferUserOp({ userOp }: { userOp: UserOperation<'v0.7'> }) {
  const { args } = decodeFunctionData({ abi: sendAccountAbi, data: userOp.callData })

  const from = isAddress(userOp.sender) ? userOp.sender : null

  const decodedTokenTransfer =
    args?.[0]?.[0].data !== '0x'
      ? decodeFunctionData({ abi: erc20Abi, data: args?.[0]?.[0].data })
      : null

  const rawAmount = decodedTokenTransfer ? decodedTokenTransfer.args?.[1] : args?.[0]?.[0].value
  const amount = typeof rawAmount === 'bigint' ? rawAmount : null

  const rawTo = decodedTokenTransfer ? decodedTokenTransfer.args[0] : args?.[0]?.[0].dest
  const to = isAddress(rawTo) ? rawTo : null

  const rawToken = decodedTokenTransfer ? args?.[0]?.[0].dest : 'eth'
  const token = rawToken in allCoinsDict || rawToken === 'eth' ? rawToken : null

  return {
    from,
    to,
    token,
    amount,
  }
}
