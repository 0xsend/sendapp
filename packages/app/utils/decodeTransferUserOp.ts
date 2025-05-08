import { type Address, isAddress } from 'viem'
import type { UserOperation } from 'permissionless'
import { allCoinsDict } from 'app/data/coins'
import { decodeExecuteBatchCalldata, decodeTransferCallData } from './decode-calldata'
import { assert } from './assert'

const TRANSFER_SIG = '0xddf252ad'

export type SendAccountTransferCall = {
  from: Address
  to: Address
  token: Address | 'eth'
  amount: bigint
}

/**
 * Decodes the calldata for a user operation transfer erc20 tokens.
 *
 * @throws {Error} If the user operation does not contain a valid ERC20 transfer.
 *
 */
export function decodeTransferUserOp({
  userOp,
}: { userOp: UserOperation<'v0.7'> }): SendAccountTransferCall {
  const from = userOp.sender
  assert(isAddress(userOp.sender), 'Sender is not a valid hex address')
  // Decode the outer executeBatch call
  const calls = decodeExecuteBatchCalldata(userOp.callData)

  const transferCall = calls.find((c) => {
    c.data.startsWith(TRANSFER_SIG)
  })

  if (transferCall) {
    const token = transferCall.dest
    assert(isAddress(token), 'Invalid token address')
    assert(token in allCoinsDict, 'Unsupported token')

    const decoded = decodeTransferCallData(transferCall.data)
    return {
      ...decoded,
      from,
      token,
    }
  }

  const ethTransferCall = calls.find((c) => {
    c.data === '0x'
  })
  if (ethTransferCall) {
    const token = 'eth'
    const amount = ethTransferCall.value
    const to = ethTransferCall.dest
    assert(typeof amount === 'bigint', 'Invalid amount')
    assert(isAddress(to), 'Invalid to address')
    return {
      from,
      to,
      token,
      amount,
    }
  }

  throw new Error('Failed to decode a valid Send Account Transfer from user op')
}
